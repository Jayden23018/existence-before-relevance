// Joins per-task overlap (Jaccard, asymmetric as reported in paper §4.1 +
// symmetric variant from jaccard_overlap_symmetric.mjs) against per-task
// majority-vote pass/fail for Qwen2.5-Max no_retrieval vs saer_cold (the
// exact file group that reproduces the main table's headline numbers: no_ret
// 19/60, saer_cold 49/60 — the same rescore path (validatePlanCorrectness)
// used by mcnemar_table.mjs --rescore, run against
// scripts/eval/results/canonical/eval_20260604_213651_no_retrieval_s{1,2,3}.json
// and scripts/eval/results/fixed_mcdata/eval_20260621_001120_saer_cold_s{1,2,3}.json).
//
// Scope: 44 CRAFT-category tasks only (matches §4.1's overlap metric scope —
// COLLECT/COMBAT tasks have no declared final-craft materials, see
// jaccard_overlap_holdout_vs_demos.mjs).

import { readFileSync } from 'fs';
import { validatePlanCorrectness } from './static_plan_eval.js';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';

const resolver = new RecipeResolver({ version: '1.20.4' });

const evalTasks = JSON.parse(readFileSync('scripts/eval/eval_tasks.json', 'utf8'));
// CRAFTING_BANK selects which revision of the crafting demonstration bank to score
// against. Default = the evaluation-time revision shipped as crafting_examples.json;
// set CRAFTING_BANK=data/training/crafting_examples.CORRECTED-2026-07-22.json to
// reproduce the corrected-bank column. See PROVENANCE.md.
const demoFiles = [
    process.env.CRAFTING_BANK || 'data/training/crafting_examples.json',
    'data/training/collecting_examples.json',
    'data/training/combat_examples.json',
];
const demos = demoFiles.flatMap(f => JSON.parse(readFileSync(f, 'utf8')));

function demoIngredientSet(example) {
    const items = new Set();
    for (const step of example.plan || []) {
        const inv = step.preconditions?.items?.inventory || [];
        for (const entry of inv) items.add(entry.includes(':') ? entry.split(':')[0] : entry);
    }
    return items;
}
function jaccard(a, b) {
    if (a.size === 0 || b.size === 0) return 0;
    const inter = [...a].filter(x => b.has(x)).length;
    const union = new Set([...a, ...b]).size;
    return inter / union;
}
const demoSets = demos.map(d => ({ slug: d.slug, set: demoIngredientSet(d) }));

function nearestJaccard(qSet) {
    let best = 0;
    for (const d of demoSets) best = Math.max(best, jaccard(qSet, d.set));
    return best;
}

function queryFullChainSet(task) {
    const chain = resolver.resolveDependencyChain(task.goal_item, new Map(), task.goal_count || 1);
    const items = new Set();
    for (const step of chain) {
        items.add(step.acquire);
        if (step.consumes) for (const k of Object.keys(step.consumes)) items.add(k);
    }
    return items;
}

const craftTasks = evalTasks.filter(t => t.category === 'CRAFT');
const overlapBySlug = {};
for (const task of craftTasks) {
    const qSetAsym = new Set((task.required_materials || []).map(m => m.name));
    const qSetSym = queryFullChainSet(task);
    overlapBySlug[task.slug] = {
        asym: nearestJaccard(qSetAsym),
        sym: nearestJaccard(qSetSym),
    };
}

// Per-task majority-vote pass/fail for both conditions.
function perTaskMajority(filePaths) {
    const perTask = new Map();
    for (const fpath of filePaths) {
        const data = JSON.parse(readFileSync(fpath, 'utf-8'));
        const tasks = Array.isArray(data) ? data : (data.tasks || data.results || []);
        for (const t of tasks) {
            if (!perTask.has(t.slug)) perTask.set(t.slug, []);
            if (!t.plan) { perTask.get(t.slug).push(false); continue; }
            const v = validatePlanCorrectness(t, t.plan, [], resolver);
            perTask.get(t.slug).push(v.strict_pass);
        }
    }
    const result = new Map();
    for (const [slug, runs] of perTask) {
        const passCount = runs.filter(Boolean).length;
        result.set(slug, passCount > runs.length / 2);
    }
    return result;
}

const noRet = perTaskMajority([
    'scripts/eval/results/canonical/eval_20260604_213651_no_retrieval_s1.json',
    'scripts/eval/results/canonical/eval_20260604_213651_no_retrieval_s2.json',
    'scripts/eval/results/canonical/eval_20260604_213651_no_retrieval_s3.json',
]);
const saerCold = perTaskMajority([
    'scripts/eval/results/fixed_mcdata/eval_20260621_001120_saer_cold_s1.json',
    'scripts/eval/results/fixed_mcdata/eval_20260621_001120_saer_cold_s2.json',
    'scripts/eval/results/fixed_mcdata/eval_20260621_001120_saer_cold_s3.json',
]);

console.log(`Sanity check (should match the ablation table Qwen2.5-Max row): no_ret=${[...noRet.values()].filter(Boolean).length}/60, saer_cold=${[...saerCold.values()].filter(Boolean).length}/60`);

function tercileSplit(slugs, metric) {
    const sorted = [...slugs].sort((a, b) => overlapBySlug[a][metric] - overlapBySlug[b][metric]);
    const n = sorted.length;
    const third = Math.ceil(n / 3);
    return {
        low: sorted.slice(0, third),
        mid: sorted.slice(third, 2 * third),
        high: sorted.slice(2 * third),
    };
}

function report(metric) {
    console.log(`\n=== Stratified by ${metric === 'asym' ? 'ASYMMETRIC (paper §4.1)' : 'SYMMETRIC (full-chain both sides)'} Jaccard, 44 CRAFT tasks ===`);
    const slugs = craftTasks.map(t => t.slug);
    const terciles = tercileSplit(slugs, metric);
    for (const [name, group] of Object.entries(terciles)) {
        const range = group.map(s => overlapBySlug[s][metric]);
        const noRetPass = group.filter(s => noRet.get(s)).length;
        const saerPass = group.filter(s => saerCold.get(s)).length;
        console.log(`  ${name.toUpperCase()} (n=${group.length}, jaccard ${Math.min(...range).toFixed(3)}-${Math.max(...range).toFixed(3)}): no_ret ${noRetPass}/${group.length}, saer_cold ${saerPass}/${group.length}, delta=${saerPass - noRetPass}`);
        console.log(`    tasks: ${group.join(', ')}`);
    }
}

report('asym');
report('sym');
