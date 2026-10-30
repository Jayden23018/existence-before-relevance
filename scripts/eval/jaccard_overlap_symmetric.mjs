// Symmetric variant of jaccard_overlap_holdout_vs_demos.mjs, built to answer
// reviewer round8's concern (D. Structural overlap disclosure does not
// establish generalization): the reported metric is asymmetric — query side
// = final-craft materials only, demo side = full prerequisite chain (union of
// preconditions.items.inventory across all plan steps).
//
// This script makes the QUERY side symmetric with the demo side by computing
// a full prerequisite chain for each held-out task's goal_item via
// RecipeResolver.resolveDependencyChain() (same mcData-driven crafting graph
// used at runtime), starting from an EMPTY inventory (cold-start, matching
// the demo side which is not conditioned on any particular player inventory
// either). The demo side is left as-is (curated preconditions.items.inventory
// union) — only the query-side representation changes.
//
// Scope: identical to the existing metric — 44 CRAFT-category tasks only.
// The 16 COLLECT/COMBAT tasks have a leaf goal_item with no crafting recipe
// (e.g. bamboo, gunpowder), so resolveDependencyChain trivially returns a
// single collect step — there is no real "chain" to compare, consistent with
// why the original metric already excludes them.

import fs from 'fs';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';

const evalTasks = JSON.parse(fs.readFileSync('scripts/eval/eval_tasks.json', 'utf8'));
// CRAFTING_BANK selects which revision of the crafting demonstration bank to score
// against. Default = the evaluation-time revision shipped as crafting_examples.json;
// set CRAFTING_BANK=data/training/crafting_examples.CORRECTED-2026-07-22.json to
// reproduce the corrected-bank column. See PROVENANCE.md.
const demoFiles = [
    process.env.CRAFTING_BANK || 'data/training/crafting_examples.json',
    'data/training/collecting_examples.json',
    'data/training/combat_examples.json',
];
const demos = demoFiles.flatMap(f => JSON.parse(fs.readFileSync(f, 'utf8')));

function demoIngredientSet(example) {
    const items = new Set();
    for (const step of example.plan || []) {
        const inv = step.preconditions?.items?.inventory || [];
        for (const entry of inv) {
            items.add(entry.includes(':') ? entry.split(':')[0] : entry);
        }
    }
    return items;
}

function jaccard(a, b) {
    if (a.size === 0 || b.size === 0) return 0;
    const inter = [...a].filter(x => b.has(x)).length;
    const union = new Set([...a, ...b]).size;
    return inter / union;
}

const rr = new RecipeResolver({ version: '1.20.4' });

function queryFullChainSet(task) {
    const chain = rr.resolveDependencyChain(task.goal_item, new Map(), task.goal_count || 1);
    const items = new Set();
    for (const step of chain) {
        items.add(step.acquire);
        if (step.consumes) {
            for (const k of Object.keys(step.consumes)) items.add(k);
        }
    }
    return items;
}

const demoSets = demos.map(d => ({ slug: d.slug, set: demoIngredientSet(d) }));

const craftTasks = evalTasks.filter(t => t.category === 'CRAFT');

const rows = craftTasks.map(task => {
    const qSet = queryFullChainSet(task);
    let best = { slug: null, score: 0 };
    for (const d of demoSets) {
        const s = jaccard(qSet, d.set);
        if (s > best.score) best = { slug: d.slug, score: s };
    }
    return { slug: task.slug, qSize: qSet.size, nearestDemo: best.slug, jaccard: best.score };
});

const scores = rows.map(r => r.jaccard);
const nonZero = scores.filter(s => s > 0);
const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const countAbove = (arr, t) => arr.filter(s => s >= t).length;

console.log('slug,query_full_chain_n,nearest_demo,jaccard');
for (const r of rows) console.log(`${r.slug},${r.qSize},${r.nearestDemo || 'none'},${r.jaccard.toFixed(3)}`);

console.log(`\n--- Summary: SYMMETRIC (both sides = full prerequisite chain), 44 CRAFT tasks vs ${demos.length}-example demo bank ---`);
console.log(`min=${Math.min(...scores).toFixed(3)} mean=${mean(scores).toFixed(3)} max=${Math.max(...scores).toFixed(3)}`);
console.log(`tasks with zero-overlap nearest demo: ${scores.length - nonZero.length}/${scores.length}`);
console.log(`mean over nonzero-overlap tasks only: ${mean(nonZero).toFixed(3)} (n=${nonZero.length})`);
console.log(`count >= 0.5: ${countAbove(scores, 0.5)}/${scores.length}`);
console.log(`count >= 0.75: ${countAbove(scores, 0.75)}/${scores.length}`);
console.log(`count >= 0.9: ${countAbove(scores, 0.9)}/${scores.length}`);
