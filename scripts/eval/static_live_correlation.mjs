#!/usr/bin/env node
/**
 * static_live_correlation.mjs
 *
 * Task-level static ↔ live correspondence for the live pass@k supporting study.
 *
 * Reads:
 *   - STATIC  canonical results: scripts/eval/results/canonical/eval_<ts>_<cond>_s{1,2,3}.json
 *     schema: { meta:{model,condition}, tasks:[{slug, level, validation:{strict_pass}}] }
 *     → aggregate 3 seeds into a per-task static pass-rate ∈ {0, 1/3, 2/3, 1}
 *   - LIVE    live eval results: scripts/eval/results/live_eval_results.jsonl
 *     schema: { model, task, condition, success, seed }
 *     → aggregate seeds into per-task live pass@1 = c/n
 *
 * Joins by task slug (21 live tasks ⊂ static-60). Outputs:
 *   - Spearman ρ between static pass-rate and live pass@1 (per model × condition)
 *   - per-level mean Δ(live − static)
 *   - task-level mismatch list (static pass vs live fail, and vice versa)
 *
 * NOTE: only models with BOTH a static 60-task benchmark AND live data are comparable
 * via ρ. qwen3-8b has both (static canonical 60-task + live 21-task). deepseek has both.
 * ρ is computed over the 21 live tasks only (the intersection).
 *
 * Usage:
 *   node scripts/eval/static_live_correlation.mjs
 *   node scripts/eval/static_live_correlation.mjs --live results/live_eval_results.jsonl
 *
 * READ-ONLY: writes nothing. Static files are frozen reference data.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const STATIC_DIR = join(__dirname, 'results', 'canonical');
const LIVE_DEFAULT = join(__dirname, 'results', 'live_eval_results.jsonl');

// CLI: optional --live path, --static-dir path
const args = process.argv.slice(2);
const getOpt = (name) => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : null; };
const LIVE_PATH    = getOpt('--live') || LIVE_DEFAULT;
const STATIC_DIR_ARG = getOpt('--static-dir') || STATIC_DIR;

// ── Static timestamps per (model, condition) — the canonical 3-seed runs ─────────
// Discovered via meta.model/condition scan of canonical/ (see handoff §6).
const STATIC_RUNS = {
    'deepseek-chat': { no_retrieval: '20260604_231018', saer_cold: '20260604_233642' },
    'qwen3-8b':      { no_retrieval: '20260605_213048', saer_cold: '20260605_213054' },
};

// live jsonl model labels → canonical model names
const MODEL_ALIAS = {
    'deepseek': 'deepseek-chat',
    'qwen3-8b': 'qwen3-8b',
};

// ── Load static per-task pass-rate (3-seed majority) ────────────────────────────
function loadStatic(modelKey, condition) {
    const ts = STATIC_RUNS[modelKey]?.[condition];
    if (!ts) return null;
    const counts = {}; // slug → {pass, n}
    for (const s of [1, 2, 3]) {
        const f = join(STATIC_DIR_ARG, `eval_${ts}_${condition}_s${s}.json`);
        if (!existsSync(f)) return null;
        const j = JSON.parse(readFileSync(f, 'utf8'));
        for (const t of j.tasks || []) {
            const slug = t.slug;
            if (!counts[slug]) counts[slug] = { pass: 0, n: 0, level: t.level };
            counts[slug].n += 1;
            if (t.validation?.strict_pass) counts[slug].pass += 1;
        }
    }
    const out = {};
    for (const [slug, c] of Object.entries(counts)) {
        out[slug] = { passRate: c.n > 0 ? c.pass / c.n : 0, level: c.level };
    }
    return out;
}

// ── Load live per-task pass@1 ───────────────────────────────────────────────────
function loadLive() {
    if (!existsSync(LIVE_PATH)) return null;
    const lines = readFileSync(LIVE_PATH, 'utf8').trim().split('\n').filter(Boolean);
    // key: model||task||condition → {pass, n, level}
    const g = {};
    for (const line of lines) {
        let t; try { t = JSON.parse(line); } catch { continue; }
        const k = `${t.model}||${t.task}||${t.condition}`;
        if (!g[k]) g[k] = { pass: 0, n: 0, level: t.level };
        g[k].n += 1;
        if (t.success) g[k].pass += 1;
    }
    const out = {}; // model||condition → { slug → pass1 }
    for (const [k, v] of Object.entries(g)) {
        const [model, task, condition] = k.split('||');
        const mk = `${model}||${condition}`;
        (out[mk] = out[mk] || {})[task] = v.n > 0 ? v.pass / v.n : 0;
    }
    return out;
}

// ── Spearman rank correlation (no deps) ─────────────────────────────────────────
function spearman(xs, ys) {
    const n = xs.length;
    if (n < 3) return null;
    const rank = (arr) => {
        const idx = arr.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
        const r = new Array(n);
        let i = 0;
        while (i < n) {
            let j = i;
            while (j + 1 < n && idx[j + 1][0] === idx[i][0]) j++;
            const avg = (i + j) / 2 + 1; // 1-based average rank
            for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
            i = j + 1;
        }
        return r;
    };
    const rx = rank(xs), ry = rank(ys);
    const mx = rx.reduce((s, v) => s + v, 0) / n;
    const my = ry.reduce((s, v) => s + v, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
        const a = rx[i] - mx, b = ry[i] - my;
        num += a * b; dx += a * a; dy += b * b;
    }
    if (dx === 0 || dy === 0) return null;
    return num / Math.sqrt(dx * dy);
}

function pct(v) { return `${(v * 100).toFixed(1)}%`; }

// ── Main ────────────────────────────────────────────────────────────────────────
function main() {
    const live = loadLive();
    if (!live) { console.error(`Live results not found: ${LIVE_PATH}`); process.exit(1); }

    const W = 78;
    console.log('\n' + '═'.repeat(W));
    console.log(' Static ↔ Live Task-Level Correspondence');
    console.log(` Static dir: ${STATIC_DIR_ARG}`);
    console.log(` Live file:  ${LIVE_PATH}`);
    console.log('═'.repeat(W));

    for (const [liveModel, staticModel] of Object.entries(MODEL_ALIAS)) {
        for (const condition of ['no_retrieval', 'saer_cold']) {
            const staticMap = loadStatic(staticModel, condition);
            const liveMap = live[`${liveModel}||${condition}`];
            if (!staticMap || !liveMap) {
                console.log(`\n[SKIP] ${liveModel} / ${condition}: missing static or live data.`);
                continue;
            }

            // Join over live tasks (21 ⊂ static-60)
            const xs = [], ys = [], rows = [];
            for (const [slug, liveP] of Object.entries(liveMap)) {
                const st = staticMap[slug];
                if (!st) continue;
                xs.push(st.passRate); ys.push(liveP);
                rows.push({ slug, level: st.level, static: st.passRate, live: liveP });
            }
            const n = xs.length;
            const rho = spearman(xs, ys);

            console.log(`\n┌${'─'.repeat(W - 2)}┐`);
            console.log(`│  ${liveModel}  /  ${condition}   (n=${n} live tasks ⊂ static-60)`.padEnd(W - 1) + '│');
            console.log(`└${'─'.repeat(W - 2)}┘`);
            console.log(`  Spearman ρ (static pass-rate vs live pass@1): ${rho !== null ? rho.toFixed(3) : 'n/a (n<3 or no variance)'}`);

            // Per-level Δ(live − static)
            const levels = ['L1', 'L2', 'L3'];
            console.log('\n  Per-level mean (static / live / Δ):');
            for (const lvl of levels) {
                const sub = rows.filter(r => r.level === lvl);
                if (sub.length === 0) continue;
                const ms = sub.reduce((s, r) => s + r.static, 0) / sub.length;
                const ml = sub.reduce((s, r) => s + r.live, 0) / sub.length;
                const d = ml - ms;
                console.log(`    ${lvl} (n=${sub.length}):  static ${pct(ms)}  |  live ${pct(ml)}  |  Δ ${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}pp`);
            }

            // Task-level mismatches
            const staticPass = (r) => r.static >= 2 / 3; // static "pass" = strict majority over 3 seeds
            const livePass  = (r) => r.live > 0;          // live "pass" = any success across seeds
            const staticOnly = rows.filter(r => staticPass(r) && !livePass(r));
            const liveOnly  = rows.filter(r => !staticPass(r) && livePass(r));
            const agree     = rows.filter(r => staticPass(r) === livePass(r));
            console.log(`\n  Task-level agreement: ${agree.length}/${n} agree (static-majority vs live-any-pass)`);
            if (staticOnly.length) {
                console.log(`  Static-pass but live-fail (${staticOnly.length}): ${staticOnly.map(r => r.slug).join(', ')}`);
            }
            if (liveOnly.length) {
                console.log(`  Live-pass but static-fail (${liveOnly.length}): ${liveOnly.map(r => r.slug).join(', ')}`);
            }
        }
    }

    console.log('\n' + '═'.repeat(W));
    console.log(' Interpretation: ρ>0 ⇒ static plan correctness (TCR) predicts live completion.');
    console.log(' Live is a SUPPORTING study; static TCR remains the primary metric.');
    console.log(' Note: ρ computed over 21 live tasks only (small n ⇒ wide CI; treat as descriptive).');
    console.log('═'.repeat(W) + '\n');
}

main();
