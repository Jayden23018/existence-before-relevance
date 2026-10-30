#!/usr/bin/env node

/**
 * Extract raw LLM plan outputs from combined eval JSON into a readable format.
 *
 * Usage:
 *   node scripts/eval/extract_raw_plans.js docs/Experiment/static_eval_combined.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';

const inputFile = process.argv[2];
if (!inputFile) {
    console.error('Usage: node extract_raw_plans.js <combined.json>');
    process.exit(1);
}

const data = JSON.parse(readFileSync(inputFile, 'utf8'));
const outputDir = dirname(inputFile);

const lines = [];
lines.push(`# Qwen3-8B Raw Plan Outputs`);
lines.push(`Model: ${data.model || 'qwen3-vl-8b-instruct'}`);
lines.push(`Date: ${data.timestamp || new Date().toISOString()}`);
lines.push(`Tasks: ${data.tasks.length}`);
lines.push('');

for (const task of data.tasks) {
    lines.push(`${'='.repeat(80)}`);
    lines.push(`## ${task.slug} [${task.level}] — "${task.goal}"`);
    lines.push(`${'='.repeat(80)}`);
    lines.push('');

    for (const mode of ['without_saer', 'with_saer']) {
        const m = task[mode];
        if (!m) continue;

        lines.push(`### ${mode}`);
        lines.push('');

        if (m.parse_fail) {
            lines.push(`**Status**: PARSE FAILED (${m.error_type || 'unknown'})`);
            lines.push('');
        } else {
            lines.push(`**Status**: Parsed OK — ${m.steps_count} steps`);
            lines.push(`**PVR**: ${m.pvr ? 'VALID' : 'INVALID'} | **TCC**: ${m.tcc?.score?.toFixed(2) || 'N/A'} | **PES**: ${m.pes?.toFixed(2) || 'N/A'}`);
            lines.push('');
        }

        // Raw LLM output
        lines.push('--- Raw LLM Output ---');
        lines.push('');
        lines.push(m.raw_response || '(no response)');
        lines.push('');

        // Parsed steps summary
        if (m.raw_plan && m.raw_plan.length > 0) {
            lines.push('--- Parsed Steps ---');
            lines.push('');
            for (const step of m.raw_plan) {
                const precondStr = step.preconditions
                    ? (Array.isArray(step.preconditions) ? step.preconditions.join(', ') : JSON.stringify(step.preconditions))
                    : 'None';
                const producesStr = step.produces
                    ? (Array.isArray(step.produces) ? step.produces.map(p => `${p.name}×${p.count}`).join(', ') : JSON.stringify(step.produces))
                    : '(inferred)';
                const cmdStr = step.action_cmd ? step.action_cmd.join('; ') : (step.command || 'N/A');

                lines.push(`Step ${step.step || '?'}: ${step.goal || 'N/A'}`);
                lines.push(`  Prerequisites: ${precondStr}`);
                lines.push(`  Produces: ${producesStr}`);
                lines.push(`  Command: ${cmdStr}`);
                lines.push('');
            }
        }

        // Gaps
        if (m.gaps && m.gaps.length > 0) {
            lines.push('--- PVR Gaps (missing preconditions) ---');
            lines.push('');
            for (const g of m.gaps) {
                lines.push(`  Step ${g.step} "${g.goal}": missing ${g.missing}`);
            }
            lines.push('');
        }

        lines.push('');
    }
}

// Write output next to the input file
const outputPath = join(outputDir, 'qwen3-8b_plan.md');
writeFileSync(outputPath, lines.join('\n'));

console.log(`Written: ${outputPath}`);
console.log(`Size: ${(lines.join('\n').length / 1024).toFixed(1)} KB`);
