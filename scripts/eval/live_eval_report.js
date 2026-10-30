#!/usr/bin/env node
/**
 * live_eval_report.js
 *
 * Reads a live-eval results JSONL and prints a pass@k report by
 * model × condition × level, for TWO metrics:
 *   - STRICT : goal item obtained (primary, honest completion metric)
 *   - PREREQ : prerequisite-chain completion — goal's direct ingredients
 *              assembled, terminal craft excluded (Plan B; corroborates static
 *              plan-quality without the mineflayer #3906 terminal-craft race)
 *
 * Per (task × condition), n = number of trials:
 *   pass@1  = c / n              (mean success rate)
 *   pass@k  = 1 if c > 0 else 0  (at least one success in k=n tries)
 *
 * Aggregates are computed over PAIRED tasks only — tasks present under EVERY
 * condition — so the two conditions are always compared on the same task set.
 * Incomplete tasks are listed and excluded.
 *
 * Usage:
 *   node scripts/eval/live_eval_report.js
 *   node scripts/eval/live_eval_report.js --file path/to/results.jsonl
 *   node scripts/eval/live_eval_report.js --model deepseek
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PATH = join(__dirname, 'results', 'live_eval_results_run5_planB.jsonl');

const args = process.argv.slice(2);
const filePath = (() => {
    const idx = args.indexOf('--file');
    return idx !== -1 ? args[idx + 1] : DEFAULT_PATH;
})();
const filterModel = (() => {
    const idx = args.indexOf('--model');
    return idx !== -1 ? args[idx + 1] : null;
})();

if (!existsSync(filePath)) {
    console.error(`Results file not found: ${filePath}`);
    process.exit(1);
}

const lines  = readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean);
const trials = lines
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean)
    .map(t => ({ ...t, model: t.model || 'unknown', prereqComplete: t.prereqComplete ?? t.success }));

if (trials.length === 0) { console.log('No trials found.'); process.exit(0); }

const filtered = filterModel ? trials.filter(t => t.model === filterModel) : trials;
if (filtered.length === 0) { console.log(`No trials for model: ${filterModel}`); process.exit(0); }

// ── Group by (model, task, condition) ──────────────────────────────────────────
const grouped = {};
for (const t of filtered) {
    const k = `${t.model}||${t.task}||${t.condition}`;
    if (!grouped[k]) grouped[k] = { model: t.model, task: t.task, level: t.level || '?', condition: t.condition, trials: [] };
    grouped[k].trials.push(t);
}
const taskGroups = Object.values(grouped);

// ── pass@k for one (task × condition) group, for a given metric field ──────────
function passAtK(trialsForGroup, field) {
    const n = trialsForGroup.length;
    const c = trialsForGroup.filter(t => t[field]).length;
    return { n, c, pass1: n > 0 ? c / n : 0, passk: c > 0 ? 1 : 0 };
}

function mean(arr) { return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0; }
function pct(v)    { return `${(v * 100).toFixed(1)}%`; }

/** Aggregate pass@1 / pass@k over groups for a metric. */
function aggregate(groups, field) {
    if (groups.length === 0) return { pass1: 0, passk: 0, n: 0, seeds: 0 };
    const per = groups.map(g => passAtK(g.trials, field));
    return {
        pass1: mean(per.map(p => p.pass1)),
        passk: mean(per.map(p => p.passk)),
        n: groups.length,
        seeds: Math.max(...per.map(p => p.n)),
    };
}

const models     = [...new Set(taskGroups.map(g => g.model))].sort();
const conditions = [...new Set(taskGroups.map(g => g.condition))].sort();
const levels     = ['L1', 'L2', 'L3'];
const W = 80;

console.log('\n' + '═'.repeat(W));
console.log(' Live Bot Evaluation — pass@k Report  (STRICT + PREREQ-chain / Plan B)');
console.log(` File:    ${filePath}`);
console.log(` Trials:  ${filtered.length}   Models: ${models.length}   Conditions: ${conditions.join(', ')}`);
console.log('═'.repeat(W));

// ── Render one metric block for one model over a paired task set ────────────────
function renderMetric(label, modelGroups, pairedTasks, field) {
    console.log(`\n  ── ${label} ──`);
    const condHdr = conditions.map(c => c.slice(0, 12).padEnd(26)).join('');
    console.log(`  ${'Level'.padEnd(6)} ${condHdr}${conditions.length === 2 ? 'Δ pass@1' : ''}`);
    console.log(`  ${''.padEnd(6)} ${conditions.map(() => 'p@1     p@k     n_pass/n'.padEnd(26)).join('')}`);

    for (const lvl of [...levels, 'Total']) {
        const sel = g => pairedTasks.has(g.task) && (lvl === 'Total' || g.level === lvl);
        const aggByCond = {};
        for (const cond of conditions) aggByCond[cond] = aggregate(modelGroups.filter(g => g.condition === cond && sel(g)), field);

        const cells = conditions.map(cond => {
            const a = aggByCond[cond];
            const frac = `${Math.round(a.pass1 * a.n)}/${a.n}`;
            return `${pct(a.pass1).padEnd(8)}${pct(a.passk).padEnd(8)}${frac}`.padEnd(26);
        }).join('');

        let delta = '';
        if (conditions.length === 2) {
            const d = aggByCond[conditions[1]].pass1 - aggByCond[conditions[0]].pass1;
            delta = `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}pp`;
        }
        console.log(`  ${lvl.padEnd(6)} ${cells}${delta}`);
    }
}

for (const model of models) {
    const modelGroups = taskGroups.filter(g => g.model === model);
    if (modelGroups.length === 0) continue;

    // Paired tasks = present under EVERY condition (same task set for both columns).
    const allTasks = [...new Set(modelGroups.map(g => g.task))];
    const pairedTasks = new Set(allTasks.filter(task =>
        conditions.every(cond => modelGroups.some(g => g.task === task && g.condition === cond))
    ));
    const incomplete = allTasks.filter(t => !pairedTasks.has(t));

    console.log(`\n┌${'─'.repeat(W - 2)}┐`);
    console.log(`│  Model: ${model.padEnd(W - 10)}│`);
    console.log(`└${'─'.repeat(W - 2)}┘`);
    console.log(`  Paired tasks: ${pairedTasks.size}/${allTasks.length}` +
        (incomplete.length ? `   (excluded incomplete: ${incomplete.join(', ')})` : ''));

    renderMetric('STRICT completion (goal item obtained)', modelGroups, pairedTasks, 'success');
    renderMetric('PREREQ-chain completion (terminal craft excluded — Plan B)', modelGroups, pairedTasks, 'prereqComplete');

    // Per-task breakdown (strict ✓/✗, prereq ◑ where prereq-only)
    console.log('\n  Per-task (S=strict ✓/✗, P=prereq ◑ when prereq-only):');
    console.log(`  ${'Task'.padEnd(26)} ${'L'.padEnd(3)} ${conditions.map(c => c.slice(0, 16).padEnd(20)).join(' ')}`);
    for (const task of allTasks.sort()) {
        const level = modelGroups.find(g => g.task === task)?.level || '?';
        const flag  = pairedTasks.has(task) ? '  ' : ' !';
        const cells = conditions.map(cond => {
            const g = modelGroups.find(gx => gx.task === task && gx.condition === cond);
            if (!g) return '─'.repeat(20);
            const dots = g.trials.map(t => t.success ? '✓' : (t.prereqComplete ? '◑' : '✗')).join('');
            const ps   = passAtK(g.trials, 'success');
            return `${dots.padEnd(6)} p@1=${pct(ps.pass1)}`.padEnd(20);
        }).join(' ');
        console.log(`  ${task.slice(0, 26).padEnd(26)}${flag} ${level.padEnd(3)} ${cells}`);
    }
}

console.log('\n' + '═'.repeat(W) + '\n');
