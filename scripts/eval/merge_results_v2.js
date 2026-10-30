#!/usr/bin/env node

/**
 * merge_results_v2.js — Generate ablation comparison report for 4-condition v2 eval.
 *
 * Reads the latest eval_v2_*_CONDITION.json files from results/ and generates:
 *   - Comparison table: no_retrieval / random / saer_cold / saer_warm
 *   - Key delta: saer_warm vs saer_cold → isolates gap scoring contribution
 *   - Per-task breakdown
 *
 * Usage:
 *   node scripts/eval/merge_results_v2.js                  # auto-detect latest files
 *   node scripts/eval/merge_results_v2.js results/eval_v2_*.json  # explicit files
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONDITIONS = ['no_retrieval', 'random_retrieval', 'saer_cold', 'saer_warm'];

const CONDITION_LABELS = {
    no_retrieval: 'No Retrieval',
    random_retrieval: 'Random',
    saer_cold: 'SAER-cold (keyword only)',
    saer_warm: '**SAER-warm (full, ours)**'
};

function findLatestFile(resultsDir, condition) {
    const files = readdirSync(resultsDir)
        .filter(f => f.startsWith('eval_v2_') && f.endsWith(`_${condition}.json`))
        .sort()
        .reverse();
    return files.length > 0 ? join(resultsDir, files[0]) : null;
}

function formatTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
        `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function parseFraction(fracStr) {
    const parts = String(fracStr || '0/0').split('/');
    if (parts.length !== 2) return { num: 0, den: 1 };
    return { num: parseInt(parts[0]) || 0, den: parseInt(parts[1]) || 1 };
}

function fractionToRate(fracStr) {
    const { num, den } = parseFraction(fracStr);
    return den > 0 ? num / den : 0;
}

function deltaStr(fracA, fracB) {
    const diff = fractionToRate(fracB) - fractionToRate(fracA);
    const pct = (diff * 100).toFixed(1);
    return diff >= 0 ? `+${pct}%` : `${pct}%`;
}

function main() {
    const args = process.argv.slice(2);
    const resultsDir = join(__dirname, 'results');

    const files = {};
    if (args.length >= 1 && args.some(a => a.includes('eval_v2_'))) {
        for (const arg of args) {
            for (const cond of CONDITIONS) {
                if (arg.includes(`_${cond}.json`)) files[cond] = arg;
            }
        }
    } else {
        for (const cond of CONDITIONS) {
            const f = findLatestFile(resultsDir, cond);
            if (f) { files[cond] = f; console.log(`Found ${cond}: ${f}`); }
            else console.warn(`No v2 results found for condition: ${cond}`);
        }
    }

    if (Object.keys(files).length === 0) {
        console.error('No result files found. Run static_plan_eval_v2.js first.');
        process.exit(1);
    }

    const data = {};
    for (const [cond, filePath] of Object.entries(files)) {
        data[cond] = JSON.parse(readFileSync(filePath, 'utf8'));
    }

    const timestamp = formatTimestamp();
    const levels = ['L1', 'L2', 'L3'];

    // Build comparison per level and overall
    const comparison = {};
    for (const level of [...levels, 'overall']) {
        comparison[level] = {};
        for (const [cond, condData] of Object.entries(data)) {
            const taskList = level === 'overall'
                ? condData.tasks
                : condData.tasks.filter(t => t.level === level);
            const total = taskList.length;
            if (total === 0) continue;

            const parseOk = taskList.filter(t => t.parse_success).length;
            const strictPass = taskList.filter(t => t.validation.strict_pass).length;
            const lenientPass = taskList.filter(t => t.validation.lenient_pass).length;
            const pvrPass = taskList.filter(t => t.validation.pvr).length;
            const avgEff = total > 0
                ? Math.round(taskList.reduce((s, t) => s + t.validation.step_efficiency, 0) / total * 100) / 100
                : 0;

            comparison[level][cond] = {
                parse_success_rate: `${parseOk}/${total}`,
                strict_tcr: `${strictPass}/${total}`,
                lenient_tcr: `${lenientPass}/${total}`,
                pvr: `${pvrPass}/${total}`,
                avg_step_efficiency: avgEff
            };
        }
    }

    // Collect all slugs
    const slugSet = new Set();
    for (const condData of Object.values(data)) {
        for (const task of condData.tasks) slugSet.add(task.slug);
    }
    const allSlugs = [...slugSet].sort();

    // Build markdown report
    const lines = [];
    lines.push('# SAER v2 Ablation Study — Plan Quality Comparison');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Model info
    const modelInfo = Object.values(data).map(d => d.meta.model).filter(Boolean);
    if (modelInfo.length > 0) lines.push(`**Model**: ${[...new Set(modelInfo)].join(', ')}`);
    lines.push('');

    // ── Main result table: Lenient TCR ──
    lines.push('## Task Completion Rate (Lenient TCR)');
    lines.push('*Lenient: forgives raw_ore naming (e.g. smeltItem("iron_ore") instead of "raw_iron")*');
    lines.push('');
    lines.push('| Method | L1 | L2 | L3 | Overall |');
    lines.push('|--------|----|----|-----|---------|');
    for (const cond of CONDITIONS) {
        if (!data[cond]) continue;
        const cells = levels.map(l => comparison[l]?.[cond]?.lenient_tcr ?? '-');
        const overall = comparison.overall?.[cond]?.lenient_tcr ?? '-';
        lines.push(`| ${CONDITION_LABELS[cond]} | ${cells.join(' | ')} | ${overall} |`);
    }
    lines.push('');

    // ── Strict TCR ──
    lines.push('## Strict TCR (any issue = fail)');
    lines.push('');
    lines.push('| Method | L1 | L2 | L3 | Overall |');
    lines.push('|--------|----|----|-----|---------|');
    for (const cond of CONDITIONS) {
        if (!data[cond]) continue;
        const cells = levels.map(l => comparison[l]?.[cond]?.strict_tcr ?? '-');
        const overall = comparison.overall?.[cond]?.strict_tcr ?? '-';
        lines.push(`| ${CONDITION_LABELS[cond]} | ${cells.join(' | ')} | ${overall} |`);
    }
    lines.push('');

    // ── PVR ──
    lines.push('## Plan Validity Rate (PVR)');
    lines.push('');
    lines.push('| Method | L1 | L2 | L3 | Overall |');
    lines.push('|--------|----|----|-----|---------|');
    for (const cond of CONDITIONS) {
        if (!data[cond]) continue;
        const cells = levels.map(l => comparison[l]?.[cond]?.pvr ?? '-');
        const overall = comparison.overall?.[cond]?.pvr ?? '-';
        lines.push(`| ${CONDITION_LABELS[cond]} | ${cells.join(' | ')} | ${overall} |`);
    }
    lines.push('');

    // ── Parse Success Rate ──
    lines.push('## Parse Success Rate');
    lines.push('*Low parse rate for SAER conditions indicates few-shot examples confuse output format*');
    lines.push('');
    lines.push('| Method | L1 | L2 | L3 | Overall |');
    lines.push('|--------|----|----|-----|---------|');
    for (const cond of CONDITIONS) {
        if (!data[cond]) continue;
        const cells = levels.map(l => comparison[l]?.[cond]?.parse_success_rate ?? '-');
        const overall = comparison.overall?.[cond]?.parse_success_rate ?? '-';
        lines.push(`| ${CONDITION_LABELS[cond]} | ${cells.join(' | ')} | ${overall} |`);
    }
    lines.push('');

    // ── Key Delta: saer_warm vs saer_cold (isolates gap scoring) ──
    if (data.saer_cold && data.saer_warm) {
        lines.push('## SAER Gap Scoring Contribution');
        lines.push('*Delta = SAER-warm minus SAER-cold — isolates the value of gap scoring over keyword-only*');
        lines.push('');
        lines.push('| Metric | L1 | L2 | L3 | Overall |');
        lines.push('|--------|----|----|-----|---------|');

        const metrics = [
            { label: 'Lenient TCR Δ', field: 'lenient_tcr' },
            { label: 'Strict TCR Δ', field: 'strict_tcr' },
            { label: 'PVR Δ', field: 'pvr' }
        ];
        for (const { label, field } of metrics) {
            const cells = levels.map(l => {
                const cold = comparison[l]?.saer_cold?.[field];
                const warm = comparison[l]?.saer_warm?.[field];
                if (!cold || !warm) return '-';
                return deltaStr(cold, warm);
            });
            const cold = comparison.overall?.saer_cold?.[field];
            const warm = comparison.overall?.saer_warm?.[field];
            const overallDelta = (cold && warm) ? deltaStr(cold, warm) : '-';
            lines.push(`| ${label} | ${cells.join(' | ')} | ${overallDelta} |`);
        }
        lines.push('');
        lines.push('*Positive delta → gap scoring helped. Near-zero delta → keyword matching already sufficient.*');
        lines.push('');
    }

    // ── Step Efficiency ──
    lines.push('## Average Step Efficiency');
    lines.push('*min_steps / actual_steps, capped at 1.0*');
    lines.push('');
    lines.push('| Method | L1 | L2 | L3 | Overall |');
    lines.push('|--------|----|----|-----|---------|');
    for (const cond of CONDITIONS) {
        if (!data[cond]) continue;
        const cells = levels.map(l => comparison[l]?.[cond]?.avg_step_efficiency ?? '-');
        const overall = comparison.overall?.[cond]?.avg_step_efficiency ?? '-';
        lines.push(`| ${CONDITION_LABELS[cond]} | ${cells.join(' | ')} | ${overall} |`);
    }
    lines.push('');

    // ── Per-task detail ──
    lines.push('## Per-Task Detail');
    lines.push('');

    for (const slug of allSlugs) {
        let level = '?';
        for (const condData of Object.values(data)) {
            const t = condData.tasks.find(t => t.slug === slug);
            if (t) { level = t.level; break; }
        }

        lines.push(`### ${slug} (${level})`);
        lines.push('');
        lines.push('| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |');
        lines.push('|-----------|-------|--------|---------|-----|-------|------------|');

        for (const cond of CONDITIONS) {
            if (!data[cond]) continue;
            const task = data[cond].tasks.find(t => t.slug === slug);
            if (!task) continue;
            const d = task.validation;
            lines.push(
                `| ${CONDITION_LABELS[cond]} | ${task.parse_success ? 'OK' : 'FAIL'} | ${d.strict_pass ? 'PASS' : 'FAIL'} | ${d.lenient_pass ? 'PASS' : 'FAIL'} | ${d.pvr ? 'PASS' : 'FAIL'} | ${d.step_count} | ${d.step_efficiency} |`
            );
        }
        lines.push('');

        // Issues per condition
        for (const cond of CONDITIONS) {
            if (!data[cond]) continue;
            const task = data[cond].tasks.find(t => t.slug === slug);
            if (!task || task.validation.issues.length === 0) continue;
            lines.push(`**${cond} issues:**`);
            for (const issue of task.validation.issues) lines.push(`- ${issue}`);
            lines.push('');
        }
    }

    // Write outputs
    const jsonOutput = { meta: { timestamp: new Date().toISOString(), conditions: Object.keys(data).map(c => ({ condition: c, file: files[c], model: data[c].meta.model })) }, comparison, per_task: allSlugs.map(slug => { const entry = { slug }; for (const [cond, condData] of Object.entries(data)) { const task = condData.tasks.find(t => t.slug === slug); if (task) entry[cond] = { strict_pass: task.validation.strict_pass, lenient_pass: task.validation.lenient_pass, pvr: task.validation.pvr, parse_success: task.parse_success, step_count: task.validation.step_count, step_efficiency: task.validation.step_efficiency, issues: task.validation.issues }; } return entry; }) };

    const jsonPath = join(resultsDir, `comparison_v2_${timestamp}.json`);
    writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
    console.log(`\nComparison JSON: ${jsonPath}`);

    const mdPath = join(resultsDir, `comparison_v2_${timestamp}_report.md`);
    writeFileSync(mdPath, lines.join('\n'));
    console.log(`Comparison report: ${mdPath}`);
}

main();
