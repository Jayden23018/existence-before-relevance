#!/usr/bin/env node

/**
 * Merge incremental eval results into a single comparison report.
 *
 * Usage:
 *   node scripts/eval/merge_results.js results/eval_*_no_retrieval.json results/eval_*_random_retrieval.json results/eval_*_saer_full.json
 *   node scripts/eval/merge_results.js  # auto-detect latest per-condition files
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONDITIONS = ['no_retrieval', 'random_retrieval', 'saer_full'];

function findLatestFile(resultsDir, condition) {
    const files = readdirSync(resultsDir)
        .filter(f => f.startsWith('eval_') && f.endsWith(`_${condition}.json`))
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

function main() {
    const args = process.argv.slice(2);
    const resultsDir = join(__dirname, 'results');

    // Find result files
    const files = {};
    if (args.length >= 1 && args.some(a => a.includes('eval_'))) {
        // Explicit file paths
        for (const arg of args) {
            for (const cond of CONDITIONS) {
                if (arg.includes(`_${cond}.json`)) {
                    files[cond] = arg;
                }
            }
        }
    } else {
        // Auto-detect latest per-condition files
        for (const cond of CONDITIONS) {
            const f = findLatestFile(resultsDir, cond);
            if (f) {
                files[cond] = f;
                console.log(`Found ${cond}: ${f}`);
            } else {
                console.warn(`No results found for condition: ${cond}`);
            }
        }
    }

    // Load data
    const data = {};
    for (const [cond, filePath] of Object.entries(files)) {
        data[cond] = JSON.parse(readFileSync(filePath, 'utf8'));
    }

    if (Object.keys(data).length === 0) {
        console.error('No result files found. Run static_plan_eval.js first.');
        process.exit(1);
    }

    // Build comparison
    const timestamp = formatTimestamp();

    // Collect all task slugs (union across conditions)
    const slugSet = new Set();
    for (const condData of Object.values(data)) {
        for (const task of condData.tasks) {
            slugSet.add(task.slug);
        }
    }
    const allSlugs = [...slugSet].sort();

    const levels = ['L1', 'L2', 'L3'];
    const comparison = {};

    for (const level of levels) {
        comparison[level] = {};
        for (const [cond, condData] of Object.entries(data)) {
            const levelTasks = condData.tasks.filter(t => t.level === level);
            const total = levelTasks.length;
            if (total === 0) continue;

            const strictPass = levelTasks.filter(t => t.validation.strict_pass).length;
            const lenientPass = levelTasks.filter(t => t.validation.lenient_pass).length;
            const pvrPass = levelTasks.filter(t => t.validation.pvr).length;
            const avgEff = total > 0
                ? Math.round(levelTasks.reduce((s, t) => s + t.validation.step_efficiency, 0) / total * 100) / 100
                : 0;

            comparison[level][cond] = {
                strict_tcr: `${strictPass}/${total}`,
                lenient_tcr: `${lenientPass}/${total}`,
                pvr: `${pvrPass}/${total}`,
                avg_step_efficiency: avgEff
            };
        }
    }

    // Overall
    comparison.overall = {};
    for (const [cond, condData] of Object.entries(data)) {
        const total = condData.tasks.length;
        const strictPass = condData.tasks.filter(t => t.validation.strict_pass).length;
        const lenientPass = condData.tasks.filter(t => t.validation.lenient_pass).length;
        const pvrPass = condData.tasks.filter(t => t.validation.pvr).length;
        const avgEff = total > 0
            ? Math.round(condData.tasks.reduce((s, t) => s + t.validation.step_efficiency, 0) / total * 100) / 100
            : 0;

        comparison.overall[cond] = {
            strict_tcr: `${strictPass}/${total}`,
            lenient_tcr: `${lenientPass}/${total}`,
            pvr: `${pvrPass}/${total}`,
            avg_step_efficiency: avgEff
        };
    }

    // Write JSON
    const jsonOutput = {
        meta: {
            timestamp: new Date().toISOString(),
            conditions: Object.keys(data).map(cond => ({
                condition: cond,
                file: files[cond],
                model: data[cond].meta.model,
                run_timestamp: data[cond].meta.timestamp
            }))
        },
        comparison,
        per_task: allSlugs.map(slug => {
            const entry = { slug };
            for (const [cond, condData] of Object.entries(data)) {
                const task = condData.tasks.find(t => t.slug === slug);
                if (task) {
                    entry[cond] = {
                        strict_pass: task.validation.strict_pass,
                        lenient_pass: task.validation.lenient_pass,
                        pvr: task.validation.pvr,
                        step_count: task.validation.step_count,
                        step_efficiency: task.validation.step_efficiency,
                        issues: task.validation.issues,
                        lenient_issues: task.validation.lenient_issues
                    };
                }
            }
            return entry;
        })
    };

    const jsonPath = join(resultsDir, `comparison_${timestamp}.json`);
    writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
    console.log(`\nComparison JSON: ${jsonPath}`);

    // Write Markdown report (paper-ready)
    const lines = [];

    lines.push('# SAER Ablation Study — Plan Quality Comparison');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Main comparison table
    lines.push('## Task Completion Rate (TCR)');
    lines.push('');
    lines.push('| Method | L1 | L2 | L3 | Overall |');
    lines.push('|--------|----|----|-----|---------|');

    const condLabels = {
        no_retrieval: 'No Retrieval',
        random_retrieval: 'Random',
        saer_full: '**SAER (ours)**'
    };

    for (const cond of CONDITIONS) {
        if (!data[cond]) continue;
        const label = condLabels[cond];
        const cells = levels.map(level => {
            if (comparison[level]?.[cond]) {
                return comparison[level][cond].lenient_tcr;
            }
            return '-';
        });
        const overall = comparison.overall[cond]?.lenient_tcr || '-';
        lines.push(`| ${label} | ${cells.join(' | ')} | ${overall} |`);
    }
    lines.push('');

    // Strict TCR table
    lines.push('## Strict TCR (any issue = fail)');
    lines.push('');
    lines.push('| Method | L1 | L2 | L3 | Overall |');
    lines.push('|--------|----|----|-----|---------|');

    for (const cond of CONDITIONS) {
        if (!data[cond]) continue;
        const label = condLabels[cond];
        const cells = levels.map(level => {
            if (comparison[level]?.[cond]) {
                return comparison[level][cond].strict_tcr;
            }
            return '-';
        });
        const overall = comparison.overall[cond]?.strict_tcr || '-';
        lines.push(`| ${label} | ${cells.join(' | ')} | ${overall} |`);
    }
    lines.push('');

    // PVR table
    lines.push('## Plan Validity Rate (PVR)');
    lines.push('');
    lines.push('| Method | L1 | L2 | L3 | Overall |');
    lines.push('|--------|----|----|-----|---------|');

    for (const cond of CONDITIONS) {
        if (!data[cond]) continue;
        const label = condLabels[cond];
        const cells = levels.map(level => {
            if (comparison[level]?.[cond]) {
                return comparison[level][cond].pvr;
            }
            return '-';
        });
        const overall = comparison.overall[cond]?.pvr || '-';
        lines.push(`| ${label} | ${cells.join(' | ')} | ${overall} |`);
    }
    lines.push('');

    // Step efficiency
    lines.push('## Average Step Efficiency');
    lines.push('');
    lines.push('| Method | L1 | L2 | L3 | Overall |');
    lines.push('|--------|----|----|-----|---------|');

    for (const cond of CONDITIONS) {
        if (!data[cond]) continue;
        const label = condLabels[cond];
        const cells = levels.map(level => {
            if (comparison[level]?.[cond]) {
                return String(comparison[level][cond].avg_step_efficiency);
            }
            return '-';
        });
        const overall = comparison.overall[cond]?.avg_step_efficiency || '-';
        lines.push(`| ${label} | ${cells.join(' | ')} | ${overall} |`);
    }
    lines.push('');

    // Per-task detail
    lines.push('## Per-Task Detail');
    lines.push('');

    for (const slug of allSlugs) {
        const entry = jsonOutput.per_task.find(t => t.slug === slug);
        if (!entry) continue;

        // Get level from any condition
        let level = '?';
        for (const cond of CONDITIONS) {
            if (entry[cond]) {
                // Find level from data
                const condData = data[cond];
                const task = condData.tasks.find(t => t.slug === slug);
                if (task) level = task.level;
                break;
            }
        }

        lines.push(`### ${slug} (${level})`);

        // Comparison table for this task
        lines.push('');
        lines.push('| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |');
        lines.push('|-----------|--------|---------|-----|-------|------------|--------|');

        for (const cond of CONDITIONS) {
            if (!entry[cond]) continue;
            const d = entry[cond];
            const issueCount = d.lenient_issues?.length || 0;
            lines.push(
                `| ${condLabels[cond]} | ${d.strict_pass ? 'PASS' : 'FAIL'} | ${d.lenient_pass ? 'PASS' : 'FAIL'} | ${d.pvr ? 'PASS' : 'FAIL'} | ${d.step_count} | ${d.step_efficiency} | ${issueCount} |`
            );
        }
        lines.push('');

        // Show issues for failed conditions
        for (const cond of CONDITIONS) {
            if (!entry[cond]) continue;
            const d = entry[cond];
            if (d.issues && d.issues.length > 0) {
                lines.push(`**${cond} strict issues:**`);
                for (const issue of d.issues) {
                    lines.push(`- ${issue}`);
                }
                lines.push('');
            }
        }
    }

    const mdPath = join(resultsDir, `comparison_${timestamp}_report.md`);
    writeFileSync(mdPath, lines.join('\n'));
    console.log(`Comparison report: ${mdPath}`);
}

main();
