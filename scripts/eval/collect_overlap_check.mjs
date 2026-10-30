// Structural-overlap check for the non-crafting tasks.
//
// The ingredient-Jaccard audit (jaccard_overlap_*.mjs) covers only the 44 CRAFT
// tasks: COLLECT tasks declare no required_materials, so that metric is empty for
// them. This script asks the question that does apply to a gathering task -- is
// its goal item already the target of a demonstration in the bank it retrieves
// from? -- in two strengths:
//   final        : goal item == a demonstration's final `produces` item
//   intermediate : goal item appears anywhere else in a demonstration
//                  (a step's `produces`, a collectBlocks block, or that block's drop)
// Each category is compared only against its own bank, because retrieval is
// category-filtered (paper Sec. 3.2).
//
// Positive control: COMBAT is run first. Its five tasks are known near-duplicates
// of five combat demonstrations (paper Sec. 4.4), so the check must report 5/5
// final matches there or it aborts -- a checker that cannot find the known case
// proves nothing about the unknown one.
//
// Usage (repo root): node scripts/eval/collect_overlap_check.mjs
import { readFileSync } from 'fs';
import { BLOCK_DROP_ALIASES } from '../../src/models/enhancers/plan_validator.js';

const read = p => JSON.parse(readFileSync(p, 'utf-8'));
const rawTasks = read('scripts/eval/eval_tasks.json');
const TASKS = Array.isArray(rawTasks) ? rawTasks : rawTasks.tasks;

function demoItems(demo) {
    const last = demo.plan[demo.plan.length - 1]?.produces;
    const finalItem = last?.name ?? null;
    const all = new Set();
    for (const step of demo.plan) {
        const p = step.produces;
        for (const x of (Array.isArray(p) ? p : [p])) if (x?.name) all.add(x.name);
        for (const cmd of step.action_cmd || []) {
            const m = cmd.match(/collectBlocks\(\s*['"]([^'"]+)['"]/);
            if (m) { all.add(m[1]); all.add(BLOCK_DROP_ALIASES[m[1]] || m[1]); }
        }
    }
    return { slug: demo.slug, finalItem, all };
}

function check(category, bankPath) {
    const tasks = TASKS.filter(t => t.category === category);
    const demos = read(bankPath).map(demoItems);
    if (tasks.length === 0 || demos.length === 0) {
        console.error(`${category}: read 0 tasks or 0 demonstrations -- run from the repo root.`);
        process.exit(1);
    }
    const rows = tasks.map(t => ({
        slug: t.slug,
        goal: t.goal_item,
        final: demos.filter(d => d.finalItem === t.goal_item).map(d => d.slug),
        inter: demos.filter(d => d.finalItem !== t.goal_item && d.all.has(t.goal_item)).map(d => d.slug),
    }));
    console.log(`\n${category}: ${tasks.length} tasks vs ${demos.length} demonstrations in ${bankPath}`);
    for (const r of rows) {
        console.log(`  ${r.slug.padEnd(28)} goal=${r.goal.padEnd(18)} final=[${r.final.join(', ')}] intermediate=[${r.inter.join(', ')}]`);
    }
    const nFinal = rows.filter(r => r.final.length).length;
    const nInter = rows.filter(r => !r.final.length && r.inter.length).length;
    console.log(`  => final-target match ${nFinal}/${rows.length}; intermediate-only match ${nInter}/${rows.length}`);
    return { nFinal, n: rows.length };
}

const combat = check('COMBAT', 'data/training/combat_examples.json');
if (combat.nFinal !== combat.n) {
    console.error(`\nPOSITIVE CONTROL FAILED: expected ${combat.n}/${combat.n} combat near-duplicates, found ${combat.nFinal}.`);
    process.exit(1);
}
console.log('  positive control OK (reproduces the known combat near-duplicates)');
check('COLLECT', 'data/training/collecting_examples.json');
