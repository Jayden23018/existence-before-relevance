/**
 * Offline SAER retrieval-divergence analysis — ZERO LLM calls.
 *
 * Answers "does the deployed weight configuration actually matter?" without
 * generating a single plan, and identifies the subset of tasks that a full
 * plan-eval would need to cover.
 *
 * Why this is sound: the enhancer serialises the selected demonstrations in
 * descending score order (Eq. 1 of the supplement), so two configurations that
 * produce the same ORDERED top-k yield a byte-identical prompt for that task.
 * Such a task cannot contribute systematically to McNemar's b or c — only
 * noise. Divergence is therefore measured on the ordered list, not the set,
 * and only divergent tasks need to be re-run against the model.
 *
 * Usage: node scripts/eval/saer_retrieval_divergence.mjs [--topk 3] [--json <path>]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { SAERScorer } from '../../src/models/enhancers/saer_scorer.js';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');

// Mirrors the eval harness (static_plan_eval.js:191). The frozen benchmark only
// contains CRAFT/COLLECT/COMBAT, all three of which map identically in the
// harness map and the deployed map, so there is no routing ambiguity here.
const CATEGORY_TO_FILE = {
    CRAFT: 'crafting_examples.json',
    COLLECT: 'collecting_examples.json',
    COMBAT: 'combat_examples.json',
    DEFAULT: 'crafting_examples.json'
};

/**
 * Cold-start weights only: the evaluated condition is saer_cold, which runs
 * against an empty inventory, and SAERScorer._isColdStart then selects
 * coldStartWeights. miningTierGap is inert at 0 under an empty inventory.
 *
 * NOTE for anyone reusing these through the harness: `--saer-weights` calls
 * FewShotLearning.setWeights(w) with a single argument, which sets BOTH
 * weights and coldStartWeights to w. That is correct for saer_cold and WRONG
 * for any warm condition.
 */
const CONFIGS = [
    { name: 'deployed', w: { ingredient: 0.50, keyword: 0.35, miningTierGap: 0.00, level: 0.15 } },
    { name: 'ingredient_only', w: { ingredient: 1.00, keyword: 0.00, miningTierGap: 0.00, level: 0.00 } },
    { name: 'keyword_only', w: { ingredient: 0.00, keyword: 1.00, miningTierGap: 0.00, level: 0.00 } },
    { name: 'equal_active', w: { ingredient: 1 / 3, keyword: 1 / 3, miningTierGap: 0.00, level: 1 / 3 } },
    { name: '5dim', w: { ingredient: 0.40, keyword: 0.30, miningTierGap: 0.00, level: 0.10, prereqChain: 0.20 } }
];

const BASELINE = 'deployed';

function parseArgs(argv) {
    const args = { topk: 3, json: join(PROJECT_ROOT, 'scripts/eval/results/retrieval_divergence/divergence.json') };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--topk') args.topk = Number(argv[++i]);
        else if (argv[i] === '--json') args.json = argv[++i];
    }
    if (!Number.isInteger(args.topk) || args.topk < 1) throw new Error('--topk must be a positive integer');
    return args;
}

function loadTrainingData(category) {
    const fileName = CATEGORY_TO_FILE[category] || CATEGORY_TO_FILE.DEFAULT;
    const filePath = join(PROJECT_ROOT, 'data', 'training', fileName);
    if (!existsSync(filePath)) throw new Error(`Training file missing: ${filePath}`);
    return JSON.parse(readFileSync(filePath, 'utf8'));
}

function makeScorer(weights, resolver) {
    // 2nd arg = default weights, 3rd = cold-start weights. Both are set to the
    // same object because the evaluated condition is always cold-start.
    const scorer = new SAERScorer(false, weights, weights, resolver);
    return scorer;
}

/** Ordered demonstration identity for one task under one configuration. */
function rank(scorer, task, examples, topk) {
    // agentState = null -> _isColdStart() true -> coldStartWeights apply,
    // matching the saer_cold condition of the frozen benchmark.
    const picked = scorer.selectExamples(task.prompt, examples, null, topk);
    return picked.map((e) => e.slug ?? e.name);
}

/**
 * Guard against the setRecipeResolver defect recorded at
 * static_plan_eval.js:995-1000: without a mcData-backed resolver the
 * ingredient / mining / prereq dimensions collapse to constants and SAER
 * silently degrades to keyword+level. If that regressed, this whole analysis
 * would be measuring nothing, so we assert the resolver is live before use.
 */
function assertResolverLive(resolver, tasks) {
    const scorer = makeScorer(CONFIGS[0].w, resolver);
    const craft = tasks.find((t) => t.category === 'CRAFT');
    const examples = loadTrainingData('CRAFT');
    const scores = examples.map((ex) => scorer.calcIngredientOverlapScore(craft.prompt, ex));
    const distinct = new Set(scores.map((s) => s.toFixed(6)));
    if (distinct.size <= 1) {
        throw new Error(
            `RecipeResolver appears inert: ingredient-overlap produced ${distinct.size} distinct value(s) ` +
            `across ${examples.length} demonstrations for "${craft.prompt}". ` +
            'Expected a live mcData-backed resolver (see static_plan_eval.js:995-1000).'
        );
    }
    return { distinct: distinct.size, examples: examples.length };
}

function main() {
    const { topk, json } = parseArgs(process.argv.slice(2));

    const tasks = JSON.parse(readFileSync(join(PROJECT_ROOT, 'scripts/eval/eval_tasks.json'), 'utf8'));
    if (!Array.isArray(tasks) || tasks.length === 0) throw new Error('eval_tasks.json is not a non-empty array');

    const resolver = new RecipeResolver({ version: '1.20.4' });
    const guard = assertResolverLive(resolver, tasks);

    // Demonstration banks are per-category; load once.
    const banks = new Map();
    for (const cat of new Set(tasks.map((t) => t.category))) banks.set(cat, loadTrainingData(cat));

    // rankings[configName][slug] = ordered demo ids
    const rankings = {};
    for (const cfg of CONFIGS) {
        const scorer = makeScorer(cfg.w, resolver);
        rankings[cfg.name] = {};
        for (const task of tasks) {
            rankings[cfg.name][task.slug] = rank(scorer, task, banks.get(task.category), topk);
        }
    }

    const base = rankings[BASELINE];
    const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    const sameSet = (a, b) => {
        const sa = new Set(a); const sb = new Set(b);
        return sa.size === sb.size && [...sa].every((x) => sb.has(x));
    };

    const report = [];
    for (const cfg of CONFIGS) {
        const r = rankings[cfg.name];
        const divergent = tasks.filter((t) => !eq(r[t.slug], base[t.slug]));
        const setChanged = tasks.filter((t) => !sameSet(r[t.slug], base[t.slug]));
        const top1Changed = tasks.filter((t) => r[t.slug][0] !== base[t.slug][0]);
        report.push({
            config: cfg.name,
            weights: cfg.w,
            orderDivergent: divergent.length,
            setChanged: setChanged.length,
            top1Changed: top1Changed.length,
            divergentSlugs: divergent.map((t) => t.slug)
        });
    }

    // Self-consistency: the baseline must not diverge from itself.
    const self = report.find((r) => r.config === BASELINE);
    if (self.orderDivergent !== 0) throw new Error(`baseline diverged from itself (${self.orderDivergent}) — comparison logic is broken`);

    const pad = (s, n) => String(s).padEnd(n);
    console.log(`\nSAER retrieval divergence vs "${BASELINE}"  (top-k=${topk}, n=${tasks.length} tasks, 0 LLM calls)`);
    console.log(`resolver guard: ingredient-overlap gave ${guard.distinct} distinct values over ${guard.examples} CRAFT demos -- live\n`);
    console.log(`${pad('config', 18)}${pad('order-divergent', 18)}${pad('set-changed', 14)}${pad('top1-changed', 14)}`);
    console.log('-'.repeat(64));
    for (const r of report) {
        console.log(`${pad(r.config, 18)}${pad(`${r.orderDivergent}/${tasks.length}`, 18)}${pad(`${r.setChanged}/${tasks.length}`, 14)}${pad(`${r.top1Changed}/${tasks.length}`, 14)}`);
    }

    console.log('\nDivergent task slugs (these are the only tasks a plan-eval must re-run):');
    for (const r of report) {
        if (r.config === BASELINE) continue;
        console.log(`\n  [${r.config}] ${r.orderDivergent} task(s)`);
        if (r.orderDivergent) console.log(`    ${r.divergentSlugs.join(' ')}`);
    }

    mkdirSync(dirname(json), { recursive: true });
    writeFileSync(json, JSON.stringify({ topk, nTasks: tasks.length, baseline: BASELINE, report, rankings }, null, 1));
    console.log(`\nwrote ${json}`);
}

main();
