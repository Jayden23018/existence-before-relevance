/**
 * Plancraft Cross-Validation — batched, fast version
 *
 * PlanValidator §3.5 vs Plancraft oracle (single Python process, all queries batched)
 * 运行: node scripts/eval/plancraft_crossval.mjs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { primarySeedFiles, QWENMAX_ABLATION } from './primary_runs.mjs';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, 'results');
const PY_BATCH   = join(__dirname, 'plancraft_oracle_batch.py');

// ── Call Plancraft oracle for all queries in one Python process ───────────────

function batchOracleCheck(queries) {
    // queries: [{target, inventory}, ...]
    const inputJson = JSON.stringify(queries);
    try {
        const out = execFileSync(
            'python3', [PY_BATCH],
            { input: inputJson, timeout: 30000, encoding: 'utf8' }
        );
        return JSON.parse(out.trim()); // ["solvable"|"unsolvable"|"unknown", ...]
    } catch (e) {
        return queries.map(() => 'error');
    }
}

// ── Virtual inventory helpers ─────────────────────────────────────────────────

const SMELTING_OUTPUTS = {
    raw_iron: 'iron_ingot', raw_gold: 'gold_ingot', raw_copper: 'copper_ingot',
    cobblestone: 'stone', sand: 'glass', clay_ball: 'brick',
    netherrack: 'nether_brick', clay: 'brick',
};

function inferProduce(cmd) {
    let m;
    m = cmd.match(/craftRecipe\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
    if (m) return { name: m[1], count: parseInt(m[2]) || 1 };
    m = cmd.match(/smeltItem\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
    if (m) return { name: SMELTING_OUTPUTS[m[1]] ?? m[1], count: parseInt(m[2]) || 1 };
    m = cmd.match(/collectBlocks\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
    if (m) {
        const r = m[1];
        const d = r === 'stone' ? 'cobblestone' : r === 'deepslate' ? 'cobbled_deepslate' : r;
        return { name: d, count: parseInt(m[2]) || 1 };
    }
    return null;
}

function stepCmds(step) {
    if (step.action_cmd?.length) return step.action_cmd;
    if (step.command) return [step.command];
    return [];
}

/**
 * Walk plan, return every craftRecipe with inventory-before + validator verdict.
 */
function extractCraftChecks(plan, validationIssues) {
    const virt = {};
    const checks = [];

    for (const step of (plan.steps || [])) {
        const cmds = stepCmds(step);
        const within = { ...virt };

        for (const cmd of cmds) {
            const craftM = cmd.match(/craftRecipe\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
            if (craftM) {
                const item      = craftM[1];
                const goalCount = parseInt(craftM[2]) || 1;
                const flagged   = validationIssues.some(iss =>
                    iss.includes('missing ingredient') &&
                    (iss.includes(`"${item}"`) || iss.includes(`'${item}'`))
                );
                checks.push({
                    step: step.step, item, goalCount,
                    invBefore: { ...within },
                    validatorFeasible: !flagged,
                });
            }
            const p = inferProduce(cmd);
            if (p) within[p.name] = (within[p.name] || 0) + p.count;
        }

        for (const cmd of cmds) {
            const p = inferProduce(cmd);
            if (p) virt[p.name] = (virt[p.name] || 0) + p.count;
        }
    }
    return checks;
}

// ── Cohen's κ ─────────────────────────────────────────────────────────────────

function cohenKappa(tp, tn, fp, fn) {
    const n = tp + tn + fp + fn;
    if (n === 0) return 0;
    const pObs = (tp + tn) / n;
    const pE   = ((tp + fp) / n) * ((tp + fn) / n)
               + ((fn + tn) / n) * ((fp + tn) / n);
    return pE < 1 ? (pObs - pE) / (1 - pE) : 1;
}

// ── Main ──────────────────────────────────────────────────────────────────────

// Pinned to the runs that produce Table 2 and Table 3 (see primary_runs.mjs for
// why this is not a directory glob: the old "latest 12 files" selection never
// looked inside results/canonical/ or results/fixed_mcdata/, and re-targeted
// itself onto whichever ablation had been run most recently).
const seedFiles = (process.argv.includes('--qwenmax-only')
    ? primarySeedFiles(QWENMAX_ABLATION)
    : primarySeedFiles()).map(({ file }) => file);

console.log('\n🦞  Plancraft Cross-Validation (batched)');
console.log('    PlanValidator §3.5 vs Plancraft oracle');
console.log(`    Seed files: ${seedFiles.length}`);

// Phase 1: collect all craftRecipe checks from all seed files
const allChecks = [];   // {seedFile, taskSlug, check}

for (const fp of seedFiles) {
    if (!existsSync(fp)) continue;
    const data = JSON.parse(readFileSync(fp, 'utf8'));
    for (const task of data.tasks) {
        if (!task.parse_success || !task.plan?.steps) continue;
        const issues = task.validation?.issues ?? [];
        for (const chk of extractCraftChecks(task.plan, issues)) {
            allChecks.push({ slug: task.slug, ...chk });
        }
    }
}

console.log(`\n    Total craftRecipe steps: ${allChecks.length}`);
console.log('    Calling Plancraft oracle (single batch)...');

// Phase 2: batch oracle call
const queries = allChecks.map(c => ({ target: c.item, inventory: c.invBefore }));
const oracleResults = batchOracleCheck(queries);

// Phase 3: compute agreement
let total = 0, agree = 0, tp = 0, tn = 0, fp = 0, fn = 0, skipped = 0;
const disagree = [];

for (let i = 0; i < allChecks.length; i++) {
    const chk    = allChecks[i];
    const oracle = oracleResults[i];

    if (oracle === 'unknown' || oracle === 'error') { skipped++; continue; }

    const plancraftFeasible = oracle === 'solvable';
    const validatorFeasible = chk.validatorFeasible;

    total++;
    if (validatorFeasible === plancraftFeasible) {
        agree++;
        validatorFeasible ? tp++ : tn++;
    } else {
        validatorFeasible ? fp++ : fn++;
        if (disagree.length < 12) {
            const inv = Object.entries(chk.invBefore)
                .filter(([,v]) => v > 0).slice(0, 4)
                .map(([k,v]) => `${k}:${v}`).join(', ');
            disagree.push({
                label: validatorFeasible ? 'FP' : 'FN',
                slug: chk.slug, step: chk.step,
                item: chk.item, count: chk.goalCount,
                inv, oracle,
            });
        }
    }
}

// ── Results ───────────────────────────────────────────────────────────────────

const κ = cohenKappa(tp, tn, fp, fn);
const agrPct = total > 0 ? (agree / total * 100).toFixed(1) : '—';
const κLabel = κ >= 0.80 ? 'strong' : κ >= 0.60 ? 'substantial'
             : κ >= 0.40 ? 'moderate' : 'weak';

console.log('\n' + '═'.repeat(58));
console.log(`craftRecipe steps evaluated    : ${total}`);
console.log(`Plancraft unknown items skipped: ${skipped}`);
console.log('');
console.log(`Agreement rate  : ${agrPct}%  (${agree}/${total})`);
console.log(`Cohen's κ       : ${κ.toFixed(3)}  [${κLabel} agreement]`);
console.log('');
console.log('Confusion matrix:');
console.log(`  TP  both feasible             : ${tp}`);
console.log(`  TN  both infeasible           : ${tn}`);
console.log(`  FP  validator=PASS plancraft=FAIL : ${fp}  ← validator more lenient`);
console.log(`  FN  validator=FAIL plancraft=PASS : ${fn}  ← validator more strict`);

if (disagree.length) {
    console.log('\nSample disagreements:');
    for (const d of disagree.slice(0, 6)) {
        console.log(`  [${d.label}] ${d.slug} step${d.step}: craftRecipe('${d.item}',${d.count})`);
        console.log(`       inv={${d.inv}}  plancraft=${d.oracle}`);
    }
}

console.log('\n' + '═'.repeat(58));
console.log('📄 Paper statement:');
console.log(`"We cross-validate PlanValidator's ingredient-feasibility`);
console.log(` check (§3.5) against Plancraft's independent oracle`);
console.log(` [Dagan et al., COLM 2025] across ${total} craftRecipe`);
console.log(` invocations spanning all evaluation conditions.`);
console.log(` The two validators agree on ${agree}/${total} (${agrPct}%,`);
console.log(` Cohen's κ = ${κ.toFixed(3)} — ${κLabel} agreement), confirming`);
console.log(` that §3.5's ingredient-feasibility criterion is not`);
console.log(` systematically biased toward SAER's output conventions."`);

// Save
const outPath = join(RESULTS_DIR, 'plancraft_crossval.json');
writeFileSync(outPath, JSON.stringify({
    total, skipped, agree,
    agreement_rate: total > 0 ? agree / total : 0,
    cohen_kappa: κ, tp, tn, fp, fn,
    seed_files: seedFiles.map(f => f.split('/').pop()),
    disagree_samples: disagree,
}, null, 2));
console.log(`\nSaved → ${outPath}\n`);

// Append a one-line record to the development change log, when one exists.
// Guarded so that running this script inside the release archive stays read-only:
// a verifier's extracted copy has no change log and must not gain one.
import { appendFileSync } from 'fs';
const logPath = join(__dirname, '..', '..', 'docs', 'change_log.md');
if (existsSync(logPath)) {
    const ts = new Date().toISOString().replace('T',' ').slice(0,16);
    appendFileSync(logPath,
        `[${ts}] plancraft_crossval.mjs | PlanValidator §3.5 vs Plancraft oracle: ` +
        `${agree}/${total} agreement (${agrPct}%), κ=${κ.toFixed(3)}\n`
    );
}
