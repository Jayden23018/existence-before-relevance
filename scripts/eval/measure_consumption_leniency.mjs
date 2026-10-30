// Measure how much the static scorer's lack of consumption tracking inflates
// strict TCR.
//
// scripts/eval/static_plan_eval.js validatePlanCorrectness() never decrements
// its `availableItems` map: an item, once produced, satisfies every later
// requirement without limit. The runtime PlanValidator does consume. This
// script quantifies the gap on the frozen benchmark's stored plans.
//
// Method: independent whole-plan material balance. Walk each plan's commands in
// order over an inventory that is debited as well as credited, and count the
// tasks that strict-pass today but contain at least one craft/smelt whose
// ingredients are not covered when each produced unit may be spent only once.
//
// The detector is deliberately CONSERVATIVE -- every ambiguity resolves toward
// "no violation" -- so the reported count is a lower bound on the flips a
// consumption-tracking scorer would produce.
//
// Usage: node scripts/eval/measure_consumption_leniency.mjs [--mcnemar] [--replication] [--list <run>] [--demos] [--bycat] [--quantity]
import { readFileSync, existsSync } from 'fs';
import { validatePlanCorrectness } from './static_plan_eval.js';
import { SMELTING_OUTPUTS, BLOCK_DROP_ALIASES } from '../../src/models/enhancers/plan_validator.js';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';

const resolver = new RecipeResolver({ version: '1.20.4' });
const R = 'scripts/eval/results/';

const RUNS = {
    'qwen3-8b/no_ret': `${R}canonical/eval_20260605_213048_no_retrieval`,
    'qwen3-8b/saer_cold': `${R}fixed_mcdata/eval_20260621_004648_saer_cold`,
    'gpt-4o/no_ret': `${R}canonical/eval_20260605_213059_no_retrieval`,
    'gpt-4o/saer_cold': `${R}fixed_mcdata/eval_20260621_013640_saer_cold`,
    'claude/no_ret': `${R}canonical/eval_20260605_233949_no_retrieval`,
    'claude/saer_cold': `${R}fixed_mcdata/eval_20260621_021308_saer_cold`,
    'qwen-max/no_ret': `${R}canonical/eval_20260604_213651_no_retrieval`,
    'qwen-max/random': `${R}canonical/eval_20260605_000159_random_retrieval`,
    'qwen-max/bm25': `${R}canonical/eval_20260605_004805_bm25_retrieval`,
    'qwen-max/saer_cold': `${R}fixed_mcdata/eval_20260621_001120_saer_cold`,
    'deepseek/no_ret': `${R}canonical/eval_20260604_231018_no_retrieval`,
    'deepseek/saer_cold': `${R}fixed_mcdata/eval_20260621_011658_saer_cold`,
};

// --replication swaps in the Gemma4 panel (same run IDs as mcnemar_table.mjs).
// It REPLACES the primary runs rather than extending them, so the default
// output -- whose pooled 84/413 the paper quotes -- stays byte-identical.
const REPLICATION_RUNS = {
    'gemma4-26b/no_ret': `${R}eval_20260611_204737_no_retrieval`,
    'gemma4-26b/saer_cold': `${R}fixed_mcdata/eval_20260621_144219_saer_cold`,
    'gemma4-31b/no_ret': `${R}eval_20260612_235009_no_retrieval`,
    'gemma4-31b/saer_cold': `${R}fixed_mcdata/eval_20260621_202849_saer_cold`,
};
const REPLICATION = process.argv.includes('--replication');
const ACTIVE_RUNS = REPLICATION ? REPLICATION_RUNS : RUNS;

const CMD_RE = /!?(\w+)\(\s*['"]([^'"]+)['"]\s*(?:,\s*(\d+))?/;

function stepCommands(step) {
    if (step.action_cmd?.length > 0) return step.action_cmd;
    if (step.command) return [step.command];
    return [];
}

const take = (inv, name) => inv.get(name) || 0;
const give = (inv, name, n) => inv.set(name, take(inv, name) + n);

/**
 * Walk a plan debiting as well as crediting.
 * @returns {string[]} material-balance violations (empty = balanced)
 */
export function materialBalanceViolations(plan) {
    const inv = new Map();
    const violations = [];
    for (const step of plan.steps || []) {
        for (const cmd of stepCommands(step)) {
            const m = cmd.match(CMD_RE);
            if (!m) continue;
            const [, name, arg, countStr] = m;
            const n = parseInt(countStr) || 1;

            if (name === 'collectBlocks') {
                const drop = BLOCK_DROP_ALIASES[arg] || arg;
                give(inv, drop, n);
                // gravel drops flint as a bonus; the harness credits it too
                if (arg === 'gravel') give(inv, 'flint', n);
                continue;
            }

            if (name === 'smeltItem') {
                // Conservative: an unknown/mis-named input is not charged.
                if (take(inv, arg) >= n) {
                    inv.set(arg, take(inv, arg) - n);
                    give(inv, SMELTING_OUTPUTS[arg] || arg, n);
                } else {
                    give(inv, SMELTING_OUTPUTS[arg] || arg, n);
                }
                continue;
            }

            if (name === 'craftRecipe') {
                const recipes = resolver.craftingRecipesFor(arg) || [];
                if (recipes.length === 0) { give(inv, arg, n); continue; }
                // Prefer any variant that is fully affordable; charge it.
                let charged = null;
                for (const r of recipes) {
                    const ops = Math.ceil(n / (r.outputCount || 1));
                    if (r.ingredients.every(i => take(inv, i.name) >= i.count * ops)) {
                        charged = { r, ops };
                        break;
                    }
                }
                if (charged) {
                    for (const i of charged.r.ingredients) {
                        inv.set(i.name, take(inv, i.name) - i.count * charged.ops);
                    }
                    // The bot yields ops x outputCount, which is >= n (skills.js
                    // craftRecipe: desiredOps = ceil(num / yieldPerCraft)). Credit
                    // the real yield, not n, or later steps are under-supplied.
                    give(inv, arg, charged.ops * (charged.r.outputCount || 1));
                    continue;
                } else {
                    // Not affordable under single-spend accounting. Only report it
                    // when the scorer's own no-consumption view WOULD have been
                    // satisfied -- i.e. every ingredient was produced at some
                    // point -- otherwise this is an ordinary missing-ingredient
                    // gap the scorer already catches, not a consumption artefact.
                    const everProduced = recipes.some(r => {
                        const ops = Math.ceil(n / (r.outputCount || 1));
                        return r.ingredients.every(i => (inv.has(i.name) || take(inv, i.name) >= i.count * ops));
                    });
                    if (everProduced) {
                        // Name the missing INGREDIENT, not the item being crafted:
                        // "iron_axe x1" reads as if iron were short when the plan is
                        // actually two sticks down, and an unauditable message is a
                        // message nobody can check.
                        const best = recipes[0];
                        const ops = Math.ceil(n / (best.outputCount || 1));
                        const missing = best.ingredients
                            .filter(i => take(inv, i.name) < i.count * ops)
                            .map(i => `${i.name} ${take(inv, i.name)}/${i.count * ops}`)
                            .join(' + ');
                        violations.push(`${arg} x${n} (has ${missing || 'n/a'})`);
                    }
                }
                give(inv, arg, n);
                continue;
            }
        }
    }
    return violations;
}

function selfTest() {
    const mk = steps => ({ steps });
    const dbl = mk([
        { step: 1, action_cmd: ["!collectBlocks('oak_log', 4)"] },
        { step: 2, action_cmd: ["!craftRecipe('oak_planks', 16)"] },
        { step: 3, action_cmd: ["!craftRecipe('stick', 4)"] },
        { step: 4, action_cmd: ["!collectBlocks('iron_ore', 3)"] },
        { step: 5, action_cmd: ["!smeltItem('raw_iron', 3)"] },
        { step: 6, action_cmd: ["!craftRecipe('iron_axe', 1)"] },
        { step: 7, action_cmd: ["!craftRecipe('iron_pickaxe', 1)"] },
    ]);
    const ok = mk([
        { step: 1, action_cmd: ["!collectBlocks('oak_log', 4)"] },
        { step: 2, action_cmd: ["!craftRecipe('oak_planks', 16)"] },
        { step: 3, action_cmd: ["!craftRecipe('stick', 4)"] },
        { step: 4, action_cmd: ["!collectBlocks('iron_ore', 6)"] },
        { step: 5, action_cmd: ["!smeltItem('raw_iron', 6)"] },
        { step: 6, action_cmd: ["!craftRecipe('iron_axe', 1)"] },
        { step: 7, action_cmd: ["!craftRecipe('iron_pickaxe', 1)"] },
    ]);
    const a = materialBalanceViolations(dbl);
    const b = materialBalanceViolations(ok);
    console.log(`self-test  double-spend (3 ingots, two 3-ingot crafts): ${a.length > 0 ? 'DETECTED' : 'MISSED'} ${JSON.stringify(a)}`);
    console.log(`self-test  balanced     (6 ingots, two 3-ingot crafts): ${b.length === 0 ? 'clean' : 'FALSE POSITIVE ' + JSON.stringify(b)}`);
    if (a.length === 0 || b.length !== 0) { console.error('SELF-TEST FAILED'); process.exit(1); }
    console.log('self-test  OK\n');
}

// Everything below runs only when this file is the entry point, so that
// retriever_defect_exposure.mjs can import materialBalanceViolations().
const IS_MAIN = process.argv[1] && process.argv[1].endsWith('measure_consumption_leniency.mjs');
if (!IS_MAIN) { /* imported as a library */ } else {

selfTest();

let totPass = 0, totFlip = 0;
console.log('run                        strict-pass  balance-violating  (majority vote, n=60)');
for (const [runId, prefix] of Object.entries(ACTIVE_RUNS)) {
    const files = [1, 2, 3].map(i => `${prefix}_s${i}.json`);
    if (!files.every(f => existsSync(f))) { console.log(`${runId.padEnd(26)} [seed files absent]`); continue; }
    const passVotes = new Map(), flipVotes = new Map();
    for (const f of files) {
        const data = JSON.parse(readFileSync(f, 'utf-8'));
        for (const t of (data.tasks || data.results || data)) {
            if (!passVotes.has(t.slug)) { passVotes.set(t.slug, 0); flipVotes.set(t.slug, 0); }
            if (!t.plan) continue;
            const v = validatePlanCorrectness(t, t.plan, [], resolver);
            if (!v.strict_pass) continue;
            passVotes.set(t.slug, passVotes.get(t.slug) + 1);
            if (materialBalanceViolations(t.plan).length > 0) flipVotes.set(t.slug, flipVotes.get(t.slug) + 1);
        }
    }
    let pass = 0, flip = 0;
    for (const [slug, p] of passVotes) {
        if (p >= 2) { pass++; if (flipVotes.get(slug) >= 2) flip++; }
    }
    totPass += pass; totFlip += flip;
    console.log(`${runId.padEnd(26)} ${String(pass).padStart(11)}  ${String(flip).padStart(17)}`);
}
if (totPass === 0) {
    console.error('\nNo run produced a strict pass. The result paths above are relative to the\n' +
        'repository root -- run this from the repo root, not from scripts/ or elsewhere.\n' +
        'Refusing to report 0/0 as if it were a measurement.');
    process.exit(1);
}
console.log(`\npooled: ${totFlip}/${totPass} majority-vote strict passes contain a material-balance violation` +
    ` (${(100 * totFlip / totPass).toFixed(1)}%)`);

// --list <runId>: print the violating slugs and the offending craft for one run.
const li = process.argv.indexOf('--list');
if (li >= 0) {
    const runId = process.argv[li + 1];
    const f = `${ACTIVE_RUNS[runId]}_s1.json`;
    const data = JSON.parse(readFileSync(f, 'utf-8'));
    for (const t of (data.tasks || data.results || data)) {
        if (!t.plan) continue;
        if (!validatePlanCorrectness(t, t.plan, [], resolver).strict_pass) continue;
        const v = materialBalanceViolations(t.plan);
        if (v.length) console.log(`${t.slug.padEnd(28)} ${t.level}  short on: ${v.join(', ')}`);
    }
}

// --mcnemar: recompute the paired tests with balance-violating passes forced to
// fail, i.e. the verdict a consumption-tracking scorer would reach.
if (process.argv.includes('--mcnemar')) {
    const corrected = new Map();
    for (const [runId, prefix] of Object.entries(ACTIVE_RUNS)) {
        const files = [1, 2, 3].map(i => `${prefix}_s${i}.json`);
        if (!files.every(f => existsSync(f))) continue;
        const votes = new Map();
        for (const f of files) {
            for (const t of (JSON.parse(readFileSync(f, 'utf-8')).tasks || [])) {
                if (!votes.has(t.slug)) votes.set(t.slug, []);
                const ok = t.plan
                    && validatePlanCorrectness(t, t.plan, [], resolver).strict_pass
                    && materialBalanceViolations(t.plan).length === 0;
                votes.get(t.slug).push(!!ok);
            }
        }
        const mv = new Map();
        for (const [slug, v] of votes) mv.set(slug, v.filter(Boolean).length > v.length / 2);
        corrected.set(runId, mv);
    }
    const logChoose = (n, k) => { let s = 0; for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i); return s; };
    function exactP(b, c) {
        const n = b + c; if (n === 0) return 1;
        const lo = Math.min(b, c); let s = 0;
        for (let i = 0; i <= lo; i++) s += Math.exp(logChoose(n, i) - n * Math.LN2);
        return Math.min(1, 2 * s);
    }
    const PAIRS = REPLICATION ? [
        ['gemma4-26b/saer_cold', 'gemma4-26b/no_ret'], ['gemma4-31b/saer_cold', 'gemma4-31b/no_ret'],
    ] : [
        ['qwen3-8b/saer_cold', 'qwen3-8b/no_ret'], ['gpt-4o/saer_cold', 'gpt-4o/no_ret'],
        ['claude/saer_cold', 'claude/no_ret'], ['qwen-max/saer_cold', 'qwen-max/no_ret'],
        ['deepseek/saer_cold', 'deepseek/no_ret'],
        ['qwen-max/random', 'qwen-max/no_ret'], ['qwen-max/bm25', 'qwen-max/no_ret'],
        ['qwen-max/bm25', 'qwen-max/random'], ['qwen-max/saer_cold', 'qwen-max/bm25'],
    ];
    console.log('\nconsumption-corrected paired tests (alpha\' = 0.0038)');
    console.log('comparison                              A    B    b   c        p   verdict');
    for (const [A, B] of PAIRS) {
        const a = corrected.get(A), bm = corrected.get(B);
        if (!a || !bm) continue;
        let b = 0, c = 0, na = 0, nb = 0;
        for (const [slug, pa] of a) {
            if (!bm.has(slug)) continue;
            const pb = bm.get(slug);
            if (pa) na++; if (pb) nb++;
            if (pa && !pb) b++; else if (!pa && pb) c++;
        }
        const p = exactP(b, c);
        const verdict = p < 0.0038 ? 'family-wise' : p < 0.05 ? 'nominal' : 'n.s.';
        console.log(`${(A + ' vs ' + B).padEnd(38)} ${String(na).padStart(3)}  ${String(nb).padStart(3)}  ${String(b).padStart(3)} ${String(c).padStart(3)}  ${p.toExponential(2).padStart(8)}   ${verdict}`);
    }
}

// --demos: audit the demonstration banks themselves. A demonstration that is
// materially short teaches the quantity error it contains.
if (process.argv.includes('--demos')) {
    const BANKS = ['crafting', 'collecting', 'combat', 'build'];
    // The crafting bank has two revisions and they give different answers (11 vs
    // 1 of 25 short). The release pins the EVALUATION-TIME revision, which is the
    // pool the reported runs retrieved over and therefore the one to audit.
    // Override with CRAFTING_BANK=<path> to check the corrected revision instead.
    const craftingOverride = process.env.CRAFTING_BANK || null;
    console.log('\ndemonstration-bank material balance (cold start, empty inventory)');
    console.log(`crafting bank: ${craftingOverride || 'data/training/crafting_examples.json (evaluation-time revision as shipped)'}`);
    let tot = 0, bad = 0;
    for (const bank of BANKS) {
        const path = (bank === 'crafting' && craftingOverride)
            ? craftingOverride
            : `data/training/${bank}_examples.json`;
        if (!existsSync(path)) { console.log(`${bank}: [absent]`); continue; }
        const raw = JSON.parse(readFileSync(path, 'utf-8'));
        const items = Array.isArray(raw) ? raw : (raw.examples || raw.data || []);
        const offenders = [];
        for (const ex of items) {
            if (!ex.plan) continue;
            tot++;
            const v = materialBalanceViolations({ steps: ex.plan });
            if (v.length) { bad++; offenders.push(`${ex.slug || ex.name} [${ex.level}] short: ${v.join(', ')}`); }
        }
        console.log(`\n${bank}_examples.json: ${items.length} entries, ${offenders.length} materially short`);
        for (const o of offenders) console.log(`   ${o}`);
    }
    if (tot === 0) {
        console.error('\nNo demonstration bank was read. Paths are relative to the repository\n' +
            'root -- run this from the repo root. Refusing to report 0/0.');
        process.exit(1);
    }
    console.log(`\npooled demonstrations: ${bad}/${tot} materially short`);
}

// --bycat: violation rate among strict passes, split by task category. Each
// category retrieves from its own demonstration bank, so a per-category gap is
// evidence that plans inherit their bank's material-budgeting quality.
if (process.argv.includes('--bycat')) {
    const cat = s => s.split('/')[0];
    console.log('\nviolation rate among strict passes, by task category');
    console.log('run                        craft        collect      combat');
    for (const [runId, prefix] of Object.entries(ACTIVE_RUNS)) {
        const files = [1, 2, 3].map(i => `${prefix}_s${i}.json`);
        if (!files.every(f => existsSync(f))) continue;
        const pv = new Map(), fv = new Map();
        for (const f of files) {
            for (const t of (JSON.parse(readFileSync(f, 'utf-8')).tasks || [])) {
                if (!pv.has(t.slug)) { pv.set(t.slug, 0); fv.set(t.slug, 0); }
                if (!t.plan || !validatePlanCorrectness(t, t.plan, [], resolver).strict_pass) continue;
                pv.set(t.slug, pv.get(t.slug) + 1);
                if (materialBalanceViolations(t.plan).length) fv.set(t.slug, fv.get(t.slug) + 1);
            }
        }
        const acc = { craft: [0, 0], collect: [0, 0], combat: [0, 0] };
        for (const [slug, p] of pv) {
            const c = cat(slug); if (!acc[c]) continue;
            if (p >= 2) { acc[c][1]++; if (fv.get(slug) >= 2) acc[c][0]++; }
        }
        const fmt = c => { const [v, n] = acc[c]; return n ? `${v}/${n} (${Math.round(100 * v / n)}%)`.padEnd(12) : '-'.padEnd(12); };
        console.log(`${runId.padEnd(26)} ${fmt('craft')} ${fmt('collect')} ${fmt('combat')}`);
    }
}

// --quantity: fingerprint test for quantity inheritance. The collecting bank
// opens with craftRecipe('oak_planks', 4) (1 log, short for a pickaxe); the
// crafting bank opens with 12 (3 logs, sufficient). If plans copy the number
// from whichever bank they retrieved, the distribution should track the bank.
if (process.argv.includes('--quantity')) {
    const cat = s => s.split('/')[0];
    console.log('\noak_planks count emitted in generated plans (all seeds, per trial)');
    console.log('run                        cat        n    =4    =12   other  median');
    for (const [runId, prefix] of Object.entries(ACTIVE_RUNS)) {
        const files = [1, 2, 3].map(i => `${prefix}_s${i}.json`);
        if (!files.every(f => existsSync(f))) continue;
        const by = {};
        for (const f of files) {
            for (const t of (JSON.parse(readFileSync(f, 'utf-8')).tasks || [])) {
                if (!t.plan) continue;
                const c = cat(t.slug);
                for (const step of t.plan.steps || []) {
                    for (const cmd of stepCommands(step)) {
                        const m = cmd.match(/craftRecipe\(\s*['"]oak_planks['"]\s*,\s*(\d+)/);
                        if (m) (by[c] = by[c] || []).push(parseInt(m[1]));
                    }
                }
            }
        }
        for (const c of ['craft', 'collect', 'combat']) {
            const v = by[c]; if (!v || !v.length) continue;
            const s = [...v].sort((a, b) => a - b);
            const med = s[Math.floor(s.length / 2)];
            const n4 = v.filter(x => x === 4).length, n12 = v.filter(x => x === 12).length;
            console.log(`${runId.padEnd(26)} ${c.padEnd(9)} ${String(v.length).padStart(3)}  ${String(n4).padStart(4)}  ${String(n12).padStart(4)}  ${String(v.length - n4 - n12).padStart(5)}  ${String(med).padStart(6)}`);
        }
    }
}

} // end IS_MAIN
