// One-off offline re-scoring of already-generated plans against the fixed
// itemsMatch()/BLOCK_DROP_ALIASES logic in static_plan_eval.js. No LLM calls —
// reuses the `plan` object already saved in each result JSON.
import { readFileSync } from 'fs';
import { validatePlanCorrectness } from './static_plan_eval.js';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';

const files = process.argv.slice(2);
const resolver = new RecipeResolver({ version: '1.20.4' });

let evalTasks = null;
function getTaskWarmInventory(slug) {
    if (!evalTasks) {
        evalTasks = JSON.parse(readFileSync(new URL('./eval_tasks.json', import.meta.url)));
    }
    const t = evalTasks.find(t => t.slug === slug);
    return (t && t.warm_inventory) || [];
}

for (const fpath of files) {
    const data = JSON.parse(readFileSync(fpath, 'utf-8'));
    const tasks = Array.isArray(data) ? data : (data.tasks || data.results || []);
    const isWarm = fpath.includes('saer_warm');

    let flips = 0;
    const flipped = [];
    for (const t of tasks) {
        if (!t.plan) continue;
        const oldStrict = t.validation?.strict_pass;
        const initialInv = isWarm ? getTaskWarmInventory(t.slug) : [];
        const newValidation = validatePlanCorrectness(t, t.plan, initialInv, resolver);
        if (oldStrict !== newValidation.strict_pass) {
            flips++;
            flipped.push({ slug: t.slug, level: t.level, old: oldStrict, new: newValidation.strict_pass });
        }
    }
    console.log(`${fpath}`);
    console.log(`  flips: ${flips}`);
    for (const f of flipped) {
        console.log(`    ${f.slug} (${f.level}): ${f.old} -> ${f.new}`);
    }
}
