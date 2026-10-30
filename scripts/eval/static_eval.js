#!/usr/bin/env node

/**
 * SAER Static Evaluation Pipeline
 *
 * Compares plan quality with vs without SAER few-shot retrieval.
 * Generates plans via LLM, evaluates with PVR/TCC/PES metrics,
 * outputs a comparison report.
 *
 * Usage:
 *   node scripts/eval/static_eval.js                          # all tasks
 *   node scripts/eval/static_eval.js --level L2               # filter by level
 *   node scripts/eval/static_eval.js --slug craft/iron_pickaxe # single task
 *   node scripts/eval/static_eval.js --dry-run                # print prompts only
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Qwen } from '../../src/models/qwen.js';
import { Local } from '../../src/models/local.js';
import { FewShotLearning } from '../../src/models/enhancers/fewshot_learning.js';
import { SMELTING_OUTPUTS, TOOL_TIERS, ORE_TOOL_REQUIREMENTS } from '../../src/models/enhancers/plan_validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

const SYSTEM_PROMPT = 'You are a Minecraft crafting expert. Always follow the output format exactly.';
const INTER_TASK_DELAY_MS = 1500;
const MODES = ['without_saer', 'with_saer'];

// ─── CLI ───────────────────────────────────────────────────────────

const argv = yargs(hideBin(process.argv))
    .option('level', {
        type: 'string',
        describe: 'Filter by difficulty level (L1/L2/L3)'
    })
    .option('slug', {
        type: 'string',
        describe: 'Run single task by slug'
    })
    .option('dry-run', {
        type: 'boolean',
        default: false,
        describe: 'Print prompts without calling LLM'
    })
    .option('debug', {
        type: 'boolean',
        default: false,
        describe: 'Enable debug logging'
    })
    .option('profile', {
        type: 'string',
        default: 'max',
        describe: 'Profile name for model config'
    })
    .option('retries', {
        type: 'number',
        default: 3,
        describe: 'Max retries per task for API/parse failures'
    })
    .option('output', {
        type: 'string',
        describe: 'Output directory (default: scripts/eval/results/)'
    })
    .help()
    .parseSync();

// ─── Model Creation ────────────────────────────────────────────────

function loadProfile(profileName) {
    const candidates = [
        join(PROJECT_ROOT, `${profileName}.json`),
        join(PROJECT_ROOT, 'profiles', `${profileName}.json`)
    ];
    for (const p of candidates) {
        if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
    }
    throw new Error(`Profile not found: tried ${candidates.join(', ')}`);
}

function getModelConfig(profile) {
    if (profile.enhancer?.enhancer?.model) return profile.enhancer.enhancer.model;
    if (profile.enhancer?.model) return profile.enhancer.model;
    return profile.model;
}

async function createModel(modelConfig) {
    if (modelConfig.api === 'ollama') {
        return new Local(modelConfig.model, modelConfig.url);
    }
    if (modelConfig.api === 'doubao') {
        const { Doubao } = await import('../../src/models/doubao.js');
        return new Doubao(modelConfig.model, modelConfig.url);
    }
    if (modelConfig.api === 'qwen') {
        return new Qwen(modelConfig.model, null, modelConfig.params || null);
    }
    return new Qwen(modelConfig.model, modelConfig.url, modelConfig.params || null);
}

// ─── Training Data ─────────────────────────────────────────────────

function loadTrainingData(category) {
    const fileMap = {
        CRAFT: 'crafting_examples.json',
        COLLECT: 'collecting_examples.json',
        COOK: 'cooking_examples.json',
        BUILD: 'build_examples.json',
        COMBAT: 'combat_examples.json',
        EXPLORE: 'collecting_examples.json',
        DEFAULT: 'crafting_examples.json'
    };
    const fileName = fileMap[category] || fileMap.DEFAULT;
    const filePath = join(PROJECT_ROOT, 'data', 'training', fileName);
    if (!existsSync(filePath)) {
        const fallback = join(PROJECT_ROOT, 'data', 'training', 'crafting_examples.json');
        return JSON.parse(readFileSync(fallback, 'utf8'));
    }
    return JSON.parse(readFileSync(filePath, 'utf8'));
}

function inferCategory(slug) {
    return slug.startsWith('collect/') ? 'COLLECT' : 'CRAFT';
}

// ─── Item Name Utilities ───────────────────────────────────────────

const WOOD_PREFIXES = [
    'oak_', 'birch_', 'spruce_', 'jungle_',
    'acacia_', 'dark_oak_', 'mangrove_', 'cherry_', 'bamboo_'
];

function normalizeItemName(name) {
    if (!name) return '';
    let n = name.toLowerCase();
    for (const prefix of WOOD_PREFIXES) {
        if (n.startsWith(prefix)) {
            n = n.slice(prefix.length);
            break;
        }
    }
    n = n.replace(/^deepslate_/, '');
    return n;
}

function itemsMatch(required, available) {
    if (!required || !available) return false;
    if (required === available) return true;
    return normalizeItemName(required) === normalizeItemName(available);
}

function toolSatisfies(required, available) {
    if (itemsMatch(required, available)) return true;
    const availTier = TOOL_TIERS[available];
    const reqTier = TOOL_TIERS[required];
    if (availTier !== undefined && reqTier !== undefined && availTier >= reqTier) return true;
    return false;
}

// ─── Produces Inference ────────────────────────────────────────────

function inferProducesFromCommand(cmd) {
    if (!cmd) return [];
    const results = [];

    const smeltMatch = cmd.match(/smeltItem\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
    if (smeltMatch) {
        const input = smeltMatch[1];
        const count = parseInt(smeltMatch[2]);
        const output = SMELTING_OUTPUTS[input] || input;
        results.push({ type: 'item', name: output, count });
        return results;
    }

    const craftMatch = cmd.match(/craftRecipe\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
    if (craftMatch) {
        results.push({ type: 'item', name: craftMatch[1], count: parseInt(craftMatch[2]) });
        return results;
    }

    const collectMatch = cmd.match(/collectBlocks\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
    if (collectMatch) {
        const block = collectMatch[1];
        const count = parseInt(collectMatch[2]);
        const rawOreMap = {
            'iron_ore': 'raw_iron',
            'deepslate_iron_ore': 'raw_iron',
            'gold_ore': 'raw_gold',
            'deepslate_gold_ore': 'raw_gold',
            'copper_ore': 'raw_copper',
            'deepslate_copper_ore': 'raw_copper'
        };
        const product = rawOreMap[block] || block;
        results.push({ type: 'item', name: product, count });
        return results;
    }

    return results;
}

function getStepProduces(step) {
    let outputs = [];
    if (step.produces) {
        outputs = Array.isArray(step.produces) ? step.produces : [step.produces];
    }
    if (outputs.length === 0) {
        const cmds = step.action_cmd || (step.command ? [step.command] : []);
        for (const cmd of cmds) {
            outputs.push(...inferProducesFromCommand(cmd));
        }
    }
    return outputs.filter(o => o && o.type === 'item' && o.name);
}

function getStepCommands(step) {
    if (step.action_cmd && step.action_cmd.length > 0) return step.action_cmd;
    if (step.command) return [step.command];
    return [];
}

// ─── Metric 1: calcPVR ─────────────────────────────────────────────

function calcPVR(plan, initialInventory = []) {
    if (!plan || !plan.steps || plan.steps.length === 0) {
        return { valid: false, gaps: [{ step: 0, goal: 'N/A', missing: 'Plan is empty' }] };
    }

    const available = new Map();
    for (const item of initialInventory) {
        available.set(item.name, (available.get(item.name) || 0) + item.count);
    }

    const gaps = [];

    for (const step of plan.steps) {
        // Check preconditions
        const preconds = step.preconditions || [];
        for (const cond of preconds) {
            const parsed = parsePrecondition(cond);
            if (!parsed) continue;
            if (parsed.type === 'access' || parsed.type === 'station') continue;

            if (parsed.type === 'item') {
                const required = parsed.name;
                const count = parsed.count || 1;
                let satisfied = false;

                for (const [availName, availCount] of available) {
                    if (toolSatisfies(required, availName) || itemsMatch(required, availName)) {
                        if (availCount >= count) {
                            satisfied = true;
                            break;
                        }
                    }
                }

                if (!satisfied) {
                    gaps.push({
                        step: step.step || '?',
                        goal: step.goal || '',
                        missing: `${required}${count > 1 ? ' x' + count : ''}`
                    });
                }
            }
        }

        // Add produces to available
        for (const output of getStepProduces(step)) {
            available.set(output.name, (available.get(output.name) || 0) + (output.count || 1));
        }
    }

    return { valid: gaps.length === 0, gaps };
}

function parsePrecondition(cond) {
    if (!cond) return null;
    if (typeof cond === 'object' && cond.type) return cond;

    const str = String(cond).trim();
    const match = str.match(/^(item|station|access):([^:]+)(?::(\d+))?$/);
    if (match) {
        return { type: match[1], name: match[2], count: match[3] ? parseInt(match[3]) : 1 };
    }

    return { type: 'item', name: str, count: 1 };
}

// ─── Metric 2: calcTCC ─────────────────────────────────────────────

function calcTCC(plan, initialInventory = []) {
    if (!plan || !plan.steps || plan.steps.length === 0) {
        return { score: 0, total: 0, satisfied: 0, failures: [] };
    }

    const available = new Map();
    for (const item of initialInventory) {
        available.set(item.name, (available.get(item.name) || 0) + item.count);
    }

    let total = 0;
    let satisfied = 0;
    const failures = [];

    for (const step of plan.steps) {
        const cmds = getStepCommands(step);

        for (const cmd of cmds) {
            const collectMatch = cmd.match(/collectBlocks\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
            if (!collectMatch) continue;

            const block = collectMatch[1];
            const requiredTool = ORE_TOOL_REQUIREMENTS[block];
            if (!requiredTool) continue; // no tool needed

            total++;

            let hasTool = false;
            for (const [availName] of available) {
                if (toolSatisfies(requiredTool, availName)) {
                    hasTool = true;
                    break;
                }
            }

            if (hasTool) {
                satisfied++;
            } else {
                failures.push({
                    step: step.step || '?',
                    block,
                    requiredTool,
                    availableTools: [...available.keys()].filter(k => TOOL_TIERS[k] !== undefined)
                });
            }
        }

        // Add produces to available for subsequent steps
        for (const output of getStepProduces(step)) {
            available.set(output.name, (available.get(output.name) || 0) + (output.count || 1));
        }
    }

    return {
        score: total > 0 ? satisfied / total : 1.0,
        total,
        satisfied,
        failures
    };
}

// ─── Metric 3: calcPES ─────────────────────────────────────────────

function calcPES(plan, minSteps) {
    if (!plan || !plan.steps || plan.steps.length === 0) return 0;
    const actual = plan.steps.length;
    if (minSteps <= 0) return 0;
    return Math.min(1.0, minSteps / actual);
}

// ─── Prompt Building ───────────────────────────────────────────────

function buildMinimalPrompt(taskGoal) {
    return `You are a Minecraft agent. Generate an execution plan for: "${taskGoal}"

Available commands:
- !collectBlocks("block_type", count) — gather blocks from the world
- !craftRecipe("item_name", count) — craft an item at a crafting table
- !smeltItem("item_name", count) — smelt an item in a furnace
- !equip("item_name") — equip an item
- !attack("entity_type", kill) — attack an entity (kill: true/false)
- !searchForBlock("block_type", range) — find nearby blocks
- !placeHere("block_name") — place a block at current position

Output format — repeat for each step:
Step N: [Goal description]
Prerequisites: [item:name:count pairs, or "None"]
Produces: [item:name:count, or omit if unclear]
Command: !command("arg", count)

Rules:
- All item names use underscores (e.g. oak_log, iron_ingot, stone_pickaxe)
- Steps must be in dependency order (craft tools before mining harder ores)
- Minecraft 1.17+ drops raw_iron/raw_gold when mining ore (not ore blocks)
- Mining stone/cobblestone needs wooden_pickaxe or better
- Mining iron_ore needs stone_pickaxe or better
- Mining gold_ore/diamond_ore needs iron_pickaxe or better
- Smelting raw_iron produces iron_ingot, raw_gold produces gold_ingot
- Crafting recipes need ingredients and sometimes a crafting table`;
}

async function generatePlan(model, fsl, task, mode, trainingExamples, maxRetries = 3) {
    const category = inferCategory(task.slug);
    let prompt;

    if (mode === 'with_saer') {
        const userRequest = { input: task.goal, intent: category };
        const agentState = { inventory: [], nearbyBlocks: [] };
        prompt = fsl.buildFewShotPrompt(userRequest, trainingExamples, agentState);
    } else {
        prompt = buildMinimalPrompt(task.goal);
    }

    if (argv.dryRun) {
        console.log(`\n${'─'.repeat(60)}`);
        console.log(`[${mode}] Prompt for "${task.goal}":`);
        console.log(`${'─'.repeat(60)}`);
        console.log(prompt);
        console.log(`${'─'.repeat(60)}\n`);
        return { plan: null, rawResponse: null, errorType: 'dry_run', prompt };
    }

    let lastRaw = null;
    let lastErrorType = 'unknown';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const aiResponse = await model.sendRequest(
                [{ role: 'user', content: prompt }],
                SYSTEM_PROMPT
            );

            if (!aiResponse || aiResponse.includes('My brain disconnected')) {
                lastRaw = aiResponse || '(empty response)';
                lastErrorType = 'api_error';
                console.log(`  Attempt ${attempt}/${maxRetries}: API error, retrying...`);
                if (attempt < maxRetries) await sleep(3000);
                continue;
            }

            const plan = fsl.parseExecutionPlan(aiResponse, task.goal);

            if (!plan || !plan.steps || plan.steps.length === 0) {
                lastRaw = aiResponse;
                lastErrorType = 'parse_error';
                console.log(`  Attempt ${attempt}/${maxRetries}: Parse failed, retrying...`);
                if (attempt < maxRetries) await sleep(2000);
                continue;
            }

            return { plan, rawResponse: aiResponse, errorType: null, prompt };

        } catch (err) {
            lastRaw = err.message;
            lastErrorType = 'api_error';
            console.log(`  Attempt ${attempt}/${maxRetries}: ${err.message}, retrying...`);
            if (attempt < maxRetries) await sleep(3000);
        }
    }

    return { plan: null, rawResponse: lastRaw, errorType: lastErrorType, prompt };
}

// ─── Report Generation ─────────────────────────────────────────────

function generateReport(results) {
    const lines = [];

    lines.push('# SAER Static Evaluation Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Results table
    lines.push('## Results Table');
    lines.push('');
    lines.push('| Task | Level | PVR w/o | PVR w/ | \u0394PVR | TCC w/o | TCC w/ | \u0394TCC | PES w/o | PES w/ |');
    lines.push('|------|-------|---------|--------|------|---------|--------|------|---------|--------|');

    let pvrWO = 0, pvrW = 0;
    let tccWOSum = 0, tccWSum = 0;
    let pesWOSum = 0, pesWSum = 0;

    for (const r of results) {
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

    const n = results.length;
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

    // By Difficulty
    lines.push('## By Difficulty');
    lines.push('');
    lines.push('| Level | PVR w/o | PVR w/ | \u0394PVR | TCC w/o | TCC w/ | \u0394TCC |');
    lines.push('|-------|---------|--------|------|---------|--------|------|');

    for (const level of ['L1', 'L2', 'L3']) {
        const levelResults = results.filter(r => r.level === level);
        if (levelResults.length === 0) continue;

        const lPvrWO = levelResults.filter(r => r.without_saer?.pvr).length;
        const lPvrW = levelResults.filter(r => r.with_saer?.pvr).length;
        const lTccWO = levelResults.reduce((s, r) => s + (r.without_saer?.tcc?.score || 0), 0) / levelResults.length;
        const lTccW = levelResults.reduce((s, r) => s + (r.with_saer?.tcc?.score || 0), 0) / levelResults.length;
        const dpvr = lPvrW - lPvrWO;
        const dtcc = lTccW - lTccWO;

        lines.push(`| ${level} | ${lPvrWO}/${levelResults.length} | ${lPvrW}/${levelResults.length} | ${dpvr > 0 ? '+' : ''}${dpvr} | ${lTccWO.toFixed(2)} | ${lTccW.toFixed(2)} | ${dtcc >= 0 ? '+' : ''}${dtcc.toFixed(2)} |`);
    }
    lines.push('');

    // Parse Failures
    const woParseFail = results.filter(r => r.without_saer?.parse_fail).length;
    const wParseFail = results.filter(r => r.with_saer?.parse_fail).length;
    if (woParseFail > 0 || wParseFail > 0) {
        lines.push('## Parse Failures');
        lines.push('');
        lines.push(`- without_saer: ${woParseFail}/${n} failed to parse`);
        lines.push(`- with_saer:    ${wParseFail}/${n} failed to parse`);
        lines.push('');
    }

    // Detailed Gaps
    const woFailures = results.filter(r => r.without_saer?.gaps?.length > 0);
    const wFailures = results.filter(r => r.with_saer?.gaps?.length > 0);

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

    return lines.join('\n');
}

// ─── Helpers ───────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
        `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
    console.log('=== SAER Static Evaluation Pipeline ===\n');

    const outputDir = argv.output || join(__dirname, 'results');
    mkdirSync(outputDir, { recursive: true });

    // Load tasks
    const tasksPath = join(__dirname, 'static_eval_tasks.json');
    let tasks = JSON.parse(readFileSync(tasksPath, 'utf8'));

    if (argv.slug) {
        tasks = tasks.filter(t => t.slug === argv.slug);
        if (tasks.length === 0) {
            console.error(`No task found with slug: ${argv.slug}`);
            process.exit(1);
        }
    }
    if (argv.level) {
        tasks = tasks.filter(t => t.level === argv.level);
        if (tasks.length === 0) {
            console.error(`No tasks found for level: ${argv.level}`);
            process.exit(1);
        }
    }

    console.log(`Tasks: ${tasks.length}, Modes: ${MODES.join(', ')}`);
    console.log(`Profile: ${argv.profile}\n`);

    if (argv.dryRun) {
        console.log('DRY RUN — printing prompts only\n');
    }

    // Create model and FewShotLearning
    const profile = loadProfile(argv.profile);
    const modelConfig = getModelConfig(profile);
    const model = argv.dryRun ? null : await createModel(modelConfig);
    const fsl = new FewShotLearning(argv.debug);

    if (!argv.dryRun) {
        console.log(`Model: ${modelConfig.api}/${modelConfig.model}\n`);
    }

    const results = [];

    for (const task of tasks) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Task: ${task.slug} [${task.level}]`);
        console.log(`Goal: ${task.goal}`);

        const taskResult = {
            slug: task.slug,
            level: task.level,
            goal: task.goal,
            target_item: task.target_item,
            without_saer: null,
            with_saer: null
        };

        const category = inferCategory(task.slug);
        const trainingExamples = loadTrainingData(category);

        for (const mode of MODES) {
            console.log(`\n  Mode: ${mode}`);

            const genResult = await generatePlan(
                model, fsl, task, mode, trainingExamples, argv.retries
            );

            if (genResult.errorType === 'dry_run') {
                taskResult[mode] = { parse_fail: true, pvr: false, tcc: null, pes: null, prompt: genResult.prompt };
                continue;
            }

            if (!genResult.plan) {
                console.log(`  FAILED (${genResult.errorType})`);
                taskResult[mode] = {
                    parse_fail: true,
                    pvr: false,
                    tcc: null,
                    pes: null,
                    raw_response: genResult.rawResponse,
                    error_type: genResult.errorType
                };
                continue;
            }

            console.log(`  Steps parsed: ${genResult.plan.steps.length}`);

            const pvrResult = calcPVR(genResult.plan, task.initial_inventory);
            const tccResult = calcTCC(genResult.plan, task.initial_inventory);
            const pes = calcPES(genResult.plan, task.min_steps);

            console.log(`  PVR: ${pvrResult.valid ? '\u2705 VALID' : '\u274c INVALID'}`);
            console.log(`  TCC: ${tccResult.score.toFixed(2)} (${tccResult.satisfied}/${tccResult.total})`);
            console.log(`  PES: ${pes.toFixed(2)}`);

            if (!pvrResult.valid) {
                pvrResult.gaps.forEach(g => {
                    console.log(`    Gap at step ${g.step} "${g.goal}": missing ${g.missing}`);
                });
            }

            taskResult[mode] = {
                parse_fail: false,
                pvr: pvrResult.valid,
                gaps: pvrResult.gaps,
                tcc: tccResult,
                pes,
                steps_count: genResult.plan.steps.length,
                raw_response: genResult.rawResponse,
                raw_plan: genResult.plan.steps
            };

            // Rate limit between modes
            await sleep(INTER_TASK_DELAY_MS);
        }

        results.push(taskResult);
    }

    if (argv.dryRun) {
        console.log('\nDRY RUN complete — no LLM calls made.');
        return;
    }

    // Write results
    const timestamp = formatTimestamp();
    const jsonPath = join(outputDir, `static_eval_${timestamp}.json`);
    const reportPath = join(outputDir, `static_eval_${timestamp}_report.md`);
    const rawPath = join(outputDir, `static_eval_${timestamp}_raw.md`);

    // JSON output
    writeFileSync(jsonPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        model: modelConfig.model,
        tasks: results
    }, null, 2));

    // Markdown report
    const report = generateReport(results);
    writeFileSync(reportPath, report);

    // Raw LLM responses
    const rawLines = [];
    rawLines.push(`# Raw LLM Responses — Static Eval`);
    rawLines.push(`Model: ${modelConfig.api}/${modelConfig.model}`);
    rawLines.push(`Timestamp: ${new Date().toISOString()}`);
    rawLines.push('');
    for (const r of results) {
        for (const mode of MODES) {
            const m = r[mode];
            if (!m) continue;
            rawLines.push(`${'='.repeat(70)}`);
            rawLines.push(`## ${r.slug} (${r.level}) — ${mode}`);
            rawLines.push(`Parse: ${m.parse_fail ? 'FAILED' : 'OK'}${m.error_type ? ` (${m.error_type})` : ''} | PVR: ${m.pvr ? 'PASS' : 'FAIL'}`);
            rawLines.push(`${'='.repeat(70)}`);
            rawLines.push('');
            rawLines.push(m.raw_response || '(no response)');
            rawLines.push('');
        }
    }
    writeFileSync(rawPath, rawLines.join('\n'));

    console.log(`\n${'='.repeat(60)}`);
    console.log(`Results: ${jsonPath}`);
    console.log(`Report:  ${reportPath}`);
    console.log(`Raw:     ${rawPath}`);
    console.log(`\n${report}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
