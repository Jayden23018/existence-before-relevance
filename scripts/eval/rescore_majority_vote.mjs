// Re-score primary/canonical seed files with the fixed itemsMatch()/
// BLOCK_DROP_ALIASES logic and recompute per-task majority vote + TCR,
// without any new LLM calls. Reports old vs corrected TCR per file group.
import { readFileSync } from 'fs';
import { validatePlanCorrectness } from './static_plan_eval.js';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';

const resolver = new RecipeResolver({ version: '1.20.4' });
let evalTasks = null;
function getWarmInv(slug) {
    if (!evalTasks) evalTasks = JSON.parse(readFileSync(new URL('./eval_tasks.json', import.meta.url)));
    const t = evalTasks.find(t => t.slug === slug);
    return (t && t.warm_inventory) || [];
}

// groups: label -> [s1, s2, s3 file paths]
const groups = JSON.parse(readFileSync(process.argv[2], 'utf-8'));

for (const [label, filePaths] of Object.entries(groups)) {
    const isWarm = label.includes('saer_warm');
    const perTaskOld = new Map(); // slug -> [bool,bool,bool]
    const perTaskNew = new Map();

    for (const fpath of filePaths) {
        const data = JSON.parse(readFileSync(fpath, 'utf-8'));
        const tasks = Array.isArray(data) ? data : (data.tasks || data.results || []);
        for (const t of tasks) {
            const slug = t.slug;
            if (!perTaskOld.has(slug)) { perTaskOld.set(slug, []); perTaskNew.set(slug, []); }
            const oldStrict = !!t.validation?.strict_pass;
            perTaskOld.get(slug).push({ pass: oldStrict, level: t.level });
            if (!t.plan) {
                perTaskNew.get(slug).push({ pass: false, level: t.level });
                continue;
            }
            const initialInv = isWarm ? getWarmInv(slug) : [];
            const v = validatePlanCorrectness(t, t.plan, initialInv, resolver);
            perTaskNew.get(slug).push({ pass: v.strict_pass, level: t.level });
        }
    }

    function majorityVoteTCR(perTask) {
        let pass = 0, total = 0;
        const byLevel = {};
        for (const [slug, runs] of perTask) {
            const level = runs[0].level;
            const n = runs.length;
            const passCount = runs.filter(r => r.pass).length;
            const majPass = passCount > n / 2;
            total++;
            if (majPass) pass++;
            if (!byLevel[level]) byLevel[level] = { pass: 0, total: 0 };
            byLevel[level].total++;
            if (majPass) byLevel[level].pass++;
        }
        return { pass, total, byLevel };
    }

    const oldMV = majorityVoteTCR(perTaskOld);
    const newMV = majorityVoteTCR(perTaskNew);

    console.log(`\n=== ${label} ===`);
    console.log(`  OLD TCR: ${oldMV.pass}/${oldMV.total}  ${JSON.stringify(oldMV.byLevel)}`);
    console.log(`  NEW TCR: ${newMV.pass}/${newMV.total}  ${JSON.stringify(newMV.byLevel)}`);

    // Report tasks whose majority-vote outcome flipped
    for (const [slug, oldRuns] of perTaskOld) {
        const newRuns = perTaskNew.get(slug);
        const oldPass = oldRuns.filter(r => r.pass).length > oldRuns.length / 2;
        const newPass = newRuns.filter(r => r.pass).length > newRuns.length / 2;
        if (oldPass !== newPass) {
            console.log(`    FLIP: ${slug} (${oldRuns[0].level}) ${oldPass} -> ${newPass}`);
        }
    }
}
