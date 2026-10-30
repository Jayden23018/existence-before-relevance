#!/usr/bin/env node
/**
 * Live Bot Evaluation — Three-Condition Comparison for SAER Paper
 *
 * Runs real Minecraft bot tasks and measures Task Completion Rate (TCR)
 * by checking whether the goal item appears in the bot's inventory.
 *
 * Strategy:
 *   For craft/* tasks: pre-populate raw materials via /give so the bot
 *   focuses on PLANNING + CRAFTING (the variable our paper studies).
 *   For collect/* tasks: let the bot gather naturally from the world.
 *
 * Conditions:
 *   no_retrieval   — no few-shot examples
 *   bm25_retrieval — BM25 text retrieval
 *   saer_cold      — SAER with cold-start weights
 *
 * Usage:
 *   node scripts/live_eval.js --condition saer_cold --level L2
 *   node scripts/live_eval.js --condition bm25_retrieval --all
 *   node scripts/live_eval.js --condition no_retrieval --task craft/iron_axe
 *
 * Prerequisites:
 *   - Minecraft server running on host/port configured in settings.js
 *   - /op EvalBot  (gives bot permission to run /give and /clear)
 *   - QWEN_API_KEY set in keys.json
 *
 * Output:
 *   scripts/eval/results/live_eval_<timestamp>_<condition>.json
 *   scripts/eval/results/live_eval_<timestamp>_<condition>_report.md
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { Agent } from '../src/agent/agent.js';
import { BM25Retriever } from '../src/models/enhancers/bm25_retriever.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');
const RESULTS_DIR = join(PROJECT_ROOT, 'scripts/eval/results');

// ── Task List (15 tasks: L1×4, L2×7, L3×4) ──────────────────────────────────

const LIVE_TASKS = [
    // L1 — simple, fast to verify
    { slug: 'craft/wooden_sword',    goal: 'craft a wooden sword',      level: 'L1', target: 'wooden_sword',   count: 1 },
    { slug: 'collect/wood',          goal: 'collect some oak logs',     level: 'L1', target: 'oak_log',         count: 3 },
    { slug: 'craft/crafting_table',  goal: 'craft a crafting table',    level: 'L1', target: 'crafting_table',  count: 1 },
    { slug: 'collect/cobblestone',   goal: 'collect cobblestone',       level: 'L1', target: 'cobblestone',     count: 8 },

    // L2 — iron tools, discrimination frontier
    { slug: 'craft/iron_pickaxe',    goal: 'craft an iron pickaxe',     level: 'L2', target: 'iron_pickaxe',    count: 1 },
    { slug: 'craft/iron_axe',        goal: 'craft an iron axe',         level: 'L2', target: 'iron_axe',        count: 1 },
    { slug: 'craft/iron_helmet',     goal: 'craft an iron helmet',      level: 'L2', target: 'iron_helmet',     count: 1 },
    { slug: 'craft/iron_boots',      goal: 'craft iron boots',          level: 'L2', target: 'iron_boots',      count: 1 },
    { slug: 'craft/furnace',         goal: 'craft a furnace',           level: 'L2', target: 'furnace',         count: 1 },
    { slug: 'collect/gold_ore',      goal: 'collect gold ore',          level: 'L2', target: 'raw_gold',        count: 1 },
    { slug: 'craft/stone_sword',     goal: 'craft a stone sword',       level: 'L2', target: 'stone_sword',     count: 1 },

    // L3 — complex dependency chains
    { slug: 'craft/iron_chestplate', goal: 'craft an iron chestplate',  level: 'L3', target: 'iron_chestplate', count: 1 },
    { slug: 'craft/bucket',          goal: 'craft a bucket',            level: 'L3', target: 'bucket',          count: 1 },
    { slug: 'craft/bow',             goal: 'craft a bow',               level: 'L3', target: 'bow',             count: 1 },
    { slug: 'collect/diamond',       goal: 'collect diamonds',          level: 'L3', target: 'diamond',         count: 1 },
];

/**
 * Raw materials to pre-give the bot before each CRAFT task.
 * This isolates planning quality from world-environment variability.
 * Includes slight surplus to handle planner over-spending.
 *
 * For COLLECT tasks this map has no entry — the bot gathers naturally.
 */
const TASK_SEED_MATERIALS = {
    'craft/wooden_sword':    ['oak_log 4'],
    'craft/crafting_table':  ['oak_log 4'],
    'craft/iron_pickaxe':    ['iron_ingot 5', 'oak_log 4'],
    'craft/iron_axe':        ['iron_ingot 5', 'oak_log 4'],
    'craft/iron_helmet':     ['iron_ingot 7'],
    'craft/iron_boots':      ['iron_ingot 6'],
    'craft/furnace':         ['cobblestone 10'],
    'craft/stone_sword':     ['cobblestone 6', 'oak_log 4'],
    'craft/iron_chestplate': ['iron_ingot 10'],
    'craft/bucket':          ['iron_ingot 5'],
    'craft/bow':             ['stick 6', 'string 4', 'oak_log 2'],
};

// ── CLI ───────────────────────────────────────────────────────────────────────

const argv = yargs(hideBin(process.argv))
    .option('condition', {
        type: 'string',
        choices: ['no_retrieval', 'bm25_retrieval', 'saer_cold'],
        demandOption: true,
        describe: 'Retrieval condition to evaluate',
    })
    .option('task', {
        type: 'string',
        describe: 'Single task slug (e.g. craft/iron_axe)',
    })
    .option('all', {
        type: 'boolean',
        default: false,
        describe: 'Run all 15 tasks',
    })
    .option('level', {
        type: 'string',
        choices: ['L1', 'L2', 'L3'],
        describe: 'Run tasks at this level only',
    })
    .option('timeout', {
        type: 'number',
        default: 180000,
        describe: 'Timeout per task in ms (default: 3 minutes)',
    })
    .option('profile', {
        type: 'string',
        default: 'live_eval_profile.json',
        describe: 'Agent profile JSON file (relative to project root)',
    })
    .help()
    .parseSync();

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16).replace('T', '_');
}

function getTasks() {
    if (argv.task) {
        const t = LIVE_TASKS.find(t => t.slug === argv.task);
        if (!t) { console.error(`Unknown task: ${argv.task}`); process.exit(1); }
        return [t];
    }
    if (argv.level) return LIVE_TASKS.filter(t => t.level === argv.level);
    if (argv.all) return [...LIVE_TASKS];
    console.error('Specify --task <slug>, --level <L1|L2|L3>, or --all');
    process.exit(1);
}

/**
 * Check bot inventory for the target item.
 * Accepts raw_iron / iron_ingot variants, raw_gold / gold_ingot, etc.
 */
function checkInventory(bot, targetItem, requiredCount) {
    const items = bot.inventory.items();
    let found = 0;
    for (const item of items) {
        if (item.name === targetItem ||
            item.name === targetItem.replace('raw_', '') ||
            item.name === targetItem + '_ingot') {
            found += item.count;
        }
    }
    return { found, success: found >= requiredCount };
}

/**
 * Wait for the bot's spawn event with a timeout.
 */
function waitForSpawn(agent, timeoutMs = 35000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Bot spawn timed out after ' + timeoutMs + 'ms'));
        }, timeoutMs);

        agent.bot.once('spawn', () => {
            clearTimeout(timer);
            // Give agent's internal spawn handler time to complete
            setTimeout(resolve, 3000);
        });
    });
}

/**
 * Configure the FewShotLearning instance for the given eval condition.
 * Overrides selectRelevantExamples() directly on the instance.
 *
 * @param {object} fsl      - FewShotLearning instance
 * @param {string} condition
 * @param {Array}  examples - training examples (for BM25 indexing)
 */
function configureCondition(fsl, condition, examples) {
    if (!fsl._origSelectRelevantExamples) {
        fsl._origSelectRelevantExamples = fsl.selectRelevantExamples.bind(fsl);
    }

    switch (condition) {
        case 'no_retrieval':
            fsl.selectRelevantExamples = () => [];
            console.log('[live_eval] Condition: no_retrieval — zero examples in prompt');
            break;

        case 'bm25_retrieval': {
            const retriever = new BM25Retriever(examples);
            fsl.selectRelevantExamples = (_examples, count, userInput) =>
                retriever.search(userInput || '', count);
            console.log(`[live_eval] Condition: bm25_retrieval — BM25 k=3, corpus=${examples.length}`);
            break;
        }

        case 'saer_cold':
            fsl.selectRelevantExamples = fsl._origSelectRelevantExamples;
            fsl.saerEnabled = true;
            console.log('[live_eval] Condition: saer_cold — SAER cold-start weights');
            break;

        default:
            throw new Error(`Unknown condition: ${condition}`);
    }
}

/**
 * Pre-seed the bot's inventory via /give for craft tasks.
 * Returns the list of items given (for logging).
 */
async function seedInventory(bot, taskSlug) {
    const materials = TASK_SEED_MATERIALS[taskSlug];
    if (!materials || materials.length === 0) return [];

    console.log(`[live_eval] Pre-seeding inventory for ${taskSlug}:`);
    for (const mat of materials) {
        const cmd = `/give @s ${mat}`;
        console.log(`  ${cmd}`);
        bot.chat(cmd);
        await new Promise(r => setTimeout(r, 400));
    }
    // Wait for inventory packets to arrive
    await new Promise(r => setTimeout(r, 1000));
    return materials;
}

// ── Main evaluation loop ──────────────────────────────────────────────────────

async function runTask(agent, task, condition, timeoutMs) {
    const bot = agent.bot;
    const startTime = Date.now();

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`[live_eval] Task: ${task.slug} (${task.level})`);
    console.log(`[live_eval] Goal: "${task.goal}"`);
    console.log(`[live_eval] Target: ${task.count}× ${task.target}`);

    const inv0 = bot.inventory.items().map(i => `${i.name}×${i.count}`).join(', ') || '(empty)';
    console.log(`[live_eval] Inventory before: ${inv0}`);

    let taskDone = false;
    let taskError = null;

    const taskPromise = agent.handleMessage('EvalUser', task.goal)
        .then(() => { taskDone = true; })
        .catch(err => { taskError = err; taskDone = true; });

    await Promise.race([
        taskPromise,
        new Promise(resolve => setTimeout(resolve, timeoutMs)),
    ]);

    const timedOut = !taskDone;

    if (timedOut) {
        console.log('[live_eval] Timeout reached — cancelling bot actions');
        try { await agent.actions.stop(); } catch (_) {}
        await new Promise(r => setTimeout(r, 500));
    }

    if (taskError) {
        console.error(`[live_eval] Task error: ${taskError.message}`);
    }

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    const { found, success } = checkInventory(bot, task.target, task.count);
    const inventoryAfter = bot.inventory.items()
        .map(i => `${i.name}×${i.count}`)
        .join(', ') || '(empty)';

    console.log(`[live_eval] Inventory after:  ${inventoryAfter}`);
    console.log(`[live_eval] Target item found: ${found} / ${task.count} required`);
    console.log(`[live_eval] Result: ${success ? '✓ PASS' : '✗ FAIL'} (${elapsedSec}s${timedOut ? ', TIMED OUT' : ''})`);

    return {
        slug: task.slug,
        level: task.level,
        goal: task.goal,
        target: task.target,
        required_count: task.count,
        found_count: found,
        success,
        timed_out: timedOut,
        elapsed_sec: parseFloat(elapsedSec),
        condition,
    };
}

async function main() {
    const tasks = getTasks();
    const condition = argv.condition;
    const timestamp = formatTimestamp();

    console.log('='.repeat(60));
    console.log('SAER Live Bot Evaluation');
    console.log(`Condition: ${condition}`);
    console.log(`Tasks: ${tasks.length} (${tasks.map(t => t.level).join(', ')})`);
    console.log(`Timeout: ${argv.timeout / 1000}s per task`);
    console.log('='.repeat(60));

    // ── Load training examples ────────────────────────────────────────────────

    const craftingExamples = JSON.parse(
        readFileSync(join(PROJECT_ROOT, 'data/training/crafting_examples.json'), 'utf8')
    );
    const collectingExamples = JSON.parse(
        readFileSync(join(PROJECT_ROOT, 'data/training/collecting_examples.json'), 'utf8')
    );

    // ── Start agent ───────────────────────────────────────────────────────────

    const profilePath = join(PROJECT_ROOT, argv.profile);
    if (!existsSync(profilePath)) {
        console.error(`Profile not found: ${profilePath}`);
        process.exit(1);
    }
    console.log(`\n[live_eval] Starting agent (profile: ${argv.profile})...`);

    const agent = new Agent();
    await agent.start(profilePath, false, null, 0);

    console.log('[live_eval] Waiting for bot to spawn in Minecraft...');
    await waitForSpawn(agent);

    const bot = agent.bot;
    console.log(`[live_eval] Bot spawned ✓ (gamemode: ${bot.game?.gameMode || 'unknown'})`);

    // ── Verify enhancer pipeline ──────────────────────────────────────────────

    const fsl = agent?.prompter?.enhancer?.fewShotLearning;
    if (!fsl) {
        console.error('[live_eval] FewShotLearning not found — check profile has implicit_enhancer');
        process.exit(1);
    }

    // ── World setup: survival + peaceful (no mobs, no hunger drain) ───────────
    // Must run BEFORE tasks. Bot needs op for these commands.
    console.log('[live_eval] Configuring world: survival mode + peaceful difficulty...');
    try {
        bot.chat('/gamemode survival @s');   // put bot in survival (collectBlocks works)
        await new Promise(r => setTimeout(r, 600));
        bot.chat('/difficulty peaceful');    // no mobs, no hunger
        await new Promise(r => setTimeout(r, 600));
        bot.chat('/gamerule doMobSpawning false');
        await new Promise(r => setTimeout(r, 600));
        // Give bot some food (not strictly needed in peaceful, but safety margin)
        bot.chat('/give @s cooked_beef 16');
        await new Promise(r => setTimeout(r, 600));
    } catch (_) {}
    console.log(`[live_eval] Bot gamemode: ${bot.game?.gameMode || 'unknown'}`);

    // ── Run tasks ─────────────────────────────────────────────────────────────

    const results = [];

    for (const task of tasks) {
        // Reconfigure condition per task (BM25 pool differs by category)
        const pool = task.slug.startsWith('craft') ? craftingExamples : collectingExamples;
        configureCondition(fsl, condition, pool);

        const result = await runTask(agent, task, condition, argv.timeout);
        results.push(result);

        // Reset between tasks
        // 1. Force-clear task manager so next task can start immediately
        try {
            const tm = agent?.prompter?.enhancer?.taskManager;
            if (tm) {
                tm.taskStack = [];
                tm.currentTask = null;
            }
        } catch (_) {}
        // 2. Clear inventory via server command
        try { bot.chat('/clear @s'); } catch (_) {}
        console.log('[live_eval] Waiting between tasks...');
        await new Promise(r => setTimeout(r, 3000));
    }

    // ── Summary ───────────────────────────────────────────────────────────────

    const passed = results.filter(r => r.success).length;
    const total = results.length;
    const tcr = (passed / total * 100).toFixed(1);

    const byLevel = {};
    for (const r of results) {
        if (!byLevel[r.level]) byLevel[r.level] = { pass: 0, total: 0 };
        byLevel[r.level].total++;
        if (r.success) byLevel[r.level].pass++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`RESULTS — ${condition}`);
    console.log('='.repeat(60));
    console.log(`Overall TCR: ${passed}/${total} (${tcr}%)`);
    for (const [level, s] of Object.entries(byLevel)) {
        console.log(`  ${level}: ${s.pass}/${s.total} (${(s.pass / s.total * 100).toFixed(0)}%)`);
    }
    console.log('='.repeat(60));

    // ── Save results ──────────────────────────────────────────────────────────

    if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });

    const jsonPath = join(RESULTS_DIR, `live_eval_${timestamp}_${condition}.json`);
    writeFileSync(jsonPath, JSON.stringify({
        condition,
        timestamp,
        tasks: results,
        summary: { passed, total, tcr: parseFloat(tcr), by_level: byLevel },
    }, null, 2));

    const mdLines = [
        `# Live Bot Evaluation — ${condition}`,
        `**Date**: ${new Date().toISOString().split('T')[0]}`,
        `**Overall TCR**: ${passed}/${total} (${tcr}%)`,
        `**Note**: Craft tasks use pre-seeded raw materials; collect tasks gather from world.`,
        '',
        '## Per-Level Summary',
        '| Level | Pass | Total | % |',
        '|-------|------|-------|---|',
        ...Object.entries(byLevel).map(([l, s]) =>
            `| ${l} | ${s.pass} | ${s.total} | ${(s.pass / s.total * 100).toFixed(0)}% |`),
        '',
        '## Per-Task Results',
        '| Task | Level | Target | Found | Pass | Time(s) | Timeout |',
        '|------|-------|--------|-------|------|---------|---------|',
        ...results.map(r =>
            `| ${r.slug} | ${r.level} | ${r.required_count}× ${r.target} | ${r.found_count} | ${r.success ? '✓' : '✗'} | ${r.elapsed_sec} | ${r.timed_out ? 'Yes' : 'No'} |`),
    ];

    const mdPath = join(RESULTS_DIR, `live_eval_${timestamp}_${condition}_report.md`);
    writeFileSync(mdPath, mdLines.join('\n'));

    console.log(`\nJSON : ${jsonPath}`);
    console.log(`Report: ${mdPath}`);

    process.exit(0);
}

main().catch(err => {
    console.error('[live_eval] Fatal:', err.message, err.stack);
    process.exit(1);
});
