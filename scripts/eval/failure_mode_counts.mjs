// Failure-mode breakdown for the five primary-study models.
//
// Paper §6.1 claims the no-retrieval failures share three modes dominated by
// prerequisite-chain truncation, but quoted no counts. This produces them from
// the same stored seed plans and the same fixed validator that mcnemar_table.mjs
// --rescore uses, so the totals are the paper's authoritative ones.
//
//   node scripts/eval/failure_mode_counts.mjs [--latex]
//
// The run prefixes below are duplicated from mcnemar_table.mjs (which cannot be
// imported: it prints at module scope). The duplication is guarded — every
// recomputed majority-vote TCR is asserted against the published main-table value,
// so a drifted run id fails loudly instead of silently rescoring the wrong file.

import { readFileSync, existsSync } from 'fs';
import { validatePlanCorrectness } from './static_plan_eval.js';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';

const LATEX = process.argv.includes('--latex');
const R = 'scripts/eval/results/';
const resolver = new RecipeResolver({ version: '1.20.4' });

const RUNS = {
    'qwen3-8b/no_ret':    `${R}canonical/eval_20260605_213048_no_retrieval`,
    'qwen3-8b/saer_cold': `${R}fixed_mcdata/eval_20260621_004648_saer_cold`,
    'gpt-4o/no_ret':      `${R}canonical/eval_20260605_213059_no_retrieval`,
    'gpt-4o/saer_cold':   `${R}fixed_mcdata/eval_20260621_013640_saer_cold`,
    'claude/no_ret':      `${R}canonical/eval_20260605_233949_no_retrieval`,
    'claude/saer_cold':   `${R}fixed_mcdata/eval_20260621_021308_saer_cold`,
    'qwen-max/no_ret':    `${R}canonical/eval_20260604_213651_no_retrieval`,
    'qwen-max/saer_cold': `${R}fixed_mcdata/eval_20260621_001120_saer_cold`,
    'deepseek/no_ret':    `${R}canonical/eval_20260604_231018_no_retrieval`,
    'deepseek/saer_cold': `${R}fixed_mcdata/eval_20260621_011658_saer_cold`,
};

// Published main-table strict-TCR, majority vote over 3 seeds, /60.
const TABLE2_TCR = {
    'qwen3-8b/no_ret': 14, 'qwen3-8b/saer_cold': 26,
    'gpt-4o/no_ret': 23,   'gpt-4o/saer_cold': 41,
    'claude/no_ret': 25,   'claude/saer_cold': 51,
    'qwen-max/no_ret': 19, 'qwen-max/saer_cold': 49,
    'deepseek/no_ret': 33, 'deepseek/saer_cold': 52,
};

const LABELS = {
    'qwen3-8b': 'Qwen3-8B', 'gpt-4o': 'GPT-4o', 'claude': 'Claude S.\\ 4.5',
    'qwen-max': 'Qwen2.5-Max', 'deepseek': 'DeepSeek-V3',
};
const MODELS = ['qwen3-8b', 'gpt-4o', 'claude', 'qwen-max', 'deepseek'];

// The validator emits six free-text issue templates (static_plan_eval.js
// L640/669/716/733/765 and the goal check at L817).
const CLASSES = [
    ['ingredient-gap',  /missing ingredients:/],
    ['precondition-gap', /^Step \d+: missing /],
    ['tool-gap',        /requires .+, not available/],
    ['smelt-shortfall', /needs \d+ but only \d+ available/],
    ['naming-gap',      /should be smeltItem\(/],
    ['goal-not-produced', /^Goal item .* not produced by any step/],
];
const ORDER = ['ingredient-gap', 'precondition-gap', 'tool-gap', 'smelt-shortfall',
    'naming-gap', 'goal-not-produced', 'unparsed', 'uncategorised',
    // Derived: a task can exhibit several classes, so the five columns above
    // over-count. These three partition the failing tasks exactly. The third is
    // required, not decorative: the >=2-of-3 majority rule attributes nothing to
    // a task whose three seeds each fail for a different reason, so a two-way
    // prereq/goal split would silently absorb those tasks into 'goal-only'.
    'prereq-any', 'goal-only', 'unattributed'];
const PREREQ = new Set(['ingredient-gap', 'precondition-gap', 'tool-gap', 'smelt-shortfall']);

function classify(issue) {
    for (const [name, re] of CLASSES) if (re.test(issue)) return name;
    return 'uncategorised';
}

function seedFiles(prefix) {
    return ['_s1', '_s2', '_s3'].map(s => `${prefix}${s}.json`);
}

// Re-score one run: returns Map<slug, {failed, classes:Set, level}>.
function rescore(runId) {
    const prefix = RUNS[runId];
    const files = seedFiles(prefix);
    for (const f of files) {
        if (!existsSync(f)) throw new Error(`missing seed file ${f} for ${runId}`);
    }
    const perTask = new Map();
    for (const f of files) {
        const doc = JSON.parse(readFileSync(f, 'utf8'));
        for (const t of doc.tasks) {
            const v = t.plan
                ? validatePlanCorrectness(t, t.plan, [], resolver)
                : { strict_pass: false, issues: ['__unparsed__'] };
            const rec = perTask.get(t.slug)
                || { fails: 0, seen: 0, classes: new Map(), level: t.level };
            rec.seen += 1;
            if (!v.strict_pass) {
                rec.fails += 1;
                const issues = (v.issues || []).filter(i => i !== '__unparsed__');
                let names;
                if (!t.plan || (v.issues || []).includes('__unparsed__')) names = ['unparsed'];
                else if (issues.length === 0) names = ['goal-not-produced'];
                else names = [...new Set(issues.map(classify))];
                // A seed contributes each distinct class it exhibits once.
                for (const n of names) rec.classes.set(n, (rec.classes.get(n) || 0) + 1);
            }
            perTask.set(t.slug, rec);
        }
    }
    return perTask;
}

const rows = [];
const uncategorised = [];
for (const cond of ['no_ret', 'saer_cold']) {
    for (const m of MODELS) {
        const id = `${m}/${cond}`;
        const perTask = rescore(id);
        // Majority vote: a task passes if it strict-passes in >= 2 of 3 seeds.
        let pass = 0;
        const counts = Object.fromEntries(ORDER.map(c => [c, 0]));
        let failedTasks = 0;
        for (const [slug, rec] of perTask) {
            if (rec.seen !== 3) throw new Error(`${id}: ${slug} has ${rec.seen} seeds, expected 3`);
            if (rec.fails <= 1) { pass += 1; continue; }
            failedTasks += 1;
            // Attribute the task to every class present in a majority of its
            // failing seeds, so a one-off seed artefact does not create a mode.
            const held = [];
            for (const [c, n] of rec.classes) {
                if (n >= 2) { counts[c] += 1; held.push(c); }
                if (c === 'uncategorised') uncategorised.push(`${id} ${slug}`);
            }
            if (held.some(c => PREREQ.has(c))) counts['prereq-any'] += 1;
            else if (held.length) counts['goal-only'] += 1;
            else counts['unattributed'] += 1;
        }
        const partition = counts['prereq-any'] + counts['goal-only'] + counts['unattributed'];
        if (partition !== failedTasks) {
            throw new Error(`${id}: prereq-any + goal-only + unattributed = ${partition} `
                + `!= ${failedTasks} failing tasks — the three groups no longer partition`);
        }
        if (counts['goal-only'] > counts['goal-not-produced']) {
            throw new Error(`${id}: goal-only ${counts['goal-only']} exceeds the `
                + `goal-not-produced column ${counts['goal-not-produced']}`);
        }
        if (pass !== TABLE2_TCR[id]) {
            throw new Error(`${id}: rescored TCR ${pass}/60 != published main-table value `
                + `${TABLE2_TCR[id]}/60 — run selection or validator drifted`);
        }
        rows.push({ model: m, cond, pass, failedTasks, counts });
    }
}

console.log('Rescored TCR matches the published main table for all 10 runs.\n');
const head = ['model', 'cond', 'TCR', 'fail', ...ORDER.filter(c => c !== 'uncategorised' || uncategorised.length)];
console.log(head.map(h => h.padEnd(17)).join(''));
for (const r of rows) {
    console.log([LABELS[r.model].replace('\\ ', ' '), r.cond, `${r.pass}/60`, r.failedTasks,
        ...head.slice(4).map(c => r.counts[c])].map(x => String(x).padEnd(17)).join(''));
}
if (uncategorised.length) {
    console.log(`\n!! ${uncategorised.length} uncategorised issue strings:`);
    for (const u of uncategorised.slice(0, 20)) console.log('   ', u);
}

if (LATEX) {
    const show = ['precondition-gap', 'ingredient-gap', 'tool-gap', 'smelt-shortfall',
        'naming-gap', 'goal-not-produced'];
    console.log('\n% --- generated by scripts/eval/failure_mode_counts.mjs --latex ---');
    for (const cond of ['no_ret', 'saer_cold']) {
        console.log(`\\multicolumn{8}{l}{\\emph{${cond === 'no_ret'
            ? 'no\\_retrieval' : 'saer\\_cold'}}} \\\\`);
        for (const r of rows.filter(r => r.cond === cond)) {
            console.log(`~~${LABELS[r.model]} & ${r.failedTasks} & `
                + show.map(c => r.counts[c]).join(' & ') + ' \\\\');
        }
    }
}
