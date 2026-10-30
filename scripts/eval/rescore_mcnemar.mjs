// Recompute the McNemar b/c contingency for SAER-cold vs BM25 (qwen-max),
// both under OLD (as-recorded) and NEW (alias-bug-fixed) majority vote.
import { readFileSync } from 'fs';
import { validatePlanCorrectness } from './static_plan_eval.js';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';

const resolver = new RecipeResolver({ version: '1.20.4' });

function majorityPass(files, useNew) {
    const perTask = new Map();
    for (const fpath of files) {
        const data = JSON.parse(readFileSync(fpath, 'utf-8'));
        const tasks = Array.isArray(data) ? data : (data.tasks || data.results || []);
        for (const t of tasks) {
            if (!perTask.has(t.slug)) perTask.set(t.slug, []);
            if (!useNew) {
                perTask.get(t.slug).push(!!t.validation?.strict_pass);
            } else if (!t.plan) {
                perTask.get(t.slug).push(false);
            } else {
                const v = validatePlanCorrectness(t, t.plan, [], resolver);
                perTask.get(t.slug).push(v.strict_pass);
            }
        }
    }
    const result = new Map();
    for (const [slug, runs] of perTask) {
        result.set(slug, runs.filter(Boolean).length > runs.length / 2);
    }
    return result;
}

const saerFiles = [
    'scripts/eval/results/fixed_mcdata/eval_20260621_001120_saer_cold_s1.json',
    'scripts/eval/results/fixed_mcdata/eval_20260621_001120_saer_cold_s2.json',
    'scripts/eval/results/fixed_mcdata/eval_20260621_001120_saer_cold_s3.json',
];
const bm25Files = [
    'scripts/eval/results/canonical/eval_20260605_004805_bm25_retrieval_s1.json',
    'scripts/eval/results/canonical/eval_20260605_004805_bm25_retrieval_s2.json',
    'scripts/eval/results/canonical/eval_20260605_004805_bm25_retrieval_s3.json',
];

for (const useNew of [false, true]) {
    const saer = majorityPass(saerFiles, useNew);
    const bm25 = majorityPass(bm25Files, useNew);
    let b = 0, c = 0, both = 0, neither = 0;
    const bList = [], cList = [];
    for (const slug of saer.keys()) {
        const s = saer.get(slug), r = bm25.get(slug);
        if (s && !r) { b++; bList.push(slug); }
        else if (!s && r) { c++; cList.push(slug); }
        else if (s && r) both++;
        else neither++;
    }
    console.log(`\n=== ${useNew ? 'NEW (fixed)' : 'OLD (as-recorded)'} ===`);
    console.log(`SAER TCR: ${[...saer.values()].filter(Boolean).length}/60, BM25 TCR: ${[...bm25.values()].filter(Boolean).length}/60`);
    console.log(`b (SAER win, BM25 lose) = ${b}:`, bList);
    console.log(`c (BM25 win, SAER lose) = ${c}:`, cList);
}
