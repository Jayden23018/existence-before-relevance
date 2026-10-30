// Item 9 (Codex round7 TODO): structural (ingredient/prerequisite-set) Jaccard
// overlap between the 60 held-out eval tasks and the 54-example demonstration
// bank, beyond the already-established exact target-name disjointness.
//
// Query set R_q: eval_tasks.json's declared `required_materials` (final-craft
// ingredients only, curated ground truth for the task).
// Demo set R_e: union of every step's `preconditions.items.inventory` item
// names across the demo's plan (prerequisite chain, not just final craft —
// e.g. crafting/iron_axe's R_e includes wooden_pickaxe, stone_pickaxe,
// raw_iron, iron_ingot, stick).
//
// For each held-out task, take the max Jaccard over all 54 demos (nearest
// neighbor) and report the distribution.

import fs from 'fs';

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

const demoSets = demos.map(d => ({ slug: d.slug, set: demoIngredientSet(d) }));

const rows = evalTasks.map(task => {
    const qSet = new Set((task.required_materials || []).map(m => m.name));
    let best = { slug: null, score: 0 };
    for (const d of demoSets) {
        const s = jaccard(qSet, d.set);
        if (s > best.score) best = { slug: d.slug, score: s };
    }
    return { slug: task.slug, category: task.category, qSize: qSet.size, nearestDemo: best.slug, jaccard: best.score };
});

const scores = rows.map(r => r.jaccard);
const nonZero = scores.filter(s => s > 0);
const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

console.log('slug,category,required_materials_n,nearest_demo,jaccard');
for (const r of rows) console.log(`${r.slug},${r.category},${r.qSize},${r.nearestDemo || 'none'},${r.jaccard.toFixed(3)}`);

console.log(`\n--- Summary (60 held-out tasks vs ${demos.length}-example demo bank) ---`);
console.log(`min=${Math.min(...scores).toFixed(3)} mean=${mean(scores).toFixed(3)} max=${Math.max(...scores).toFixed(3)}`);
console.log(`tasks with zero-overlap nearest demo: ${scores.length - nonZero.length}/${scores.length}`);
console.log(`mean over nonzero-overlap tasks only: ${mean(nonZero).toFixed(3)} (n=${nonZero.length})`);
