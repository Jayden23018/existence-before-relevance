#!/usr/bin/env node

/**
 * Merge per-level static eval results into a single combined report.
 *
 * Usage:
 *   node scripts/eval/merge_static_eval.js docs/Experiment/static_eval_*_report.json
 *   node scripts/eval/merge_static_eval.js docs/Experiment/   # auto-find all JSON files
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: node merge_static_eval.js <json_files_or_dir>');
    process.exit(1);
}

// Collect JSON files
let jsonFiles = [];
for (const arg of args) {
    if (arg.endsWith('.json')) {
        jsonFiles.push(arg);
    }
}

if (jsonFiles.length === 0) {
    console.error('No JSON files found');
    process.exit(1);
}

// Load and merge
const allTasks = [];
let model = 'unknown';
let timestamp = '';

for (const file of jsonFiles) {
    try {
        const data = JSON.parse(readFileSync(file, 'utf8'));
        if (data.tasks) {
            allTasks.push(...data.tasks);
        }
        if (data.model) model = data.model;
        if (data.timestamp && !timestamp) timestamp = data.timestamp;
    } catch (err) {
        console.error(`Failed to load ${file}: ${err.message}`);
    }
}

// Sort by level then slug
const levelOrder = { L1: 0, L2: 1, L3: 2 };
allTasks.sort((a, b) => (levelOrder[a.level] || 9) - (levelOrder[b.level] || 9) || a.slug.localeCompare(b.slug));

const n = allTasks.length;

// Build combined report
const lines = [];

lines.push('# SAER Static Evaluation Report (Combined)');
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push(`Model: ${model}`);
lines.push(`Tasks: ${n} (merged from ${jsonFiles.length} files)`);
lines.push('');

// Results table
lines.push('## Results Table');
lines.push('');
lines.push('| Task | Level | PVR w/o | PVR w/ | \u0394PVR | TCC w/o | TCC w/ | \u0394TCC | PES w/o | PES w/ |');
lines.push('|------|-------|---------|--------|------|---------|--------|------|---------|--------|');

let pvrWO = 0, pvrW = 0;
let tccWOSum = 0, tccWSum = 0;
let pesWOSum = 0, pesWSum = 0;

for (const r of allTasks) {
    const wo = r.without_saer;
    const w = r.with_saer;

    const pvrWOIcon = wo?.pvr ? '\u2705' : '\u274c';
    const pvrWIcon = w?.pvr ? '\u2705' : '\u274c';
    const deltaPVR = (w?.pvr ? 1 : 0) - (wo?.pvr ? 1 : 0);
    const deltaPVRStr = deltaPVR > 0 ? '+1' : deltaPVR < 0 ? '-1' : '=';

    const tccWOStr = wo?.tcc != null ? wo.tcc.score.toFixed(2) : 'N/A';
    const tccWStr = w?.tcc != null ? w.tcc.score.toFixed(2) : 'N/A';
    const deltaTCC = (w?.tcc?.score || 0) - (wo?.tcc?.score || 0);
    const deltaTCCStr = deltaTCC > 0 ? `+${deltaTCC.toFixed(2)}` : deltaTCC < 0 ? deltaTCC.toFixed(2) : '=';

    const pesWOStr = wo?.pes != null ? wo.pes.toFixed(2) : 'N/A';
    const pesWStr = w?.pes != null ? w.pes.toFixed(2) : 'N/A';

    lines.push(`| ${r.slug} | ${r.level} | ${pvrWOIcon} | ${pvrWIcon} | ${deltaPVRStr} | ${tccWOStr} | ${tccWStr} | ${deltaTCCStr} | ${pesWOStr} | ${pesWStr} |`);

    pvrWO += wo?.pvr ? 1 : 0;
    pvrW += w?.pvr ? 1 : 0;
    tccWOSum += wo?.tcc?.score || 0;
    tccWSum += w?.tcc?.score || 0;
    pesWOSum += wo?.pes || 0;
    pesWSum += w?.pes || 0;
}

lines.push(`| **Average** | - | **${(pvrWO / n * 100).toFixed(0)}%** | **${(pvrW / n * 100).toFixed(0)}%** | **${pvrW - pvrWO > 0 ? '+' : ''}${pvrW - pvrWO}** | **${(tccWOSum / n).toFixed(2)}** | **${(tccWSum / n).toFixed(2)}** | **${((tccWSum - tccWOSum) / n).toFixed(2)}** | **${(pesWOSum / n).toFixed(2)}** | **${(pesWSum / n).toFixed(2)}** |`);
lines.push('');

// Summary
lines.push('## Summary');
lines.push('');
lines.push(`**Plan Validity Rate (PVR)**`);
lines.push(`- Without SAER: ${pvrWO}/${n} valid (${(pvrWO / n * 100).toFixed(0)}%)`);
lines.push(`- With SAER:    ${pvrW}/${n} valid (${(pvrW / n * 100).toFixed(0)}%)`);
lines.push(`- Delta:        ${pvrW - pvrWO > 0 ? '+' : ''}${pvrW - pvrWO} tasks`);
lines.push('');
lines.push(`**Tool Chain Completeness (TCC)**`);
lines.push(`- Without SAER avg: ${(tccWOSum / n).toFixed(2)}`);
lines.push(`- With SAER avg:    ${(tccWSum / n).toFixed(2)}`);
lines.push(`- Delta:            ${((tccWSum - tccWOSum) / n) >= 0 ? '+' : ''}${((tccWSum - tccWOSum) / n).toFixed(2)}`);
lines.push('');
lines.push(`**Plan Efficiency Score (PES)**`);
lines.push(`- Without SAER avg: ${(pesWOSum / n).toFixed(2)}`);
lines.push(`- With SAER avg:    ${(pesWSum / n).toFixed(2)}`);
lines.push(`- Delta:            ${((pesWSum - pesWOSum) / n) >= 0 ? '+' : ''}${((pesWSum - pesWOSum) / n).toFixed(2)}`);
lines.push('');

// By Difficulty
lines.push('## By Difficulty');
lines.push('');
lines.push('| Level | PVR w/o | PVR w/ | \u0394PVR | TCC w/o | TCC w/ | \u0394TCC | PES w/o | PES w/ |');
lines.push('|-------|---------|--------|------|---------|--------|------|---------|--------|');

for (const level of ['L1', 'L2', 'L3']) {
    const lr = allTasks.filter(r => r.level === level);
    if (lr.length === 0) continue;

    const lpvrWO = lr.filter(r => r.without_saer?.pvr).length;
    const lpvrW = lr.filter(r => r.with_saer?.pvr).length;
    const ltccWO = lr.reduce((s, r) => s + (r.without_saer?.tcc?.score || 0), 0) / lr.length;
    const ltccW = lr.reduce((s, r) => s + (r.with_saer?.tcc?.score || 0), 0) / lr.length;
    const lpesWO = lr.reduce((s, r) => s + (r.without_saer?.pes || 0), 0) / lr.length;
    const lpesW = lr.reduce((s, r) => s + (r.with_saer?.pes || 0), 0) / lr.length;
    const dpvr = lpvrW - lpvrWO;
    const dtcc = ltccW - ltccWO;

    lines.push(`| ${level} | ${lpvrWO}/${lr.length} | ${lpvrW}/${lr.length} | ${dpvr > 0 ? '+' : ''}${dpvr} | ${ltccWO.toFixed(2)} | ${ltccW.toFixed(2)} | ${dtcc >= 0 ? '+' : ''}${dtcc.toFixed(2)} | ${lpesWO.toFixed(2)} | ${lpesW.toFixed(2)} |`);
}
lines.push('');

// Parse Failures
const woParseFail = allTasks.filter(r => r.without_saer?.parse_fail).length;
const wParseFail = allTasks.filter(r => r.with_saer?.parse_fail).length;
if (woParseFail > 0 || wParseFail > 0) {
    lines.push('## Parse Failures');
    lines.push('');
    lines.push(`- without_saer: ${woParseFail}/${n} failed to parse`);
    lines.push(`- with_saer:    ${wParseFail}/${n} failed to parse`);
    lines.push('');
}

// Detailed Gaps
const woFailures = allTasks.filter(r => r.without_saer?.gaps?.length > 0);
const wFailures = allTasks.filter(r => r.with_saer?.gaps?.length > 0);

if (woFailures.length > 0 || wFailures.length > 0) {
    lines.push('## Detailed Gaps (PVR failures)');
    lines.push('');

    if (woFailures.length > 0) {
        lines.push('### without_saer failures:');
        for (const r of woFailures) {
            for (const g of r.without_saer.gaps) {
                lines.push(`- ${r.slug} step ${g.step}: missing ${g.missing}`);
            }
        }
        lines.push('');
    }

    if (wFailures.length > 0) {
        lines.push('### with_saer failures:');
        for (const r of wFailures) {
            for (const g of r.with_saer.gaps) {
                lines.push(`- ${r.slug} step ${g.step}: missing ${g.missing}`);
            }
        }
        lines.push('');
    }
}

// Write combined report
const report = lines.join('\n');
const outputPath = join('docs', 'Experiment', 'static_eval_combined_report.md');
writeFileSync(outputPath, report);

// Also write combined JSON
const combinedJSON = { timestamp: new Date().toISOString(), model, tasks: allTasks, sourceFiles: jsonFiles.map(f => basename(f)) };
const jsonPath = join('docs', 'Experiment', 'static_eval_combined.json');
writeFileSync(jsonPath, JSON.stringify(combinedJSON, null, 2));

console.log(report);
console.log(`\nCombined report: ${outputPath}`);
console.log(`Combined JSON:   ${jsonPath}`);
