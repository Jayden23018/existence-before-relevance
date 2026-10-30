#!/usr/bin/env node

/**
 * Route A: Execution Eval Runner
 *
 * Runs eval tasks with a live bot connected to a Minecraft server,
 * measuring real TCR (Task Completion Rate) with/without SAER.
 *
 * Usage:
 *   node scripts/run_eval.js --task craft/iron_pickaxe --mode with_saer
 *   node scripts/run_eval.js --task craft/iron_pickaxe --mode without_saer
 *   node scripts/run_eval.js --all --level L2
 *   node scripts/run_eval.js --all --mode with_saer
 *
 * Output: eval_results/eval_log.jsonl
 *
 * Prerequisites:
 *   - Minecraft server running on localhost (configured in settings.js)
 *   - Valid API key for model in keys.json
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Agent } from '../src/agent/agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const EVAL_LOG_DIR = join(PROJECT_ROOT, 'eval_results');
const EVAL_LOG_PATH = join(EVAL_LOG_DIR, 'eval_log.jsonl');

const EVAL_TASKS = [
    // L1
    { slug: 'craft/wooden_sword',  goal: 'craft a wooden sword',    level: 'L1', target: 'wooden_sword',   count: 1, category: 'CRAFT' },
    { slug: 'craft/stone_pickaxe', goal: 'craft a stone pickaxe',   level: 'L1', target: 'stone_pickaxe',  count: 1, category: 'CRAFT' },
    // L2
    { slug: 'craft/iron_pickaxe',  goal: 'craft an iron pickaxe',   level: 'L2', target: 'iron_pickaxe',   count: 1, category: 'CRAFT' },
    { slug: 'craft/iron_helmet',   goal: 'craft an iron helmet',    level: 'L2', target: 'iron_helmet',    count: 1, category: 'CRAFT' },
    { slug: 'craft/iron_boots',    goal: 'craft iron boots',        level: 'L2', target: 'iron_boots',     count: 1, category: 'CRAFT' },
    { slug: 'collect/gold_ore',    goal: 'collect gold ore',        level: 'L2', target: 'raw_gold',       count: 3, category: 'COLLECT' },
    // L3
    { slug: 'craft/iron_chestplate', goal: 'craft an iron chestplate', level: 'L3', target: 'iron_chestplate', count: 1, category: 'CRAFT' },
    { slug: 'craft/bucket',          goal: 'craft a bucket',           level: 'L3', target: 'bucket',          count: 1, category: 'CRAFT' },
    { slug: 'collect/diamond',       goal: 'collect diamonds',         level: 'L3', target: 'diamond',         count: 3, category: 'COLLECT' },
    { slug: 'collect/redstone',      goal: 'collect redstone dust',    level: 'L3', target: 'redstone',        count: 20, category: 'COLLECT' },
];

// ─── CLI ───────────────────────────────────────────────────────────

const argv = yargs(hideBin(process.argv))
    .option('task', {
        type: 'string',
        describe: 'Single task slug to run (e.g. craft/iron_pickaxe)'
    })
    .option('all', {
        type: 'boolean',
        default: false,
        describe: 'Run all tasks'
    })
    .option('mode', {
        type: 'string',
        choices: ['with_saer', 'without_saer'],
        demandOption: true,
        describe: 'Eval mode'
    })
    .option('level', {
        type: 'string',
        describe: 'Filter tasks by level (L1/L2/L3)'
    })
    .option('profile', {
        type: 'string',
        default: 'lucy.json',
        describe: 'Agent profile file (at project root)'
    })
    .option('timeout', {
        type: 'number',
        default: 120000,
        describe: 'Timeout per task in ms (default 2 min)'
    })
    .help()
    .parseSync();

// ─── Task Selection ────────────────────────────────────────────────

function getTasks() {
    let tasks = [...EVAL_TASKS];

    if (argv.task) {
        tasks = tasks.filter(t => t.slug === argv.task);
        if (tasks.length === 0) {
            console.error(`Task not found: ${argv.task}`);
            process.exit(1);
        }
    }

    if (argv.level) {
        tasks = tasks.filter(t => t.level === argv.level);
    }

    if (!argv.task && !argv.all && !argv.level) {
        console.error('Specify --task <slug>, --all, or --level <L1|L2|L3>');
        process.exit(1);
    }

    return tasks;
}

// ─── Agent Initialization ──────────────────────────────────────────

async function initAgent() {
    const profilePath = join(PROJECT_ROOT, argv.profile);
    if (!existsSync(profilePath)) {
        console.error(`Profile not found: ${profilePath}`);
        process.exit(1);
    }

    const agent = new Agent();
    console.log(`[run_eval] Starting agent with profile: ${profilePath}`);
    await agent.start(profilePath, false, null, 0);
    console.log('[run_eval] Agent started and connected to MC server');

    return agent;
}

// ─── Task Execution ────────────────────────────────────────────────

function getEnhancer(agent) {
    const enhancer = agent?.prompter?.enhancer;
    if (!enhancer) {
        throw new Error('Agent has no enhancer. Ensure profile uses implicit_enhancer.');
    }
    return enhancer;
}

function configureSAER(enhancer, mode) {
    if (!enhancer.fewShotLearning) {
        throw new Error('Enhancer has no fewShotLearning module');
    }

    const saerEnabled = mode === 'with_saer';
    enhancer.fewShotLearning.saerEnabled = saerEnabled;
    console.log(`[run_eval] SAER ${saerEnabled ? 'enabled' : 'disabled'}`);
}

async function runTask(enhancer, task, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Task timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        (async () => {
            try {
                // Enable eval mode on TaskManager
                enhancer.taskManager.enableEvalMode(EVAL_LOG_PATH, {
                    mode: argv.mode,
                    taskSlug: task.slug,
                    level: task.level,
                    targetItem: task.target,
                    targetCount: task.count
                });

                // Send task through the enhancer pipeline
                const result = await enhancer.sendRequest(task.goal);

                clearTimeout(timer);
                resolve(result);
            } catch (err) {
                clearTimeout(timer);
                reject(err);
            }
        })();
    });
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
    const tasks = getTasks();
    console.log(`[run_eval] Running ${tasks.length} task(s) in mode: ${argv.mode}`);
    console.log(`[run_eval] Log output: ${EVAL_LOG_PATH}`);

    const agent = await initAgent();
    const enhancer = getEnhancer(agent);
    configureSAER(enhancer, argv.mode);

    for (const task of tasks) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`[run_eval] Task: ${task.slug} (${task.level}) — ${task.goal}`);
        console.log(`${'='.repeat(60)}`);

        try {
            const result = await runTask(enhancer, task, argv.timeout);
            console.log(`[run_eval] Result: ${result}`);
        } catch (err) {
            console.error(`[run_eval] Task failed: ${err.message}`);
        }

        // Brief pause between tasks
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Clear task state for next task
        enhancer.taskManager.clear();
    }

    console.log(`\n[run_eval] All tasks complete. Results in: ${EVAL_LOG_PATH}`);

    // Clean exit — disconnect bot
    process.exit(0);
}

main().catch(err => {
    console.error('[run_eval] Fatal error:', err.message);
    process.exit(1);
});
