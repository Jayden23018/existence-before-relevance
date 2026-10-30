// Recompute the combat-probe table (supplement tab:combat) from the per-seed
// result files, so it cannot drift from the shipped data.
//
// Same scoring path as mcnemar_table.mjs --rescore: validatePlanCorrectness with
// the mcData-backed RecipeResolver, per-task majority vote over 3 seeds (> n/2).
//
// Two rounds are reported, matching the supplement:
//   R3 = results/combat_holdout/     (original warm-inventory combat pool)
//   R4 = results/combat_holdout_r4/  (corrected cold-start acquisition chains)
//
// Columns:
//   mv   = tasks passing the per-task majority vote, out of 5
//   mean = trial-level pass rate, i.e. passes / (5 tasks x 3 seeds)
//
// Pass --recorded to score from the verdicts stored at run time instead of
// re-validating. Those predate two scoring fixes and are NOT authoritative; the
// flag exists only to show the pre-fix/post-fix delta.
//
// Usage (from the archive root):
//   node scripts/eval/rescore_combat.mjs [--recorded]
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { validatePlanCorrectness } from './static_plan_eval.js';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';

const RECORDED = process.argv.includes('--recorded');
const resolver = new RecipeResolver({ version: '1.20.4' });

const ROUNDS = [
    ['R3 (original pool)', 'scripts/eval/results/combat_holdout'],
    ['R4 (corrected)', 'scripts/eval/results/combat_holdout_r4'],
];
const CONDITIONS = ['no_retrieval', 'random_retrieval', 'bm25_retrieval', 'saer_cold'];

// combat_holdout/ is flat; combat_holdout_r4/ nests one directory per run.
function seedFilesByCondition(dir) {
    const found = {};
    const walk = (d) => {
        for (const name of readdirSync(d)) {
            const p = join(d, name);
            if (statSync(p).isDirectory()) { walk(p); continue; }
            const m = name.match(/^eval_\d+_\d+_(.+)_s([123])\.json$/);
            if (m) (found[m[1]] ??= []).push(p);
        }
    };
    walk(dir);
    for (const k of Object.keys(found)) found[k].sort();
    return found;
}

function score(files) {
    const perTask = new Map();
    let trialsPassed = 0, trialsTotal = 0;
    for (const f of files) {
        const data = JSON.parse(readFileSync(f, 'utf-8'));
        const tasks = data.tasks || data.results || data;
        for (const t of tasks) {
            const pass = RECORDED
                ? !!t.validation?.strict_pass
                : !!(t.plan ? validatePlanCorrectness(t, t.plan, [], resolver).strict_pass : false);
            if (!perTask.has(t.slug)) perTask.set(t.slug, []);
            perTask.get(t.slug).push(pass);
            trialsTotal++;
            if (pass) trialsPassed++;
        }
    }
    let mv = 0;
    for (const [, runs] of perTask) if (runs.filter(Boolean).length > runs.length / 2) mv++;
    return { mv, tasks: perTask.size, trialsPassed, trialsTotal };
}

console.log(`\n=== Combat probe (supplement tab:combat) — ${RECORDED ? 'RECORDED run-time verdicts (not authoritative)' : 'RESCORED with the current scorer'} ===\n`);
const header = ['Condition', ...ROUNDS.map(([label]) => label)];
console.log(`${header[0].padEnd(18)}${header.slice(1).map(h => h.padEnd(26)).join('')}`);

const cells = {};
for (const cond of CONDITIONS) {
    const row = [];
    for (const [label, dir] of ROUNDS) {
        const byCond = seedFilesByCondition(dir);
        const files = byCond[cond];
        if (!files) { row.push('(absent)'.padEnd(26)); continue; }
        const s = score(files);
        const mean = (100 * s.trialsPassed / s.trialsTotal).toFixed(1);
        cells[`${label}/${cond}`] = { mv: `${s.mv}/${s.tasks}`, mean, seeds: files.length };
        row.push(`${s.mv}/${s.tasks}  ${mean}%  (${s.trialsPassed}/${s.trialsTotal})`.padEnd(26));
    }
    console.log(`${cond.padEnd(18)}${row.join('')}`);
}

console.log(`
Columns: mv  mean  (trial passes / trials).  mv is the per-task majority vote
over ${ROUNDS.length ? '3' : '?'} seeds; mean is the trial-level pass rate the supplement reports.
Run with --recorded to see the run-time verdicts these files were written with.
`);
