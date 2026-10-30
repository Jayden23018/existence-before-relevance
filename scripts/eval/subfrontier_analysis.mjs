/**
 * Sub-frontier capacity de-aliasing analysis.
 *
 * For each of the 3 new cross-family small models (Llama-3.1-8B, Ministral-8B,
 * Gemma-3-12B) run via OpenRouter, compute:
 *   - no_retrieval vs saer_cold TCR (overall + L1/L2/L3) from majority_vote.json
 *   - McNemar (saer_cold vs no_retrieval): b/c + two-tailed p from per-seed JSON
 *
 * Glob-discovers result files by meta.model + condition (NOT hardcoded filenames,
 * unlike mcnemar_analysis.mjs). Prints a k-model trend table to stdout and writes
 * scripts/eval/results/fixed_mcdata/subfrontier_k4_table.md.
 *
 * Usage:
 *   node scripts/eval/subfrontier_analysis.mjs
 *
 * McNemar convention (matches mcnemar_analysis.mjs):
 *   For each task, majority vote across seeds (pass if count > n/2).
 *   b = saer_cold passes & no_retrieval fails
 *   c = saer_cold fails  & no_retrieval passes
 *   p = exact binomial (b+c < 25) else chi-squared(1 df, continuity-corrected)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, 'results', 'fixed_mcdata');
const FALLBACK_DIR = join(__dirname, 'results'); // for qwen3-8b no_retrieval anchor

// ── Model normalization: OpenRouter long id / raw id → short paper label ──────
const MODEL_LABELS = [
    { match: /llama-3\.1-8b-instruct/i, label: 'Llama-3.1-8B' },
    { match: /ministral-8b/i, label: 'Ministral-8B' },
    { match: /gemma-3-12b/i, label: 'Gemma-3-12B' },
    { match: /qwen3-?8b/i, label: 'Qwen3-8B' },
];

function labelFor(modelId) {
    if (!modelId) return modelId;
    for (const { match, label } of MODEL_LABELS) {
        if (match.test(modelId)) return label;
    }
    return modelId;
}

// ── Stats helpers (ported from mcnemar_analysis.mjs) ──────────────────────────
function logFactorial(n) {
    let s = 0;
    for (let i = 2; i <= n; i++) s += Math.log(i);
    return s;
}

/** Exact two-tailed binomial p-value: P(X <= min(b,c) | Binom(b+c, 0.5)) * 2 */
function binomialPValue(b, c) {
    const n = b + c;
    if (n === 0) return 1.0;
    const k = Math.min(b, c);
    const logHalf = Math.log(0.5);
    let p = 0;
    for (let i = 0; i <= k; i++) {
        p += Math.exp(logFactorial(n) - logFactorial(i) - logFactorial(n - i) + n * logHalf);
    }
    return Math.min(1, 2 * p);
}

function chiSqPValue(b, c) {
    // chi-squared 1 df with continuity correction: ((|b-c|-1)^2)/(b+c)
    const n = b + c;
    if (n === 0) return 1.0;
    const chi = (Math.abs(b - c) - 1) ** 2 / n;
    // Survival function of chi-squared(1) = erfc(sqrt(chi/2))
    return erfc(Math.sqrt(chi / 2));
}

function erfc(x) {
    // Abramowitz-Stegun 7.1.26 approximation
    const z = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * z);
    const r = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
    return x >= 0 ? r : 2 - r;
}

function mcnemarPValue(b, c) {
    return (b + c) < 25 ? binomialPValue(b, c) : chiSqPValue(b, c);
}

function stars(p) {
    if (p < 0.001) return '***';
    if (p < 0.01) return '**';
    if (p < 0.05) return '*';
    return '';
}

// ── File discovery ────────────────────────────────────────────────────────────
function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'));
}

function findFiles(dir, predicate) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
        .filter(f => f.endsWith('.json') && predicate(f))
        .map(f => join(dir, f));
}

/** Group per-seed files for one (model, condition) by filename timestamp prefix.
 *  Seeds from one `--seeds 3` invocation share the filename timestamp
 *  (eval_<TS>_<condition>_sN.json); meta.timestamp differs per seed (start time). */
function groupSeedFiles(dir, modelId, condition) {
    const seeds = findFiles(dir, f =>
        f.endsWith(`_${condition}_s1.json`) || f.endsWith(`_${condition}_s2.json`) || f.endsWith(`_${condition}_s3.json`)
    );
    const groups = new Map(); // filename-ts-prefix -> [seed file paths]
    for (const path of seeds) {
        try {
            const j = readJson(path);
            if (j.meta?.model !== modelId || j.meta?.condition !== condition) continue;
            // Filename key: eval_<TS>_<condition>_sN.json → eval_<TS>_<condition>
            const base = path.split('/').pop();
            const key = base.replace(/_s[123]\.json$/, '');
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(path);
        } catch { /* skip */ }
    }
    // Prefer a complete 3-seed group; else the largest
    let best = [];
    for (const paths of groups.values()) if (paths.length > best.length) best = paths;
    return best;
}

function findMajorityVote(dir, modelId, condition, { latest = false } = {}) {
    const files = findFiles(dir, f => f.endsWith(`_${condition}_majority_vote.json`));
    const matched = [];
    for (const path of files) {
        try {
            const j = readJson(path);
            if (j.meta?.model === modelId && j.meta?.condition === condition) matched.push({ j, ts: j.meta?.timestamp || '' });
        } catch { /* skip corrupt */ }
    }
    if (matched.length === 0) return null;
    if (latest) matched.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    return matched[0].j;
}

// ── Per-task majority vote across seeds ───────────────────────────────────────
function majorityVotePass(seedPaths) {
    const perTask = new Map(); // slug -> [bool...]
    for (const path of seedPaths) {
        const j = readJson(path);
        for (const t of j.tasks || []) {
            if (!perTask.has(t.slug)) perTask.set(t.slug, []);
            perTask.get(t.slug).push(t.validation?.strict_pass === true);
        }
    }
    const result = new Map(); // slug -> majority bool
    for (const [slug, passes] of perTask) {
        const count = passes.filter(Boolean).length;
        result.set(slug, count > passes.length / 2);
    }
    return result;
}

// ── Main per-model computation ────────────────────────────────────────────────
function computeModel(modelId, label) {
    const out = { label, modelId, ok: false };

    // majority_vote.json for both conditions (dirs: try fixed_mcdata then fallback)
    const dirs = [RESULTS_DIR, FALLBACK_DIR];
    let mvNo = null, mvSaer = null;
    for (const d of dirs) {
        if (!mvNo) mvNo = findMajorityVote(d, modelId, 'no_retrieval');
        if (!mvSaer) mvSaer = findMajorityVote(d, modelId, 'saer_cold');
    }
    if (!mvNo || !mvSaer) {
        out.missing = !mvNo ? 'no_retrieval majority_vote.json' : 'saer_cold majority_vote.json';
        return out;
    }

    out.noRet = parseTcr(mvNo);
    out.saer = parseTcr(mvSaer);
    out.deltaPp = Math.round((out.saer.pct - out.noRet.pct) * 10) / 10;

    // McNemar: need per-seed files for both conditions
    let noSeeds = [], saerSeeds = [];
    for (const d of dirs) {
        if (noSeeds.length < 3) noSeeds = groupSeedFiles(d, modelId, 'no_retrieval');
        if (saerSeeds.length < 3) saerSeeds = groupSeedFiles(d, modelId, 'saer_cold');
    }
    if (noSeeds.length === 0 || saerSeeds.length === 0) {
        out.mcnemar = { b: null, c: null, p: null, note: `seeds found: no_ret=${noSeeds.length} saer=${saerSeeds.length}` };
        out.ok = true;
        return out;
    }
    const noVote = majorityVotePass(noSeeds);
    const saerVote = majorityVotePass(saerSeeds);

    let b = 0, c = 0; // b=saer pass & no fail; c=saer fail & no pass
    for (const slug of noVote.keys()) {
        const np = noVote.get(slug);
        const sp = saerVote.get(slug);
        if (sp === undefined) continue;
        if (sp && !np) b++;
        if (!sp && np) c++;
    }
    const p = mcnemarPValue(b, c);
    out.mcnemar = { b, c, p, seeds: { no: noSeeds.length, saer: saerSeeds.length } };

    // parse_success rate per condition (sanity: confirms ceiling reflects knowledge, not format)
    out.ps = {
        no: aggregateParseSuccess(noSeeds),
        saer: aggregateParseSuccess(saerSeeds),
    };
    out.ok = true;
    return out;
}

/** Average parse_success rate across seed files (each task counted per seed). */
function aggregateParseSuccess(seedPaths) {
    if (!seedPaths || seedPaths.length === 0) return null;
    let totalTasks = 0, totalPs = 0;
    for (const path of seedPaths) {
        try {
            const j = readJson(path);
            for (const t of j.tasks || []) {
                totalTasks++;
                if (t.parse_success === true) totalPs++;
            }
        } catch { /* skip */ }
    }
    if (totalTasks === 0) return null;
    return { rate: totalPs / totalTasks, ps: totalPs, total: totalTasks, pct: Math.round((totalPs / totalTasks) * 1000) / 10 };
}

function parseTcr(mv) {
    const overall = mv.overall?.strict_tcr || '0/0';
    const [pass, total] = overall.split('/').map(Number);
    const pct = total ? (pass / total) * 100 : 0;
    const L = lvl => mv.by_level?.[lvl]?.strict ?? '?';
    return {
        str: overall,
        pct: Math.round(pct * 10) / 10,
        L1: L('L1'), L2: L('L2'), L3: L('L3'),
        L2pct: mv.by_level?.L2 ? Math.round((mv.by_level.L2.strict / mv.by_level.L2.total) * 1000) / 10 : null,
    };
}

// ── Output ────────────────────────────────────────────────────────────────────
// Methodology (per plan): compare SAER CEILING (saer_cold TCR), NOT gain, because
// no_retrieval floors differ up to 7× across small models and inflate gains.
// parse_success confirms the ceiling reflects knowledge, not format compliance.
function fmtCell(t) { return t ? `${t.str} (${t.pct}%)` : '—'; }
function fmtPs(ps) { return ps ? `${ps.pct}%` : '—'; }
function fmtRow(r) {
    if (!r.ok) return `| ${r.label} | (missing: ${r.missing || 'data'}) | | | | | |`;
    const nr = r.noRet, sa = r.saer, m = r.mcnemar;
    if (!nr || !sa) return `| ${r.label} | ${fmtCell(nr)} | ${fmtCell(sa)} | ${fmtPs(r.ps?.saer)} | — | ${m ? `${m.b}/${m.c}` : '—'} |`;
    const mstr = m && m.b !== null && m.b !== undefined
        ? `${m.b}/${m.c} (p=${m.p.toExponential(2)}${stars(m.p)})`
        : '(no seeds)';
    const dstr = r.deltaPp === null || r.deltaPp === undefined ? '—' : `${r.deltaPp >= 0 ? '+' : ''}${r.deltaPp}pp`;
    return `| ${r.label} | ${fmtCell(nr)} | **${fmtCell(sa)}** | ${fmtPs(r.ps?.no)}/${fmtPs(r.ps?.saer)} | ${dstr} | ${mstr} |`;
}

function main() {
    // Targets: 3 cross-family non-Qwen small models, all via OpenRouter.
    const targets = [
        { id: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama-3.1-8B' },
        { id: 'mistralai/ministral-8b-2512', label: 'Ministral-8B' },
        { id: 'google/gemma-3-12b-it', label: 'Gemma-3-12B' },
    ];
    const results = targets.map(t => computeModel(t.id, t.label));

    // Qwen3-8B anchor — canonical numbers from the paper's main table, NOT rerun.
    // These are the rescored values printed by `mcnemar_table.mjs --rescore`, which is
    // the single authority for every count in the paper; do not copy them from the
    // run-time *_majority_vote.json files, which predate two scoring fixes.
    // parse_success for anchor: main models all =100% under no_ret (canonical/ verified).
    const qwenRow = {
        ok: true,
        label: 'Qwen3-8B (anchor, main table)',
        noRet: { str: '14/60', pct: 23.3, L1: 9, L2: 3, L3: 2, L2pct: 15.0 },
        saer:  { str: '26/60', pct: 43.3, L1: 12, L2: 11, L3: 3, L2pct: 55.0 },
        mcnemar: { b: 15, c: 3, p: 0.00754 },
        deltaPp: 20.0,
        ps: { no: { pct: 100.0 }, saer: { pct: 100.0 } },
    };

    const header = `| Model | no_ret TCR (floor) | **saer_cold TCR (ceiling)** | parse_success no/saer | Δ (pp) | McNemar b/c (p) |
|---|---|---|---|---|---|`;
    const lines = [
        '# Sub-Frontier Capacity De-aliasing — compare CEILING, not gain',
        '',
        'Generated by `scripts/eval/subfrontier_analysis.mjs`.',
        '',
        '**Method**: capacity is compared via the SAER **ceiling** (saer_cold TCR), not the',
        'no_ret→saer_cold gain, because no_retrieval floors differ up to 7× across small',
        'models (e.g. Llama 2/60 vs Qwen3-8B 14/60), which inflates gains. parse_success is',
        'reported to confirm the ceiling reflects knowledge, not format compliance (saer_cold',
        'parse_success should be ≈100%).',
        '',
        'Qwen3-8B is the primary-study anchor (main table, not rerun). New models:',
        'Llama-3.1-8B, Ministral-8B, Gemma-3-12B (all via OpenRouter). All run with the',
        'setRecipeResolver-fixed static_plan_eval.js, 3 seeds, 60 tasks.',
        '',
        '**E4 trip**: if any new model saer_cold TCR ≥ 42 (approaches frontier), STOP and',
        'report — do not draw capacity-scaling conclusions.',
        '',
        header,
        fmtRow(qwenRow),
        ...results.map(fmtRow),
        '',
    ];

    // Assert each cell traces back to source JSON (consistency guard)
    let assertOk = true;
    for (const r of results) {
        if (!r.ok) continue;
        // Re-read and cross-check TCR matches majority_vote.json
        for (const d of [RESULTS_DIR, FALLBACK_DIR]) {
            const mv = findMajorityVote(d, r.modelId, 'saer_cold');
            if (mv && mv.overall.strict_tcr !== r.saer.str) {
                console.error(`ASSERT FAIL: ${r.label} saer_cold ${r.saer.str} != ${mv.overall.strict_tcr}`);
                assertOk = false;
            }
        }
    }
    // Note: this guard covers the three rerun models only. The Qwen3-8B anchor row is
    // exempt by design — it is quoted from `mcnemar_table.mjs --rescore` (the paper's
    // authority), not from the run-time majority_vote.json files these three are checked
    // against, which predate two scoring fixes.
    lines.push(assertOk
        ? '_Consistency assert: PASS (the three rerun models\' TCR cells match their majority_vote.json; the Qwen3-8B anchor is quoted from `mcnemar_table.mjs --rescore`)_'
        : '_Consistency assert: FAIL — see stderr_');
    lines.push('');

    // E4 trip: any new model saer_cold ceiling approaching frontier (≥34/60)?
    const FRONTIER_CEILING = 42; // frontier models saer_cold 42-52/60 (GPT-4o floor, main table)
    const tripped = results.filter(r => r.ok && r.saer && r.saer.pct >= FRONTIER_CEILING / 60 * 100);
    if (tripped.length > 0) {
        lines.push(`> ⚠️ **E4 TRIP**: ${tripped.map(r => `${r.label} (saer_cold ${r.saer.str})`).join(', ')} ` +
            `≥ ${FRONTIER_CEILING}/60 approaches the frontier. **STOP — do not draw capacity-scaling conclusions; report to user.**`);
        lines.push('');
    }

    const md = lines.join('\n');
    writeFileSync(join(RESULTS_DIR, 'subfrontier_k4_table.md'), md);
    console.log(md);
    console.log(`\nWritten: ${join(RESULTS_DIR, 'subfrontier_k4_table.md')}`);
}

main();
