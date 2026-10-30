// Recompute every paired comparison in the paper's Bonferroni family from the
// per-seed result files, so Table tab:main and tab:mcnemar cannot drift apart.
//
// Source of truth: the recorded per-task validation.strict_pass in the *_s{1,2,3}.json
// seed files, majority-voted per task (>=2/3) -- the same rule that produced the
// *_majority_vote.json summaries. Pass --rescore to additionally re-validate every
// plan with the CURRENT scorer, as a drift check against the recorded verdicts.
//
// Usage:
//   node scripts/eval/mcnemar_table.mjs [--rescore] [--strata]
//
// --strata adds two task-subset breakdowns of the paired counts, both computed
// from the same majority vote (so they are restrictions of the printed b/c, not
// a re-analysis): by retrieval-scorer applicability (CRAFT, where the ingredient
// dimension can fire, vs the 16 tasks where it is identically zero) and with the
// five COMBAT tasks dropped, whose same-mob demonstrations survive the slug-level
// held-out check. Off by default so the authoritative output stays unchanged.
import { readFileSync, existsSync } from 'fs';
import { validatePlanCorrectness } from './static_plan_eval.js';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';

const RESCORE = process.argv.includes('--rescore');
const STRATA = process.argv.includes('--strata');
const resolver = new RecipeResolver({ version: '1.20.4' });
const R = 'scripts/eval/results/';

// run id -> seed-file prefix (3 seeds each, verified present)
const RUNS = {
    'qwen3-8b/no_ret':      `${R}canonical/eval_20260605_213048_no_retrieval`,
    'qwen3-8b/bm25':        `${R}canonical/eval_20260620_191130_bm25_retrieval`,
    'qwen3-8b/saer_cold':   `${R}fixed_mcdata/eval_20260621_004648_saer_cold`,
    'gpt-4o/no_ret':        `${R}canonical/eval_20260605_213059_no_retrieval`,
    'gpt-4o/bm25':          `${R}fixed_mcdata/eval_20260621_121743_bm25_retrieval`,
    'gpt-4o/saer_cold':     `${R}fixed_mcdata/eval_20260621_013640_saer_cold`,
    'claude/no_ret':        `${R}canonical/eval_20260605_233949_no_retrieval`,
    'claude/bm25':          `${R}fixed_mcdata/eval_20260621_144209_bm25_retrieval`,
    'claude/saer_cold':     `${R}fixed_mcdata/eval_20260621_021308_saer_cold`,
    'qwen-max/no_ret':      `${R}canonical/eval_20260604_213651_no_retrieval`,
    'qwen-max/random':      `${R}canonical/eval_20260605_000159_random_retrieval`,
    'qwen-max/bm25':        `${R}canonical/eval_20260605_004805_bm25_retrieval`,
    'qwen-max/saer_cold':   `${R}fixed_mcdata/eval_20260621_001120_saer_cold`,
    'deepseek/no_ret':      `${R}canonical/eval_20260604_231018_no_retrieval`,
    'deepseek/bm25':        `${R}fixed_mcdata/eval_20260621_115631_bm25_retrieval`,
    'deepseek/saer_cold':   `${R}fixed_mcdata/eval_20260621_011658_saer_cold`,
    'gemma4-26b/no_ret':    `${R}eval_20260611_204737_no_retrieval`,
    'gemma4-26b/bm25':      `${R}fixed_mcdata/eval_20260621_153049_bm25_retrieval`,
    'gemma4-26b/saer_cold': `${R}fixed_mcdata/eval_20260621_144219_saer_cold`,
    'gemma4-26b/saer_full': `${R}eval_20260612_025602_saer_full`,
    'gemma4-31b/no_ret':    `${R}eval_20260612_235009_no_retrieval`,
    'gemma4-31b/bm25':      `${R}fixed_mcdata/eval_20260621_211600_bm25_retrieval`,
    'gemma4-31b/saer_cold': `${R}fixed_mcdata/eval_20260621_202849_saer_cold`,
    'gemma4-31b/saer_full': `${R}eval_20260613_122627_saer_full`,
    // Deployed-configuration weight ablations (2026-07-31). These cover only the
    // tasks whose ordered top-k retrieval changes under the alternative weights
    // (18/60 for both configs, see scripts/eval/saer_retrieval_divergence.mjs);
    // tasks with an unchanged ordered top-k receive a byte-identical prompt and
    // cannot be systematically discordant. compare() restricts both arms to the
    // A-side slug set, so these pair correctly against the full 60-task runs.
    'qwen-max/equal_active': `${R}eval_20260731_132239_saer_cold`,
    'qwen-max/5dim': `${R}eval_20260731_133856_saer_cold`,
    // Second-model replication. Retrieval ranking does not depend on the model,
    // so the divergent task subsets are identical to qwen-max's. deepseek-chat
    // matches the serving path of the deepseek baseline run (meta.model checked).
    'deepseek/equal_active': `${R}eval_20260731_135442_saer_cold`,
    'deepseek/5dim': `${R}eval_20260731_140056_saer_cold`,
    // Top-k sensitivity. Unlike a weight change, changing k alters every task's
    // prompt by construction, so these cover the full 60 tasks rather than a
    // divergent subset.
    'qwen-max/k1': `${R}eval_20260731_142747_saer_cold`,
    'qwen-max/k5': `${R}eval_20260731_151943_saer_cold`,
};

const PRIMARY = ['qwen3-8b', 'gpt-4o', 'claude', 'qwen-max', 'deepseek'];
const REPLICATION = ['gemma4-26b', 'gemma4-31b'];

// Bonferroni family, fixed before results were examined (see paper §4.3).
const FAMILY = [
    ...PRIMARY.map(m => [`${m}/saer_cold`, `${m}/no_ret`, `per-model: ${m} saer_cold vs no_ret`]),
    ['qwen-max/random', 'qwen-max/no_ret', 'ablation: random vs no_ret'],
    ['qwen-max/bm25', 'qwen-max/no_ret', 'ablation: bm25 vs no_ret'],
    ['qwen-max/saer_cold', 'qwen-max/no_ret', 'ablation: saer_cold vs no_ret'],
    ['qwen-max/bm25', 'qwen-max/random', 'ablation: bm25 vs random'],
    ['qwen-max/saer_cold', 'qwen-max/bm25', 'ablation: saer_cold vs bm25'],
    ['deepseek/saer_cold', 'qwen3-8b/saer_cold', 'cross-model: DeepSeek-V3 vs Qwen3-8B (SAER)'],
    ['qwen-max/saer_cold', 'qwen3-8b/saer_cold', 'cross-model: Qwen2.5-Max vs Qwen3-8B (SAER)'],
    ['deepseek/saer_cold', 'qwen-max/saer_cold', 'cross-model: DeepSeek-V3 vs Qwen2.5-Max (SAER)'],
];

// Outside the family: replication panel + the per-model SAER-vs-BM25 sign test inputs.
const EXTRA = [
    ...REPLICATION.map(m => [`${m}/saer_full`, `${m}/no_ret`, `replication: ${m} saer_full vs no_ret`]),
    ...REPLICATION.map(m => [`${m}/saer_cold`, `${m}/no_ret`, `replication: ${m} saer_cold vs no_ret`]),
    ...PRIMARY.filter(m => m !== 'qwen-max').map(m => [`${m}/saer_cold`, `${m}/bm25`, `bm25 delta: ${m}`]),
    ...REPLICATION.map(m => [`${m}/saer_cold`, `${m}/bm25`, `bm25 delta: ${m}`]),
    ...REPLICATION.map(m => [`${m}/saer_full`, `${m}/bm25`, `bm25 delta (warm): ${m}`]),
    // Post-hoc, therefore deliberately outside the pre-specified family: adding
    // them to FAMILY after seeing the results would be p-hacking. Nominal p only.
    // A-side must be the ablation run: compare() iterates A's slugs and requires
    // each to exist in B, and only the ablation arms are restricted to the
    // 18-task divergent subset. Printed as deployed -> ablation; b counts
    // ablation-only passes, c deployed-only passes.
    ['qwen-max/equal_active', 'qwen-max/saer_cold', 'weight ablation qwen-max: deployed -> equal (18-task divergent subset)'],
    ['qwen-max/5dim', 'qwen-max/saer_cold', 'weight ablation qwen-max: deployed 4dim -> 5dim (18-task divergent subset)'],
    ['deepseek/equal_active', 'deepseek/saer_cold', 'weight ablation deepseek: deployed -> equal (18-task divergent subset)'],
    ['deepseek/5dim', 'deepseek/saer_cold', 'weight ablation deepseek: deployed 4dim -> 5dim (18-task divergent subset)'],
    ['qwen-max/k1', 'qwen-max/saer_cold', 'top-k qwen-max: k=3 -> k=1 (all 60 tasks)'],
    ['qwen-max/k5', 'qwen-max/saer_cold', 'top-k qwen-max: k=3 -> k=5 (all 60 tasks)'],
];

function seedFiles(prefix) {
    return [1, 2, 3].map(i => `${prefix}_s${i}.json`);
}

/** True when all three seed files of a run are present in this checkout. */
function runAvailable(runId) {
    const prefix = RUNS[runId];
    return prefix !== undefined && seedFiles(prefix).every(f => existsSync(f));
}

// slug -> { pass: bool, pvr: bool, level: 'L1'|'L2'|'L3' }
const voteCache = new Map();
function majorityVote(runId) {
    if (voteCache.has(runId)) return voteCache.get(runId);
    const perTask = new Map();
    const perTaskPvr = new Map();
    const levels = new Map();
    for (const fpath of seedFiles(RUNS[runId])) {
        const data = JSON.parse(readFileSync(fpath, 'utf-8'));
        const tasks = data.tasks || data.results || data;
        for (const t of tasks) {
            if (!perTask.has(t.slug)) { perTask.set(t.slug, []); perTaskPvr.set(t.slug, []); }
            levels.set(t.slug, t.level);
            let pass, pvr;
            if (!RESCORE) {
                pass = !!t.validation?.strict_pass;
                pvr = !!t.validation?.pvr;
            } else {
                const v = t.plan ? validatePlanCorrectness(t, t.plan, [], resolver) : {};
                pass = !!v.strict_pass;
                pvr = !!v.pvr;
            }
            perTask.get(t.slug).push(pass);
            perTaskPvr.get(t.slug).push(pvr);
        }
    }
    const out = new Map();
    for (const [slug, runs] of perTask) {
        const pvrRuns = perTaskPvr.get(slug);
        out.set(slug, {
            pass: runs.filter(Boolean).length > runs.length / 2,
            pvr: pvrRuns.filter(Boolean).length > pvrRuns.length / 2,
            level: levels.get(slug),
        });
    }
    voteCache.set(runId, out);
    return out;
}

function logChoose(n, k) {
    let s = 0;
    for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
    return s;
}

// Two-sided exact binomial (McNemar exact) on b of n=b+c discordant pairs.
function exactP(b, c) {
    const n = b + c;
    if (n === 0) return 1;
    let tail = 0;
    for (let i = 0; i <= Math.min(b, c); i++) tail += Math.exp(logChoose(n, i) + n * Math.log(0.5));
    return Math.min(1, 2 * tail);
}

function wilson(x, n, z = 1.959963985) {
    const p = x / n, z2 = z * z;
    const denom = 1 + z2 / n;
    const centre = (p + z2 / (2 * n)) / denom;
    const half = (z / denom) * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n));
    return [Math.max(0, centre - half), Math.min(1, centre + half)];
}

// Newcombe (1998) method 10 for the difference between paired proportions.
function newcombeCI(a, b, c, d) {
    const n = a + b + c + d;
    const p1 = (a + b) / n, p2 = (a + c) / n;
    const [l1, u1] = wilson(a + b, n);
    const [l2, u2] = wilson(a + c, n);
    const m = (a + b) * (c + d) * (a + c) * (b + d);
    const phi = m > 0 ? (a * d - b * c) / Math.sqrt(m) : 0;
    const lo = (p1 - p2) - Math.sqrt((p1 - l1) ** 2 - 2 * phi * (p1 - l1) * (u2 - p2) + (u2 - p2) ** 2);
    const hi = (p1 - p2) + Math.sqrt((u1 - p1) ** 2 - 2 * phi * (u1 - p1) * (p2 - l2) + (p2 - l2) ** 2);
    return [lo * 100, hi * 100];
}

function compare(idA, idB) {
    const A = majorityVote(idA), B = majorityVote(idB);
    let a = 0, b = 0, c = 0, d = 0;
    const bList = [], cList = [];
    for (const slug of A.keys()) {
        const sa = A.get(slug).pass, sb = B.get(slug)?.pass;
        if (sb === undefined) throw new Error(`slug ${slug} missing from ${idB}`);
        if (sa && sb) a++;
        else if (sa && !sb) { b++; bList.push(slug); }
        else if (!sa && sb) { c++; cList.push(slug); }
        else d++;
    }
    const n = a + b + c + d;
    return {
        n, a, b, c, d, bList, cList,
        tcrA: [...A.values()].filter(t => t.pass).length,
        // Restricted to A's slugs so a subset-vs-full comparison (the weight
        // ablations only re-run the tasks whose ordered top-k retrieval
        // changed) reports both arms over the same denominator. No-op for the
        // published pairs, where both runs cover the identical 60 tasks.
        tcrB: [...A.keys()].filter(slug => B.get(slug).pass).length,
        p: exactP(b, c),
        ci: newcombeCI(a, b, c, d),
    };
}

function levelCounts(runId) {
    const v = majorityVote(runId);
    const by = { L1: 0, L2: 0, L3: 0 };
    for (const t of v.values()) if (t.pass) by[t.level]++;
    return by;
}

function fmtP(p) {
    if (p < 0.001) return '<0.001';
    return p.toPrecision(3).replace(/0+$/, '').replace(/\.$/, '');
}

console.log(`\n=== Per-run majority-vote TCR (${RESCORE ? 'RESCORED with current scorer' : 'as recorded'}) ===`);
const absentRuns = [];
for (const id of Object.keys(RUNS)) {
    // Same reason as the non-family skip below: a release that omits a later
    // ablation run must still be able to recompute the paper's tables.
    if (!runAvailable(id)) {
        absentRuns.push(id);
        continue;
    }
    const v = majorityVote(id);
    const by = levelCounts(id);
    const tcr = [...v.values()].filter(t => t.pass).length;
    const pvr = [...v.values()].filter(x => x.pvr).length;
    console.log(`  ${id.padEnd(24)} TCR ${String(tcr).padStart(2)}/${v.size}  PVR ${String(pvr).padStart(2)}/${v.size}  Gap +${pvr - tcr}  L1=${by.L1} L2=${by.L2} L3=${by.L3}`);
}
if (absentRuns.length > 0) {
    console.log(`  [${absentRuns.length} run(s) not present in this checkout: ${absentRuns.join(', ')}]`);
}

const k = FAMILY.length;
const alpha = 0.05 / k;
console.log(`\n=== Bonferroni family: k=${k}, alpha' = 0.05/${k} = ${alpha.toFixed(5)} ===`);
for (const [idA, idB, label] of FAMILY) {
    const r = compare(idA, idB);
    // paper convention (tab:main): difference of the two rounded percentages,
    // not the rounded difference -- these disagree by 1pp on several rows.
    const dpp = Math.round((100 * r.tcrA) / r.n) - Math.round((100 * r.tcrB) / r.n);
    const sig = r.p < alpha ? 'FAMILY-WISE' : (r.p < 0.05 ? 'nominal only' : 'n.s.');
    console.log(`  ${label}`);
    console.log(`      ${r.tcrB}/${r.n} -> ${r.tcrA}/${r.n}  Delta=${dpp >= 0 ? '+' : ''}${dpp.toFixed(0)}pp` +
        `  b=${r.b} c=${r.c}  p=${fmtP(r.p)}  CI=[${r.ci[0].toFixed(0)},${r.ci[1].toFixed(0)}]pp  ${sig}` +
        `  | check ${r.tcrB}+${r.b}-${r.c}=${r.tcrB + r.b - r.c}${r.tcrB + r.b - r.c === r.tcrA ? ' OK' : ' MISMATCH'}`);
}

console.log('\n=== Outside the family ===');
// The code-and-data release ships the runs behind the paper's tables. Ablation
// runs added later may be absent from a given release, and a missing file would
// otherwise throw and take down --rescore, i.e. the artifact's headline
// reproducibility command. Non-family rows therefore degrade to an explicit
// skip. FAMILY rows deliberately do NOT degrade: those are the reported
// numbers, and a release that cannot recompute them should fail loudly.
const skipped = [];
for (const [idA, idB, label] of EXTRA) {
    if (!runAvailable(idA) || !runAvailable(idB)) {
        skipped.push(label);
        continue;
    }
    const r = compare(idA, idB);
    // Same effect-size triple as the family rows: the replication panel is
    // reported in the paper, so its rows need the interval too.
    console.log(`  ${label.padEnd(42)} ${r.tcrB}/${r.n} -> ${r.tcrA}/${r.n}  b=${r.b} c=${r.c}  p=${fmtP(r.p)}` +
        `  CI=[${r.ci[0].toFixed(0)},${r.ci[1].toFixed(0)}]pp`);
}
if (skipped.length > 0) {
    console.log(`\n  [${skipped.length} non-family comparison(s) skipped: source runs not present in this checkout]`);
    for (const label of skipped) console.log(`    - ${label}`);
}

// One-sided sign test: does saer_cold beat bm25 across the 5 primary models?
const wins = PRIMARY.filter(m => compare(`${m}/saer_cold`, `${m}/bm25`).tcrA >
    compare(`${m}/saer_cold`, `${m}/bm25`).tcrB).length;
const ties = PRIMARY.filter(m => {
    const r = compare(`${m}/saer_cold`, `${m}/bm25`);
    return r.tcrA === r.tcrB;
}).length;
const nEff = PRIMARY.length - ties;
let signP = 0;
for (let i = wins; i <= nEff; i++) signP += Math.exp(logChoose(nEff, i) + nEff * Math.log(0.5));
console.log(`\nSAER vs BM25 across ${PRIMARY.length} primary models: ${wins} wins, ${ties} ties` +
    `  one-sided sign test p=${fmtP(signP)}`);

// ---------------------------------------------------------------------------
// --strata: restrictions of the same paired counts to task subsets.
// ---------------------------------------------------------------------------
if (STRATA) {
    const tasks = JSON.parse(readFileSync('scripts/eval/eval_tasks.json', 'utf8'));
    const category = new Map(tasks.map(t => [t.slug, t.category]));

    /** Paired counts restricted to the slugs satisfying `keep`. */
    function restrict(r, keep) {
        const b = r.bList.filter(keep).length;
        const c = r.cList.filter(keep).length;
        return { b, c, p: exactP(b, c) };
    }
    const isCraft = s => category.get(s) === 'CRAFT';
    const notCombat = s => category.get(s) !== 'COMBAT';
    const nCraft = tasks.filter(t => t.category === 'CRAFT').length;
    const nOther = tasks.length - nCraft;
    const nNoCombat = tasks.filter(t => t.category !== 'COMBAT').length;

    const PAIRS = [
        ...PRIMARY.map(m => [`${m}/saer_cold`, `${m}/no_ret`, `${m}: saer_cold vs no_ret`]),
        ...PRIMARY.map(m => [`${m}/saer_cold`, `${m}/bm25`, `${m}: saer_cold vs bm25`]),
        ['qwen-max/random', 'qwen-max/no_ret', 'qwen-max: random vs no_ret'],
        ['qwen-max/bm25', 'qwen-max/no_ret', 'qwen-max: bm25 vs no_ret'],
    ];

    console.log(`\n=== Stratified by scorer applicability (CRAFT n=${nCraft}: alpha*I can fire;`
        + ` other n=${nOther}: I is identically 0) ===`);
    for (const [idA, idB, label] of PAIRS) {
        if (!runAvailable(idA) || !runAvailable(idB)) continue;
        const r = compare(idA, idB);
        const cr = restrict(r, isCraft);
        const ot = restrict(r, s => !isCraft(s));
        if (cr.b + ot.b !== r.b || cr.c + ot.c !== r.c) {
            throw new Error(`${label}: strata do not partition b/c`);
        }
        console.log(`  ${label.padEnd(34)} all b=${r.b} c=${r.c} p=${fmtP(r.p)}`
            + ` | CRAFT b=${cr.b} c=${cr.c} p=${fmtP(cr.p)}`
            + ` | non-CRAFT b=${ot.b} c=${ot.c} p=${fmtP(ot.p)}`);
    }

    console.log(`\n=== Five COMBAT tasks dropped from the denominator (n=${nNoCombat}) ===`);
    for (const [idA, idB, label] of PAIRS) {
        if (!runAvailable(idA) || !runAvailable(idB)) continue;
        const r = compare(idA, idB);
        const nc = restrict(r, notCombat);
        const A = majorityVote(idA), B = majorityVote(idB);
        const tcrA = [...A.keys()].filter(s => notCombat(s) && A.get(s).pass).length;
        const tcrB = [...A.keys()].filter(s => notCombat(s) && B.get(s).pass).length;
        if (tcrA - tcrB !== nc.b - nc.c) {
            throw new Error(`${label}: TCR difference ${tcrA - tcrB} != b-c ${nc.b - nc.c}`);
        }
        console.log(`  ${label.padEnd(34)} ${tcrB}/${nNoCombat} -> ${tcrA}/${nNoCombat}`
            + `  b=${nc.b} c=${nc.c} p=${fmtP(nc.p)}`
            + `   (all 60: ${r.tcrB}/60 -> ${r.tcrA}/60 b=${r.b} c=${r.c})`);
    }
}

// ---------------------------------------------------------------------------
// --perseed: per-seed, per-tier pass counts. The aggregate tables all report a
// majority vote over three seeds, which is a transform that sharpens around
// p=0.5, so the spread it hides is worth printing rather than asserting.
// ---------------------------------------------------------------------------
if (process.argv.includes('--perseed')) {
    const TIERS = ['L1', 'L2', 'L3'];
    const WANT = [
        ...PRIMARY.flatMap(m => [`${m}/no_ret`, `${m}/saer_cold`]),
        'qwen-max/random', 'qwen-max/bm25',
    ];
    console.log('\n=== Per-seed pass counts (no majority vote) ===');
    console.log('run                        seed  TCR/60  L1/20 L2/20 L3/20');
    const spread = { L1: [], L2: [], L3: [] };
    for (const id of WANT) {
        if (!runAvailable(id)) continue;
        const files = seedFiles(RUNS[id]);
        const perSeed = [];
        for (const f of files) {
            const doc = JSON.parse(readFileSync(f, 'utf8'));
            const by = { L1: 0, L2: 0, L3: 0 };
            let tcr = 0;
            for (const t of doc.tasks) {
                const pass = RESCORE
                    ? (t.plan ? validatePlanCorrectness(t, t.plan, [], resolver).strict_pass : false)
                    : !!t.validation?.strict_pass;
                if (pass) { tcr++; by[t.level]++; }
            }
            perSeed.push({ tcr, by });
        }
        perSeed.forEach((s, i) => {
            console.log(`  ${id.padEnd(24)} s${i + 1}   ${String(s.tcr).padStart(4)}    `
                + TIERS.map(t => String(s.by[t]).padStart(4)).join('  '));
        });
        for (const t of TIERS) {
            const v = perSeed.map(s => s.by[t]);
            spread[t].push(Math.max(...v) - Math.min(...v));
        }
    }
    console.log('\nPer-tier seed range (max-min pass count within a run), over the runs above:');
    for (const t of TIERS) {
        const v = spread[t];
        const mean = v.reduce((a, b) => a + b, 0) / v.length;
        console.log(`  ${t}: mean ${mean.toFixed(2)} tasks, max ${Math.max(...v)}, `
            + `n=${v.length} runs  [${v.join(',')}]`);
    }
}
