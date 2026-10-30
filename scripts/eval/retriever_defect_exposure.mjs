/**
 * Do SAER and BM25 select demonstrations of different material quality?
 *
 * The main paper reads SAER's edge over BM25 as a relevance effect. If the two
 * retrievers also differ in how often they pick a materially broken
 * demonstration, that difference is a confound for the relevance reading. This
 * script measures it offline with ZERO LLM calls: retrieval is deterministic
 * given the task and the bank, so the selected sets can be recomputed exactly.
 *
 * Defect = the demonstration is short of material at some craft when each
 * produced unit may be spent only once (same walk as
 * measure_consumption_leniency.mjs).
 *
 * Run against the EVALUATION-TIME bank revision shipped in the release; that is
 * the pool the reported runs retrieved over.
 *
 * Usage: node scripts/eval/retriever_defect_exposure.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { SAERScorer } from '../../src/models/enhancers/saer_scorer.js';
import { BM25Retriever } from '../../src/models/enhancers/bm25_retriever.js';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';
import { materialBalanceViolations } from './measure_consumption_leniency.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const TOPK = 3;

// Mirrors static_plan_eval.js:191.
const CATEGORY_TO_FILE = {
    CRAFT: 'crafting_examples.json',
    COLLECT: 'collecting_examples.json',
    COMBAT: 'combat_examples.json',
    DEFAULT: 'crafting_examples.json'
};

// saer_cold: agentState = null -> _isColdStart() -> coldStartWeights.
const COLD = { ingredient: 0.50, keyword: 0.35, miningTierGap: 0.00, level: 0.15 };

// The crafting bank has two revisions and they give materially different
// answers here (evaluation-time: 11/25 demonstrations short; corrected: 1/25).
// The figures in the supplement are computed against the EVALUATION-TIME
// revision, which is what the reported runs retrieved over and what the code
// release pins. Override with CRAFTING_BANK=<path> to check the other one.
const CRAFTING_OVERRIDE = process.env.CRAFTING_BANK || null;

function loadBank(category) {
    const p = (category === 'CRAFT' && CRAFTING_OVERRIDE)
        ? CRAFTING_OVERRIDE
        : join(ROOT, 'data', 'training', CATEGORY_TO_FILE[category] || CATEGORY_TO_FILE.DEFAULT);
    if (!existsSync(p)) throw new Error(`Training file missing: ${p}`);
    const raw = JSON.parse(readFileSync(p, 'utf8'));
    return Array.isArray(raw) ? raw : (raw.examples || raw.data || []);
}

const id = e => e.slug ?? e.name;

function main() {
    const tasks = JSON.parse(readFileSync(join(ROOT, 'scripts/eval/eval_tasks.json'), 'utf8'));
    const resolver = new RecipeResolver({ version: '1.20.4' });

    const banks = new Map();
    const defective = new Map();   // demo id -> bool
    for (const cat of new Set(tasks.map(t => t.category))) {
        const bank = loadBank(cat);
        banks.set(cat, bank);
        for (const ex of bank) {
            if (ex.plan) defective.set(id(ex), materialBalanceViolations({ steps: ex.plan }).length > 0);
        }
    }

    // Guard against the setRecipeResolver defect: without a live resolver the
    // ingredient dimension collapses and SAER degenerates to keyword+level,
    // which would make this comparison meaningless.
    const scorer = new SAERScorer(false, null, COLD);
    scorer.setRecipeResolver(resolver);
    const probe = tasks.find(t => t.category === 'CRAFT');
    const distinct = new Set(banks.get('CRAFT')
        .map(ex => scorer.calcIngredientOverlapScore(probe.prompt, ex).toFixed(6)));
    if (distinct.size <= 1) throw new Error('RecipeResolver inert; aborting.');

    const rows = [];
    for (const task of tasks) {
        const bank = banks.get(task.category);
        const saer = scorer.selectExamples(task.prompt, bank, null, TOPK).map(id);
        const bm25 = new BM25Retriever(bank).search(task.prompt, TOPK).map(id);
        const nd = ids => ids.filter(i => defective.get(i)).length;
        rows.push({
            slug: task.slug, cat: task.category,
            saer: nd(saer), bm25: nd(bm25),
            saerTop1: defective.get(saer[0]) ? 1 : 0,
            bm25Top1: defective.get(bm25[0]) ? 1 : 0,
            overlap: saer.filter(s => bm25.includes(s)).length
        });
    }

    const sum = (k) => rows.reduce((a, r) => a + r[k], 0);
    const n = rows.length;
    console.log(`crafting bank: ${CRAFTING_OVERRIDE || 'data/training/crafting_examples.json'}`);
    console.log(`tasks: ${n}   top-k: ${TOPK}`);
    for (const [cat, bank] of banks) {
        const bad = bank.filter(e => e.plan && defective.get(id(e))).length;
        const tot = bank.filter(e => e.plan).length;
        console.log(`bank base rate  ${cat.padEnd(8)} ${bad}/${tot} (${(100 * bad / tot).toFixed(0)}%) defective`);
    }
    console.log(`\n                       SAER     BM25`);
    console.log(`defective demos picked  ${String(sum('saer')).padStart(4)}/${n * TOPK}  ${String(sum('bm25')).padStart(4)}/${n * TOPK}`);
    console.log(`mean per task           ${(sum('saer') / n).toFixed(2)}     ${(sum('bm25') / n).toFixed(2)}`);
    console.log(`top-1 defective         ${String(sum('saerTop1')).padStart(4)}/${n}    ${String(sum('bm25Top1')).padStart(4)}/${n}`);
    console.log(`mean top-3 overlap      ${(sum('overlap') / n).toFixed(2)} of ${TOPK}`);

    // Paired sign test on per-task defective-demo counts.
    let saerWorse = 0, bm25Worse = 0;
    for (const r of rows) { if (r.saer > r.bm25) saerWorse++; else if (r.bm25 > r.saer) bm25Worse++; }
    const logC = (N, k) => { let s = 0; for (let i = 1; i <= k; i++) s += Math.log(N - k + i) - Math.log(i); return s; };
    const N = saerWorse + bm25Worse;
    let p = 1;
    if (N > 0) {
        const lo = Math.min(saerWorse, bm25Worse);
        let s = 0; for (let i = 0; i <= lo; i++) s += Math.exp(logC(N, i) - N * Math.LN2);
        p = Math.min(1, 2 * s);
    }
    console.log(`\npaired: SAER picks more defective on ${saerWorse} tasks, BM25 on ${bm25Worse}, ` +
        `tied on ${n - N}; two-sided sign p = ${p.toFixed(4)}`);

    // Paired McNemar on the top-1 (primacy) position, which the enhancer places
    // at the prompt boundary and which the paper argues is the salient slot.
    let b1 = 0, c1 = 0;
    for (const r of rows) {
        if (r.saerTop1 && !r.bm25Top1) b1++;
        else if (!r.saerTop1 && r.bm25Top1) c1++;
    }
    const N1 = b1 + c1;
    let p1 = 1;
    if (N1 > 0) {
        const lo = Math.min(b1, c1);
        let s1 = 0; for (let i = 0; i <= lo; i++) s1 += Math.exp(logC(N1, i) - N1 * Math.LN2);
        p1 = Math.min(1, 2 * s1);
    }
    console.log(`top-1 defective, paired: SAER-only ${b1}, BM25-only ${c1}, ` +
        `two-sided exact p = ${p1.toFixed(5)}`);

    for (const cat of banks.keys()) {
        const r = rows.filter(x => x.cat === cat);
        if (!r.length) continue;
        const s = r.reduce((a, x) => a + x.saer, 0), b = r.reduce((a, x) => a + x.bm25, 0);
        console.log(`  ${cat.padEnd(8)} n=${String(r.length).padStart(2)}  SAER ${(s / r.length).toFixed(2)}  BM25 ${(b / r.length).toFixed(2)}`);
    }
}

main();
