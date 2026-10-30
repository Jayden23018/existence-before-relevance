#!/usr/bin/env node

/**
 * SAER Static Plan Evaluator v2
 *
 * Fixes vs v1:
 *   1. 4 conditions: no_retrieval / random_retrieval / saer_cold / saer_warm
 *      - saer_cold: empty inventory → SAER uses keyword+level only (cold-start mode)
 *      - saer_warm: task.warm_inventory → SAER uses full gap+keyword+level scoring
 *   2. eval_tasks_v2.json: 12 tasks with zero train/test overlap
 *   3. Extended rawOreMap: coal/redstone/diamond/lapis correctly mapped
 *   4. parse_success_rate added to every summary table
 *   5. Multi-seed averaging fixed (parseFraction instead of undefined field access)
 *   6. RecipeResolver initialized with mockBot {version:'1.20.4'} — enables real hop distances
 *      for SAER gap scoring (without this, all hop distances are Infinity → gap=0 for everything)
 *
 * Usage:
 *   node scripts/eval/static_plan_eval_v2.js                         # all tasks, all 4 conditions
 *   node scripts/eval/static_plan_eval_v2.js --mode saer_warm        # one condition
 *   node scripts/eval/static_plan_eval_v2.js --level L2              # filter by level
 *   node scripts/eval/static_plan_eval_v2.js --slug craft/compass    # single task
 *   node scripts/eval/static_plan_eval_v2.js --seeds 3 --retries 3   # multi-seed full run
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Qwen } from '../../src/models/qwen.js';
import { Local } from '../../src/models/local.js';
import { FewShotLearning } from '../../src/models/enhancers/fewshot_learning.js';
import RecipeResolver from '../../src/models/enhancers/recipe_resolver.js';
import { SMELTING_OUTPUTS, TOOL_TIERS, ORE_TOOL_REQUIREMENTS } from '../../src/models/enhancers/plan_validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

const INTENT_TO_TRAINING_FILE = {
    BUILD: 'build_examples.json',
    CRAFT: 'crafting_examples.json',
    COLLECT: 'collecting_examples.json',
    COOK: 'cooking_examples.json',
    COMBAT: 'combat_examples.json',
    EXPLORE: 'collecting_examples.json',
    DEFAULT: 'crafting_examples.json'
};

const SYSTEM_PROMPT = 'You are a Minecraft crafting expert. Always follow the output format exactly.';
const INTER_TASK_DELAY_MS = 2000;

// v2: 4 conditions — cold/warm split isolates SAER gap scoring contribution
const CONDITIONS = ['no_retrieval', 'random_retrieval', 'saer_cold', 'saer_warm'];

// ─── CLI ───────────────────────────────────────────────────────────

const argv = yargs(hideBin(process.argv))
    .option('level', { type: 'string', describe: 'Filter by difficulty level (L1/L2/L3)' })
    .option('slug', { type: 'string', describe: 'Run single task by slug' })
    .option('mode', {
        type: 'string',
        choices: CONDITIONS,
        describe: 'Run single condition only'
    })
    .option('debug', { type: 'boolean', default: false, describe: 'Enable debug logging' })
    .option('output', { type: 'string', describe: 'Output directory (default: scripts/eval/results/)' })
    .option('profile', {
        type: 'string',
        default: 'max',
        describe: 'Profile name (e.g. max, qwen). Reads from profiles/<name>.json or project root'
    })
    .option('seeds', { type: 'number', default: 1, describe: 'Number of eval runs for averaging' })
    .option('retries', { type: 'number', default: 3, describe: 'Max retries per task for API/parse failures' })
    .option('tasks', {
        type: 'string',
        default: 'eval_tasks_v2.json',
        describe: 'Tasks file (default: eval_tasks_v2.json)'
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
    if (modelConfig.api === 'ollama') return new Local(modelConfig.model, modelConfig.url);
    if (modelConfig.api === 'doubao') {
        const { Doubao } = await import('../../src/models/doubao.js');
        return new Doubao(modelConfig.model, modelConfig.url);
    }
    // qwen and other OpenAI-compatible
    return new Qwen(modelConfig.model, modelConfig.api === 'qwen' ? null : modelConfig.url, modelConfig.params || null);
}

// ─── Training Data ─────────────────────────────────────────────────

function loadTrainingData(category) {
    const fileName = INTENT_TO_TRAINING_FILE[category] || INTENT_TO_TRAINING_FILE.DEFAULT;
    const filePath = join(PROJECT_ROOT, 'data', 'training', fileName);
    if (!existsSync(filePath)) {
        console.warn(`Training file not found: ${filePath}, falling back to crafting_examples.json`);
        return JSON.parse(readFileSync(join(PROJECT_ROOT, 'data', 'training', 'crafting_examples.json'), 'utf8'));
    }
    return JSON.parse(readFileSync(filePath, 'utf8'));
}

function selectRandomExamples(examples, count) {
    if (examples.length <= count) return [...examples];
    const shuffled = [...examples];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

// ─── Item Name Utilities ───────────────────────────────────────────

const WOOD_PREFIXES = ['oak_', 'birch_', 'spruce_', 'jungle_', 'acacia_', 'dark_oak_', 'mangrove_', 'cherry_', 'bamboo_'];

function normalizeItemName(name) {
    if (!name) return '';
    let n = name.toLowerCase();
    for (const prefix of WOOD_PREFIXES) {
        if (n.startsWith(prefix)) { n = n.slice(prefix.length); break; }
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

// ─── Plan Generation ───────────────────────────────────────────────

/**
 * Build prompt and call LLM for a given condition.
 *
 * Condition semantics:
 *   no_retrieval    — zero-shot, no examples
 *   random_retrieval — 3 random examples, no inventory context for SAER
 *   saer_cold       — SAER with empty inventory (keyword+level only, cold-start mode)
 *   saer_warm       — SAER with task.warm_inventory (full gap+keyword+level, normal mode)
 */
async function generatePlan(model, fsl, task, condition, trainingExamples, maxRetries = 3) {
    const userRequest = { input: task.prompt, intent: task.category };
    let prompt;
    let examplesUsed = 0;

    switch (condition) {
        case 'no_retrieval':
            prompt = fsl.buildFewShotPrompt(userRequest, [], null);
            examplesUsed = 0;
            break;
        case 'random_retrieval': {
            const randomExs = selectRandomExamples(trainingExamples, 3);
            prompt = fsl.buildFewShotPrompt(userRequest, randomExs, { inventory: [], nearbyBlocks: [] });
            examplesUsed = randomExs.length;
            break;
        }
        case 'saer_cold':
            // Empty inventory → _isColdStart returns true → keyword-heavy weights (0.70/0.15/0.15)
            prompt = fsl.buildFewShotPrompt(userRequest, trainingExamples, { inventory: [], nearbyBlocks: [] });
            examplesUsed = 3;
            break;
        case 'saer_warm':
            // task.warm_inventory → _isColdStart returns false → full gap weights (0.50/0.35/0.15)
            // Note: agentState inventory is only used for SAER example selection,
            // it is NOT included in the prompt text shown to the LLM.
            prompt = fsl.buildFewShotPrompt(userRequest, trainingExamples, {
                inventory: task.warm_inventory || [],
                nearbyBlocks: []
            });
            examplesUsed = 3;
            break;
        default:
            throw new Error(`Unknown condition: ${condition}`);
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
                console.log(`  Attempt ${attempt}/${maxRetries}: API error (swallowed), retrying...`);
                if (attempt < maxRetries) await sleep(3000);
                continue;
            }

            const plan = fsl.parseExecutionPlan(aiResponse, task.prompt);
            if (!plan) {
                lastRaw = aiResponse;
                lastErrorType = 'parse_error';
                console.log(`  Attempt ${attempt}/${maxRetries}: Parse failed, retrying...`);
                if (attempt < maxRetries) await sleep(2000);
                continue;
            }

            return { plan, examplesUsed, promptLength: prompt.length, rawResponse: aiResponse, errorType: null };

        } catch (err) {
            lastRaw = err.message;
            lastErrorType = 'api_error';
            console.log(`  Attempt ${attempt}/${maxRetries}: ${err.message}, retrying...`);
            if (attempt < maxRetries) await sleep(3000);
        }
    }

    return { plan: null, examplesUsed, promptLength: prompt.length, rawResponse: lastRaw, errorType: lastErrorType };
}

// ─── Plan Correctness Validation ───────────────────────────────────

function parsePreconditionToken(token) {
    if (!token) return null;
    if (typeof token === 'object' && token.type) return token;
    const str = String(token).trim();
    const match = str.match(/^(item|station|access):([^:]+)(?::(\d+))?$/);
    if (match) return { type: match[1], name: match[2], count: match[3] ? parseInt(match[3]) : 1 };
    return { type: 'item', name: str, count: 1 };
}

function getStepCommands(step) {
    const cmds = [];
    if (step.action_cmd && step.action_cmd.length > 0) cmds.push(...step.action_cmd);
    else if (step.command) cmds.push(step.command);
    return cmds;
}

/**
 * Infer what a command produces.
 * rawOreMap v2: extended to cover all standard ore drops in Minecraft 1.17+
 *   - Raw materials: iron_ore→raw_iron, gold_ore→raw_gold, copper_ore→raw_copper
 *   - Direct drops: coal_ore→coal, redstone_ore→redstone, diamond_ore→diamond, etc.
 */
function inferProducesFromCommand(cmd) {
    if (!cmd) return [];

    // smeltItem("raw_iron", 3) → iron_ingot
    const smeltMatch = cmd.match(/smeltItem\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
    if (smeltMatch) {
        const input = smeltMatch[1];
        const count = parseInt(smeltMatch[2]);
        const output = SMELTING_OUTPUTS[input];
        if (output) return [{ type: 'item', name: output, count }];
        return [];
    }

    // craftRecipe("iron_pickaxe", 1) → iron_pickaxe
    const craftMatch = cmd.match(/craftRecipe\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
    if (craftMatch) {
        return [{ type: 'item', name: craftMatch[1], count: parseInt(craftMatch[2]) }];
    }

    // collectBlocks("iron_ore", 3) → raw_iron (v2: extended ore drop map)
    const collectMatch = cmd.match(/collectBlocks\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
    if (collectMatch) {
        const block = collectMatch[1];
        const count = parseInt(collectMatch[2]);

        // v2: complete ore drop map for Minecraft 1.17+ (1.20.4)
        const RAW_ORE_MAP = {
            // raw material drops (changed in 1.17)
            'iron_ore': 'raw_iron',
            'deepslate_iron_ore': 'raw_iron',
            'gold_ore': 'raw_gold',
            'deepslate_gold_ore': 'raw_gold',
            'nether_gold_ore': 'raw_gold',
            'copper_ore': 'raw_copper',
            'deepslate_copper_ore': 'raw_copper',
            // direct item drops (unchanged since 1.17)
            'coal_ore': 'coal',
            'deepslate_coal_ore': 'coal',
            'redstone_ore': 'redstone',
            'deepslate_redstone_ore': 'redstone',
            'diamond_ore': 'diamond',
            'deepslate_diamond_ore': 'diamond',
            'emerald_ore': 'emerald',
            'deepslate_emerald_ore': 'emerald',
            'lapis_ore': 'lapis_lazuli',
            'deepslate_lapis_ore': 'lapis_lazuli',
            'nether_quartz_ore': 'quartz',
            'ancient_debris': 'ancient_debris'
        };
        const product = RAW_ORE_MAP[block] || block;
        return [{ type: 'item', name: product, count }];
    }

    return [];
}

/**
 * Validate a generated plan for correctness.
 * Returns strict_pass, lenient_pass, pvr, step_count, step_efficiency, parse_success.
 */
function validatePlanCorrectness(task, plan, initialInventory = []) {
    if (!plan || !plan.steps || plan.steps.length === 0) {
        return {
            strict_pass: false, lenient_pass: false, pvr: false,
            step_count: 0, step_efficiency: 0,
            issues: ['Plan is empty or could not be parsed'],
            lenient_issues: ['Plan is empty or could not be parsed']
        };
    }

    const issues = [];
    const lenientIssues = [];
    const steps = plan.steps;
    let goalAchieved = false;
    let allPreconditionsMet = true;
    // Seed availableItems with the initial inventory (e.g. warm_inventory for saer_warm).
    // Without this, saer_warm plans that correctly assume an existing tool (e.g. iron_pickaxe)
    // are falsely penalised because the tool never appears as a plan output.
    const availableItems = new Map();
    for (const item of initialInventory) {
        if (item?.name) {
            availableItems.set(item.name, (availableItems.get(item.name) || 0) + (item.count || 1));
        }
    }

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const cmds = getStepCommands(step);

        // 1. Check goal achievement from explicit produces
        if (step.produces) {
            const produces = Array.isArray(step.produces) ? step.produces : [step.produces];
            for (const p of produces) {
                if (p.type === 'item' && itemsMatch(p.name, task.goal_item)) goalAchieved = true;
            }
        }

        // 2. Check preconditions
        const preconds = (step.preconditions || [])
            .map(c => typeof c === 'string' ? parsePreconditionToken(c) : c)
            .filter(Boolean);

        for (const cond of preconds) {
            if (cond.type === 'access' || cond.type === 'station') continue;
            if (cond.type === 'item') {
                const required = cond.name;
                const count = cond.count || 1;
                let satisfied = false;
                for (const [availName, availCount] of availableItems) {
                    if ((toolSatisfies(required, availName) || itemsMatch(required, availName)) && availCount >= count) {
                        satisfied = true;
                        break;
                    }
                }
                if (!satisfied) {
                    allPreconditionsMet = false;
                    const msg = `Step ${step.step}: missing ${required}${count > 1 ? ' x' + count : ''}`;
                    issues.push(msg);
                    lenientIssues.push(msg);
                }
            }
        }

        // 3. Check tool requirements for collectBlocks
        for (const cmd of cmds) {
            const collectMatch = cmd.match(/collectBlocks\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
            if (collectMatch) {
                const block = collectMatch[1];
                const requiredTool = ORE_TOOL_REQUIREMENTS[block];
                if (requiredTool) {
                    let hasTool = false;
                    for (const [availName] of availableItems) {
                        if (toolSatisfies(requiredTool, availName)) { hasTool = true; break; }
                    }
                    if (!hasTool) {
                        const msg = `Step ${step.step}: collecting ${block} requires ${requiredTool}, not available`;
                        issues.push(msg);
                        lenientIssues.push(msg);
                    }
                }
            }
        }

        // 4. Check smelting naming (strict only — lenient forgives raw_ore naming)
        for (const cmd of cmds) {
            const smeltMatch = cmd.match(/smeltItem\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
            if (smeltMatch) {
                const input = smeltMatch[1];
                const correction = { 'iron_ore': 'raw_iron', 'gold_ore': 'raw_gold', 'copper_ore': 'raw_copper' };
                if (correction[input]) {
                    issues.push(
                        `Step ${step.step}: smeltItem("${input}") should be smeltItem("${correction[input]}") — 1.17+ drops raw materials`
                    );
                    // lenientIssues intentionally not added — lenient mode forgives this naming
                }
            }
        }

        // 5. Add step outputs to available items
        let stepOutputs = [];
        if (step.produces) {
            stepOutputs = Array.isArray(step.produces) ? step.produces : [step.produces];
        }
        if (stepOutputs.length === 0) {
            for (const cmd of cmds) stepOutputs.push(...inferProducesFromCommand(cmd));
        }
        for (const output of stepOutputs) {
            if (output?.type === 'item' && output.name) {
                availableItems.set(output.name, (availableItems.get(output.name) || 0) + (output.count || 1));
            }
        }
    }

    // Final goal check from inferred produces
    if (!goalAchieved) {
        for (const [name, count] of availableItems) {
            if (itemsMatch(name, task.goal_item) && count >= (task.goal_count || 1)) {
                goalAchieved = true;
                break;
            }
        }
    }

    if (!goalAchieved) {
        const msg = `Goal item "${task.goal_item}" not produced by any step`;
        issues.push(msg);
        lenientIssues.push(msg);
    }

    const stepCount = steps.length;
    const stepEfficiency = task.min_steps > 0 ? Math.min(1.0, task.min_steps / stepCount) : 0;

    return {
        strict_pass: issues.length === 0 && goalAchieved,
        lenient_pass: lenientIssues.length === 0 && goalAchieved,
        pvr: allPreconditionsMet && goalAchieved,
        step_count: stepCount,
        step_efficiency: Math.round(stepEfficiency * 100) / 100,
        issues,
        lenient_issues: lenientIssues
    };
}

// ─── Summary & Output ──────────────────────────────────────────────

function formatTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
        `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * Build summary statistics for a condition's results.
 * v2: adds parse_success_rate metric.
 */
function buildSummary(results) {
    const levels = ['L1', 'L2', 'L3'];
    const byLevel = {};

    for (const level of levels) {
        const lr = results.filter(r => r.level === level);
        const total = lr.length;
        if (total === 0) continue;

        byLevel[level] = {
            total,
            parse_success_rate: `${lr.filter(r => r.parse_success).length}/${total}`,
            strict_tcr: `${lr.filter(r => r.validation.strict_pass).length}/${total}`,
            lenient_tcr: `${lr.filter(r => r.validation.lenient_pass).length}/${total}`,
            pvr: `${lr.filter(r => r.validation.pvr).length}/${total}`,
            avg_step_efficiency: Math.round(lr.reduce((s, r) => s + r.validation.step_efficiency, 0) / total * 100) / 100
        };
    }

    const total = results.length;
    const overall = {
        total,
        parse_success_rate: `${results.filter(r => r.parse_success).length}/${total}`,
        strict_tcr: `${results.filter(r => r.validation.strict_pass).length}/${total}`,
        lenient_tcr: `${results.filter(r => r.validation.lenient_pass).length}/${total}`,
        pvr: `${results.filter(r => r.validation.pvr).length}/${total}`,
        avg_step_efficiency: Math.round(results.reduce((s, r) => s + r.validation.step_efficiency, 0) / total * 100) / 100
    };

    return { by_level: byLevel, overall };
}

function writeJSON(outputDir, timestamp, condition, data) {
    const filename = `eval_v2_${timestamp}_${condition}.json`;
    const path = join(outputDir, filename);
    writeFileSync(path, JSON.stringify(data, null, 2));
    console.log(`JSON results: ${path}`);
    return path;
}

function writeMarkdown(outputDir, timestamp, condition, data) {
    const filename = `eval_v2_${timestamp}_${condition}_report.md`;
    const path = join(outputDir, filename);
    const lines = [];

    lines.push(`# Static Plan Evaluation v2 Report`);
    lines.push('');
    lines.push(`**Date**: ${data.meta.timestamp}`);
    lines.push(`**Model**: ${data.meta.model}`);
    lines.push(`**Condition**: ${condition}`);
    lines.push(`**Tasks**: ${data.meta.completed_tasks}/${data.meta.total_tasks} parsed successfully`);
    lines.push('');

    const summary = data.summary;
    lines.push(`## Summary`);
    lines.push('');
    lines.push('| Level | Parse OK | Strict TCR | Lenient TCR | PVR | Avg Efficiency |');
    lines.push('|-------|----------|-----------|------------|-----|---------------|');

    for (const [level, stats] of Object.entries(summary.by_level)) {
        lines.push(
            `| ${level} | ${stats.parse_success_rate} | ${stats.strict_tcr} | ${stats.lenient_tcr} | ${stats.pvr} | ${stats.avg_step_efficiency} |`
        );
    }
    lines.push(
        `| **Overall** | **${summary.overall.parse_success_rate}** | **${summary.overall.strict_tcr}** | **${summary.overall.lenient_tcr}** | **${summary.overall.pvr}** | **${summary.overall.avg_step_efficiency}** |`
    );
    lines.push('');

    lines.push(`## Per-Task Results`);
    lines.push('');

    for (const task of data.tasks) {
        const v = task.validation;
        lines.push(`### ${task.slug} (${task.level})`);
        lines.push(`- Goal: ${task.goal_item} | Parse: ${task.parse_success ? 'OK' : 'FAILED'}`);
        lines.push(`- Steps: ${v.step_count} (min: ${task.min_steps}, efficiency: ${v.step_efficiency})`);
        lines.push(`- Strict: ${v.strict_pass ? 'PASS' : 'FAIL'} | Lenient: ${v.lenient_pass ? 'PASS' : 'FAIL'} | PVR: ${v.pvr ? 'PASS' : 'FAIL'}`);
        if (v.issues.length > 0) {
            lines.push(`- Issues (strict):`);
            for (const issue of v.issues) lines.push(`  - ${issue}`);
        }
        lines.push('');
    }

    writeFileSync(path, lines.join('\n'));
    console.log(`Markdown report: ${path}`);
    return path;
}

function writeRawResponses(outputDir, timestamp, condition, data) {
    const filename = `eval_v2_${timestamp}_${condition}_raw.md`;
    const path = join(outputDir, filename);
    const lines = [];

    lines.push(`# Raw LLM Responses — ${condition}`);
    lines.push(`Model: ${data.meta.model} | Timestamp: ${data.meta.timestamp}`);
    lines.push('');

    for (const task of data.tasks) {
        const v = task.validation;
        lines.push(`${'='.repeat(70)}`);
        lines.push(`## ${task.slug} (${task.level}) — goal: ${task.goal_item}`);
        lines.push(`Parse: ${task.parse_success ? 'OK' : 'FAILED'} | Strict: ${v.strict_pass ? 'PASS' : 'FAIL'} | Lenient: ${v.lenient_pass ? 'PASS' : 'FAIL'}`);
        if (v.issues.length > 0) lines.push(`Issues: ${v.issues.join('; ')}`);
        lines.push(`${'='.repeat(70)}`);
        lines.push('');
        lines.push(task.raw_response || '(no response)');
        lines.push('');
        lines.push('');
    }

    writeFileSync(path, lines.join('\n'));
    console.log(`Raw responses: ${path}`);
}

// ─── Multi-Seed Averaging ──────────────────────────────────────────

/**
 * Parse a fraction string like "3/12" into { num: 3, den: 12 }.
 * v2 fix: v1 accessed o.summary.tcr.strict which was always undefined.
 */
function parseFraction(fracStr) {
    const parts = String(fracStr).split('/');
    if (parts.length !== 2) return { num: 0, den: 1 };
    return { num: parseInt(parts[0]) || 0, den: parseInt(parts[1]) || 1 };
}

function fractionToRate(fracStr) {
    const { num, den } = parseFraction(fracStr);
    return den > 0 ? num / den : 0;
}

function averageSeedOutputs(condition, outputs) {
    if (outputs.length === 1) return;
    const n = outputs.length;

    const avgStrict = outputs.reduce((s, o) => s + fractionToRate(o.summary.overall.strict_tcr), 0) / n;
    const avgLenient = outputs.reduce((s, o) => s + fractionToRate(o.summary.overall.lenient_tcr), 0) / n;
    const avgPvr = outputs.reduce((s, o) => s + fractionToRate(o.summary.overall.pvr), 0) / n;
    const avgParse = outputs.reduce((s, o) => s + fractionToRate(o.summary.overall.parse_success_rate), 0) / n;

    console.log(`  ${condition} (avg over ${n} seeds):`);
    console.log(`    parse_ok=${(avgParse * 100).toFixed(1)}%  strict_tcr=${(avgStrict * 100).toFixed(1)}%  lenient_tcr=${(avgLenient * 100).toFixed(1)}%  pvr=${(avgPvr * 100).toFixed(1)}%`);
}

// ─── Main ──────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function main() {
    console.log('=== SAER Static Plan Evaluator v2 ===\n');

    const conditions = argv.mode ? [argv.mode] : CONDITIONS;
    const outputDir = argv.output || join(__dirname, 'results');
    mkdirSync(outputDir, { recursive: true });

    // Load eval tasks
    const tasksPath = join(__dirname, argv.tasks);
    if (!existsSync(tasksPath)) {
        console.error(`Tasks file not found: ${tasksPath}`);
        process.exit(1);
    }
    let tasks = JSON.parse(readFileSync(tasksPath, 'utf8'));

    if (argv.slug) {
        tasks = tasks.filter(t => t.slug === argv.slug);
        if (tasks.length === 0) { console.error(`No task: ${argv.slug}`); process.exit(1); }
    }
    if (argv.level) {
        tasks = tasks.filter(t => t.level === argv.level);
        if (tasks.length === 0) { console.error(`No tasks for level: ${argv.level}`); process.exit(1); }
    }

    console.log(`Tasks: ${tasks.length}, Conditions: ${conditions.join(', ')}`);
    console.log(`Tasks file: ${argv.tasks}\n`);

    const profile = loadProfile(argv.profile);
    const modelConfig = getModelConfig(profile);
    const model = await createModel(modelConfig);
    const fsl = new FewShotLearning(argv.debug);
    // Provide mcData-backed RecipeResolver so gap scoring uses real hop distances.
    // mockBot only needs .version — no live bot connection required.
    const mockBot = { version: '1.20.4' };
    fsl.setRecipeResolver(new RecipeResolver(mockBot));

    console.log(`Model: ${modelConfig.api}/${modelConfig.model}`);

    const timestamp = formatTimestamp();
    const numSeeds = argv.seeds || 1;
    const allSeedOutputs = [];

    for (let seed = 1; seed <= numSeeds; seed++) {
        if (numSeeds > 1) {
            console.log(`\n${'='.repeat(50)}\n  SEED ${seed}/${numSeeds}\n${'='.repeat(50)}`);
        }

        for (const condition of conditions) {
            console.log(`\n--- Condition: ${condition}${numSeeds > 1 ? ` (seed ${seed})` : ''} ---\n`);

            const results = [];
            let completed = 0;
            let failed = 0;

            for (const task of tasks) {
                console.log(`[${condition}] ${task.slug} (${task.level})...`);

                try {
                    const trainingExamples = loadTrainingData(task.category);
                    const genResult = await generatePlan(model, fsl, task, condition, trainingExamples, argv.retries);

                    if (!genResult.plan) {
                        console.log(`  FAILED (${genResult.errorType || 'unknown'})`);
                        results.push({
                            slug: task.slug,
                            level: task.level,
                            goal_item: task.goal_item,
                            min_steps: task.min_steps,
                            parse_success: false,
                            plan: null,
                            raw_response: genResult.rawResponse || null,
                            error_type: genResult.errorType || 'unknown',
                            validation: {
                                strict_pass: false, lenient_pass: false, pvr: false,
                                step_count: 0, step_efficiency: 0,
                                issues: [`Plan ${genResult.errorType === 'api_error' ? 'generation failed (API error)' : 'parsing failed'}`],
                                lenient_issues: [`Plan ${genResult.errorType === 'api_error' ? 'generation failed (API error)' : 'parsing failed'}`]
                            },
                            examples_used: genResult.examplesUsed,
                            prompt_length: genResult.promptLength
                        });
                        failed++;
                    } else {
                        const initialInv = condition === 'saer_warm' ? (task.warm_inventory || []) : [];
                        const validation = validatePlanCorrectness(task, genResult.plan, initialInv);
                        console.log(
                            `  ${validation.step_count} steps, parse=OK, strict=${validation.strict_pass ? 'PASS' : 'FAIL'}, lenient=${validation.lenient_pass ? 'PASS' : 'FAIL'}`
                        );
                        results.push({
                            slug: task.slug,
                            level: task.level,
                            goal_item: task.goal_item,
                            min_steps: task.min_steps,
                            parse_success: true,
                            plan: { steps: genResult.plan.steps, target: genResult.plan.target },
                            raw_response: genResult.rawResponse,
                            validation,
                            examples_used: genResult.examplesUsed,
                            prompt_length: genResult.promptLength
                        });
                        completed++;
                    }
                } catch (err) {
                    console.error(`  ERROR: ${err.message}`);
                    results.push({
                        slug: task.slug, level: task.level, goal_item: task.goal_item,
                        min_steps: task.min_steps, parse_success: false, plan: null,
                        validation: {
                            strict_pass: false, lenient_pass: false, pvr: false,
                            step_count: 0, step_efficiency: 0,
                            issues: [`Error: ${err.message}`], lenient_issues: [`Error: ${err.message}`]
                        },
                        examples_used: 0, prompt_length: 0
                    });
                    failed++;
                }

                if (tasks.indexOf(task) < tasks.length - 1) await sleep(INTER_TASK_DELAY_MS);
            }

            const output = {
                meta: {
                    timestamp: new Date().toISOString(),
                    model: modelConfig.model || 'unknown',
                    condition,
                    tasks_file: argv.tasks,
                    total_tasks: tasks.length,
                    completed_tasks: completed,
                    failed_tasks: failed,
                    seed
                },
                tasks: results,
                summary: buildSummary(results)
            };

            writeJSON(outputDir, timestamp, condition, output);
            writeMarkdown(outputDir, timestamp, condition, output);
            writeRawResponses(outputDir, timestamp, condition, output);
            allSeedOutputs.push({ condition, output });
        }
    }

    // Multi-seed summary
    if (numSeeds > 1) {
        console.log('\n=== Multi-Seed Averages ===\n');
        const byCondition = {};
        for (const { condition, output } of allSeedOutputs) {
            if (!byCondition[condition]) byCondition[condition] = [];
            byCondition[condition].push(output);
        }
        for (const [condition, outputs] of Object.entries(byCondition)) {
            averageSeedOutputs(condition, outputs);
        }
    }

    console.log('\n=== Evaluation complete ===');
    console.log(`Results written to: ${outputDir}`);
    console.log(`Run: node scripts/eval/merge_results_v2.js  to generate comparison table`);
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
