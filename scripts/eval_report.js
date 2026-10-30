#!/usr/bin/env node

/**
 * TCR Report Generator
 *
 * Reads eval_results/eval_log.jsonl and generates a summary report.
 *
 * Usage:
 *   node scripts/eval_report.js
 *   node scripts/eval_report.js --input path/to/eval_log.jsonl
 *
 * Output: eval_results/report.md + stdout
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const DEFAULT_INPUT = join(PROJECT_ROOT, 'eval_results', 'eval_log.jsonl');
const DEFAULT_OUTPUT = join(PROJECT_ROOT, 'eval_results', 'report.md');

// ─── CLI ───────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let inputPath = DEFAULT_INPUT;
let outputPath = DEFAULT_OUTPUT;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
        inputPath = args[i + 1];
        i++;
    }
    if (args[i] === '--output' && args[i + 1]) {
        outputPath = args[i + 1];
        i++;
    }
}

// ─── Read & Parse ──────────────────────────────────────────────────

if (!existsSync(inputPath)) {
    console.error(`No eval log found at: ${inputPath}`);
    console.error('Run scripts/run_eval.js first to generate eval data.');
    process.exit(1);
}

const lines = readFileSync(inputPath, 'utf8').trim().split('\n');
const records = lines
    .filter(line => line.trim())
    .map(line => {
        try { return JSON.parse(line); }
        catch { return null; }
    })
    .filter(Boolean);

if (records.length === 0) {
    console.error('No valid records found in eval log.');
    process.exit(1);
}

// ─── Group by taskSlug + mode ──────────────────────────────────────

const grouped = {};
for (const rec of records) {
    const key = `${rec.taskSlug}::${rec.mode}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(rec);
}

// Unique tasks and modes
const taskSlugs = [...new Set(records.map(r => r.taskSlug))];
const modes = [...new Set(records.map(r => r.mode))];

// Build per-task results
const taskResults = {};
for (const slug of taskSlugs) {
    taskResults[slug] = {};
    for (const mode of modes) {
        const key = `${slug}::${mode}`;
        const runs = grouped[key] || [];
        const passed = runs.filter(r => r.success).length;
        taskResults[slug][mode] = { passed, total: runs.length };
    }

    // Get level from first record
    const first = records.find(r => r.taskSlug === slug);
    taskResults[slug].level = first?.level || '?';
}

// ─── Format Report ─────────────────────────────────────────────────

function passIcon(passed, total) {
    if (total === 0) return '—';
    return passed === total ? 'PASS' : passed > 0 ? 'PARTIAL' : 'FAIL';
}

function deltaIndicator(withoutSAER, withSAER) {
    if (!withoutSAER || !withSAER) return '—';
    if (withoutSAER.passed === withSAER.passed) return '=';
    return withSAER.passed > withoutSAER.passed ? `+${withSAER.passed - withoutSAER.passed}` : `${withSAER.passed - withoutSAER.passed}`;
}

let report = '# SAER Evaluation Report\n\n';
report += `Generated: ${new Date().toISOString()}\n`;
report += `Records: ${records.length}\n\n`;

// Table header
const modeHeaders = modes.map(m => m.padEnd(12)).join(' | ');
report += `| ${'Task'.padEnd(25)} | ${'Level'.padEnd(5)} | ${modeHeaders} | ${'Delta'.padEnd(5)} |\n`;
report += `| ${'-'.repeat(25)} | ${'-'.repeat(5)} | ${modes.map(() => '-'.repeat(12)).join(' | ')} | ${'-'.repeat(5)} |\n`;

// Table rows
for (const slug of taskSlugs) {
    const info = taskResults[slug];
    const level = info.level;

    const cells = modes.map(mode => {
        const r = info[mode];
        if (!r) return '—'.padEnd(12);
        const icon = passIcon(r.passed, r.total);
        return `${icon} ${r.passed}/${r.total}`.padEnd(12);
    }).join(' | ');

    const withoutMode = modes.find(m => m.includes('without'));
    const withMode = modes.find(m => m.includes('with'));
    const delta = deltaIndicator(info[withoutMode], info[withMode]);

    report += `| ${slug.padEnd(25)} | ${level.padEnd(5)} | ${cells} | ${String(delta).padEnd(5)} |\n`;
}

report += '\n';

// Summary
report += '## Summary\n\n';
for (const mode of modes) {
    const modeRecords = records.filter(r => r.mode === mode);
    const passed = modeRecords.filter(r => r.success).length;
    const pct = modeRecords.length > 0 ? Math.round(passed / modeRecords.length * 100) : 0;
    const label = mode.padEnd(15);
    report += `${label}: ${passed}/${modeRecords.length} passed (${pct}%)\n`;
}

// Per-level breakdown
report += '\n### Per-Level\n\n';
const levels = [...new Set(records.map(r => r.level))].sort();
for (const level of levels) {
    const parts = modes.map(mode => {
        const modeRecords = records.filter(r => r.mode === mode && r.level === level);
        const passed = modeRecords.filter(r => r.success).length;
        return `w${mode.includes('without') ? '/o' : '/'}=${passed}/${modeRecords.length}`;
    });
    report += `${level}: ${parts.join(', ')}\n`;
}

// ─── Output ────────────────────────────────────────────────────────

// Ensure output directory exists
const outputDir = dirname(outputPath);
if (outputDir && outputDir !== '.' && !existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
}

writeFileSync(outputPath, report, 'utf8');

// Print to stdout
console.log(report);
console.log(`Report written to: ${outputPath}`);
