#!/usr/bin/env node
/**
 * live_eval_harness.js
 *
 * Automated live-bot evaluation for the 20-task livebot experiment.
 * Loops task × condition × seed, resets the Minecraft world via RCON
 * before each trial, then runs the bot and logs results.
 *
 * Prerequisites:
 *   - Minecraft 1.20.4 server running with RCON enabled
 *   - Bot account credentials configured in lucy.json
 *   - `npm install rcon-client` (already done)
 *
 * Usage:
 *   node scripts/eval/live_eval_harness.js
 *   node scripts/eval/live_eval_harness.js --conditions no_retrieval,saer_cold
 *   node scripts/eval/live_eval_harness.js --tasks craft/iron_helmet,craft/anvil
 *   node scripts/eval/live_eval_harness.js --seeds 1 --timeout 180000
 *   node scripts/eval/live_eval_harness.js --dry-run     # RCON only, no bot
 *   node scripts/eval/live_eval_harness.js --skip-rcon   # skip RCON, manually place materials
 *
 * Output: scripts/eval/results/live_eval_results_run3_searchfor-fix.jsonl
 *   One JSON line per completed trial: { task, condition, seed, success, reason, durationMs, ts }
 */

import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { connectRcon, setupEnvironment } from './rcon_setup.js';
import { Agent } from '../../src/agent/agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..');

// ─── Model → Profile mapping ───────────────────────────────────────
const MODEL_PROFILES = {
    'qwen3-8b':   'profiles/qwen3-8b_openrouter.json',
    'qwen-max':   'max.json',
    'gemma4-31b': 'profiles/gemma4_31b_eval.json',
    'gpt-4o':     'profiles/gpt4o_eval.json',
    'deepseek':   'profiles/deepseek_live.json',
};

// Cold-start SAER weights (mirror COLD_START_WEIGHTS in saer_scorer.js). Pinned
// for the live saer_cold condition because rcon_setup stages a pickaxe + fuel, so
// the bot's inventory is non-empty at retrieval time. Without pinning, SAER's
// _isColdStart() would return false and silently switch to DEFAULT weights
// (miningTierGap=0.20), breaking parity with the static saer_cold benchmark and
// activating the inventory-aware dimension we deliberately keep at zero this cycle.
const SAER_COLD_WEIGHTS = { ingredient: 0.50, keyword: 0.35, miningTierGap: 0.00, level: 0.15 };

// ─── CLI ───────────────────────────────────────────────────────────

const argv = yargs(hideBin(process.argv))
    .option('conditions', {
        type: 'string',
        default: 'no_retrieval,saer_cold',
        describe: 'Comma-separated conditions to run',
    })
    .option('tasks', {
        type: 'string',
        default: '',
        describe: 'Comma-separated task slugs to filter (empty = all 18)',
    })
    .option('seeds', {
        type: 'number',
        default: 3,
        describe: 'Number of independent trials per task × condition (pass@k, k=seeds)',
    })
    .option('timeout', {
        type: 'number',
        default: 300000,
        describe: 'Timeout per trial in ms (default 5 min)',
    })
    .option('model', {
        type: 'string',
        default: 'qwen-max',
        describe: `Model label for this run. Options: ${Object.keys(MODEL_PROFILES).join(', ')}`,
    })
    .option('profile', {
        type: 'string',
        default: '',
        describe: 'Override profile file path (relative to project root). Takes precedence over --model.',
    })
    .option('dry-run', {
        type: 'boolean',
        default: false,
        describe: 'Only run RCON setup (no bot), to verify world staging',
    })
    .option('resume', {
        type: 'boolean',
        default: false,
        describe: 'Skip trials already present in the results file',
    })
    .option('skip-rcon', {
        type: 'boolean',
        default: false,
        describe: 'Skip RCON entirely — you must manually place materials near spawn before each trial',
    })
    .option('no-repair', {
        type: 'boolean',
        default: false,
        describe: 'Set enhancer.disableGapRepair=true — skip _repairPlanGaps at plan-generation time so no_retrieval is not silently patched before execution (see implicit_enhancer_v2.js generateExecutionPlan())',
    })
    .option('run-tag', {
        type: 'string',
        default: 'run5_planB',
        describe: 'Results-file tag → results/live_eval_results_<tag>.jsonl. Use a fresh tag (e.g. run6) to re-run without touching prior canonical results.',
    })
    .help()
    .parseSync();

// ─── Config ────────────────────────────────────────────────────────

const MANIFEST_PATH  = join(__dirname, 'livebot_manifest.json');
const RESULTS_DIR    = join(__dirname, 'results');
// run5: Plan-B scoring (prereq-chain completion, terminal craft excluded) +
// interleaved conditions (balances bot-degradation across no_ret/saer) +
// staging parity fix (stone+cobblestone staged for all tasks).
const RUN_TAG        = argv['run-tag'];
const RESULTS_PATH   = join(RESULTS_DIR, `live_eval_results_${RUN_TAG}.jsonl`);
const EVAL_LOG_PATH  = join(RESULTS_DIR, `live_eval_log_${RUN_TAG}.jsonl`);

const manifest   = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const CONDITIONS = argv.conditions.split(',').map(s => s.trim());
const SEEDS      = argv.seeds;
const TIMEOUT_MS = argv.timeout;
const SPAWN      = manifest.config.spawn;
const RCON_CFG   = manifest.config.rcon;

// Resolve model label and profile path
const MODEL_LABEL  = argv.model;
const PROFILE_FILE = argv.profile || MODEL_PROFILES[MODEL_LABEL];
if (!PROFILE_FILE) {
    console.error(`Unknown --model "${MODEL_LABEL}". Valid options: ${Object.keys(MODEL_PROFILES).join(', ')}`);
    process.exit(1);
}

if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });

// ─── Task filtering ────────────────────────────────────────────────

function getTaskList() {
    let tasks = manifest.tasks;
    if (argv.tasks) {
        const filter = new Set(argv.tasks.split(',').map(s => s.trim()));
        tasks = tasks.filter(t => filter.has(t.slug));
        if (tasks.length === 0) {
            console.error(`No tasks matched filter: ${argv.tasks}`);
            process.exit(1);
        }
    }
    return tasks;
}

// ─── Checkpoint (--resume) ─────────────────────────────────────────

function loadCompletedTrials() {
    const done = new Set();
    if (!argv.resume || !existsSync(RESULTS_PATH)) return done;
    const lines = readFileSync(RESULTS_PATH, 'utf8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
        try {
            const { model, task, condition, seed } = JSON.parse(line);
            done.add(`${model || 'unknown'}||${task}||${condition}||${seed}`);
        } catch { /* skip corrupt lines */ }
    }
    return done;
}

// ─── Condition configuration ───────────────────────────────────────

/**
 * Apply retrieval condition to the FewShotLearning module.
 * Must be called after agent is initialized.
 */
function applyCondition(enhancer, condition) {
    const fsl = enhancer.fewShotLearning;
    if (!fsl) throw new Error('Enhancer has no fewShotLearning module');

    // Live-eval path: disable LLM step recovery for BOTH conditions (symmetric).
    // The framework must never repair a plan gap (missing tool/item the plan never
    // produced) — otherwise it would mask the L2 plan-quality signal SAER is meant
    // to fix, dirtying static↔live correspondence. It only fixes execution noise.
    // See docs/decisions/live-self-correction-bounded-deterministic.md
    enhancer.deterministicRecovery = true;
    if (argv['no-repair']) enhancer.disableGapRepair = true;

    switch (condition) {
        case 'no_retrieval':
            fsl.saerEnabled    = false;
            fsl.retrievalMode  = 'none';
            break;
        case 'bm25':
            fsl.saerEnabled    = false;
            fsl.retrievalMode  = 'bm25';
            break;
        case 'saer_cold':
            fsl.saerEnabled    = true;
            fsl.retrievalMode  = 'saer';
            // Pin cold-start weights so staged tools (pickaxe/fuel) in the bot's
            // inventory do not flip SAER to DEFAULT (inventory-aware) weights —
            // keeps parity with the static saer_cold benchmark for clean
            // task-level static↔live correspondence.
            fsl.setWeights(SAER_COLD_WEIGHTS, SAER_COLD_WEIGHTS);
            break;
        default:
            throw new Error(`Unknown condition: ${condition}`);
    }
    console.log(`[harness] Condition set: ${condition} (retrievalMode=${fsl.retrievalMode})`);
}

// ─── Agent ────────────────────────────────────────────────────────

async function initAgent() {
    const profilePath = join(PROJECT_ROOT, PROFILE_FILE);
    if (!existsSync(profilePath)) {
        console.error(`Profile not found: ${profilePath}`);
        process.exit(1);
    }
    const agent = new Agent();

    // Eval guard: the MINDcraft framework calls agent.cleanKill() on certain
    // conditions — most notably the "unstuck" mode (modes.js) which does
    // process.exit(1) if the bot can't unstick within 10s. In the live harness
    // that would kill the ENTIRE run (all remaining trials lost) just because
    // one trial's bot got stuck. Override cleanKill to throw instead: the throw
    // propagates up through sendRequest → runTrial's try/catch, which records
    // the trial as failed and the harness continues with the next trial.
    // (Confirmed root cause: server log showed `<Max> Exiting.` + exit 1 at
    // iron_helmet's final craft step = cleanKill from stuck-unstuck timeout.)
    agent.cleanKill = function (msg = 'cleanKill invoked', code = 1) {
        // Eval guard: MINDcraft calls cleanKill (→ process.exit) from several places:
        //   - modes.js unstuck timer ("Got stuck and couldn't get unstuck")
        //   - actions.js:261 inventory-refresh timer ("Safely restarting to update inventory")
        //   - actions.js:27 action refused stop, agent.js:411/419 bot disconnect/kick
        // In the live harness these would kill the ENTIRE run (all remaining trials
        // lost). We MUST NOT throw here either: some callers invoke cleanKill from a
        // setTimeout callback (actions.js:261), where a throw becomes an
        // uncaughtException and still crashes the process. So make it a no-op + log.
        // Trade-off: the bot no longer self-restarts to refresh inventory, but the
        // harness's own 400ms post-craft/collect sync wait (executeStep) + verify
        // retry (_verifyTaskCompletion) keep inventory reads accurate without a restart.
        console.error(`[harness] agent.cleanKill intercepted (eval no-op): ${msg}`);
    };

    console.log(`[harness] Initializing agent from ${argv.profile}…`);
    await agent.start(profilePath, false, null, 0);
    console.log('[harness] Agent connected to MC server.');
    return agent;
}

function getEnhancer(agent) {
    const enhancer = agent?.prompter?.enhancer;
    if (!enhancer) throw new Error('Agent has no enhancer. Ensure profile uses implicit_enhancer.');
    return enhancer;
}

// ─── Outcome scoring ───────────────────────────────────────────────

/** Sum a bot's inventory into a name→count Map (tolerates a mid-action bot). */
function botInventoryMap(bot) {
    const m = new Map();
    try {
        if (bot?.inventory?.items) {
            for (const it of bot.inventory.items()) m.set(it.name, (m.get(it.name) || 0) + it.count);
        }
    } catch { /* bot mid-action — return what we have */ }
    return m;
}

/**
 * ponytail: RCON `/clear @a` is server-authoritative and ack'd immediately,
 * but the bot's own client-side bot.inventory cache only updates once ITS
 * protocol connection receives the resulting window/inventory packet — a
 * separate, unsynced channel. Without waiting, generateExecutionPlan()'s
 * pruneSteps can read a stale pre-clear inventory snapshot and wrongly mark
 * craft steps "already satisfied" (observed live: crafting_table +
 * wooden_pickaxe both skipped on a freshly-cleared, actually-empty-inventory
 * trial, cascading into "missing tool" failures a few steps later). Poll for
 * the client-side inventory to actually reflect empty before planning starts.
 */
async function waitForEmptyInventory(bot, maxWaitMs = 2000, pollMs = 100) {
    if (!bot?.inventory) return;
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
        if (bot.inventory.items().length === 0) return;
        await sleep(pollMs);
    }
}

/**
 * Plan-B signal: has the agent assembled the goal item's direct crafting
 * ingredients? If so it completed the full prerequisite chain (the L2/L3
 * multi-hop knowledge under test) and only the terminal craft remains — the
 * exact step contaminated by the mineflayer #3906 window-resync race. Returns
 * true if ANY recipe variant is satisfiable by current inventory.
 *
 * Non-craftable goals (collect tasks: gravel/pumpkin) have no recipe and no
 * terminal-craft bug, so they return false here — strict completion is the
 * right metric for them and we never inflate it.
 *
 * NEVER overrides strict `success`; reported as a separate, labelled metric.
 */
function goalPrereqsAssembled(enhancer, goalItem) {
    const recipes = enhancer.recipeResolver?.craftingRecipesFor?.(goalItem);
    if (!recipes || recipes.length === 0) return false;
    const inv = botInventoryMap(enhancer.agent?.bot);
    return recipes.some(r => r.ingredients.every(ing => (inv.get(ing.name) || 0) >= ing.count));
}

// ─── Single trial ──────────────────────────────────────────────────

async function runTrial(enhancer, task, condition, seed) {
    const startMs = Date.now();

    // Configure eval mode: TaskManager will log success/fail after
    // _verifyTaskCompletion() checks bot.inventory for goal_item.
    enhancer.taskManager.enableEvalMode(EVAL_LOG_PATH, {
        mode:        condition,
        taskSlug:    task.slug,
        level:       task.level,
        seed,
        targetItem:  task.goal_item,
        targetCount: task.goal_count,
    });

    // Race: sendRequest vs timeout.
    // enhancer.sendRequest(model, turns, systemPrompt) is the FULL task-execution
    // entry — internally getIntent → generateExecutionPlan → pushTask →
    // taskManager.run() to completion. `turns` MUST be a message array so getIntent
    // can extract the user request; passing the bare prompt string left turns
    // undefined and crashed inside getIntent (cannot read .content of undefined).
    const result = await Promise.race([
        enhancer.sendRequest(
            enhancer.model,
            [{ role: 'user', content: task.prompt }],
            ''
        ).then(msg => ({
            timedOut: false,
            botMsg:   msg,
        })),
        new Promise(resolve =>
            setTimeout(() => resolve({ timedOut: true, botMsg: 'timeout' }), TIMEOUT_MS)
        ),
    ]);

    const durationMs = Date.now() - startMs;

    // ponytail: sendRequest's promise is abandoned here on timeout (JS can't
    // cancel a hung await) -- whatever nested action never returned can leave
    // agent.actions.executing stuck true. The per-action watchdog in actions.js
    // usually clears it first, but if the hang happens late in a plan there's
    // not always 2.5-4min left before this trial's own 300s ceiling fires. Force
    // it clear here so the NEXT trial in this process never inherits "Task
    // already in progress" from a hang this trial already gave up on (confirmed
    // live: craft/ladder seed1 timeout -> 3 subsequent trials cascade-poisoned).
    if (result.timedOut) {
        // ponytail: the FIRST fix (agent.actions.executing) targeted the wrong
        // latch -- the real blocker confirmed live (iron_helmet/cauldron/iron_door/
        // diamond_boots cascades in run7) is ImplicitEnhancer.sendRequest()'s own
        // this._isRunning guard (implicit_enhancer_v2.js:888). The abandoned
        // sendRequest() promise never reaches its finally{ this._isRunning=false }
        // block, so the next trial's sendRequest() call hits the guard and returns
        // "Task is already in progress" synchronously (durationMs 0-1, matches
        // observed cascade exactly). taskManager.currentTask is already reset by
        // the unconditional clear() below each trial -- only _isRunning was missed.
        if (enhancer.agent?.actions) {
            enhancer.agent.actions.executing = false;
            enhancer.agent.actions.currentActionLabel = '';
        }
        enhancer._isRunning = false;
    }

    // ── Strict completion (PRIMARY, honest metric: goal item obtained) ──
    // On timeout the root task did not complete, but the bot object is still
    // valid — we still run the inventory check below, because the agent may have
    // assembled everything and only the terminal craft hung (the bug we exclude
    // via Plan B). So we do NOT early-return on timeout.
    let success = false;
    let reason  = result.timedOut ? 'timeout' : result.botMsg;
    if (!result.timedOut) {
        // _verifyTaskCompletion() already ran for the completed root task.
        const rootTask = enhancer.taskManager.completedTasks.find(
            t => !t.parentTaskId && t.metadata?.taskSlug === task.slug
        );
        success = rootTask?.status === 'completed' && rootTask?.verifyResult?.success === true;
        reason  = rootTask?.verifyResult?.reason ?? rootTask?.failReason ?? result.botMsg;
    }

    // Direct inventory check (with brief poll for a late window_items resync —
    // a freshly crafted/collected item can lag bot.inventory by a few hundred ms;
    // see docs/decisions/craft-no-reclaim-table.md).
    const bot  = enhancer.agent?.bot;
    const need = task.goal_count || 1;
    const countGoal = () => bot?.inventory?.items
        ? bot.inventory.items()
            .filter(i => i.name === task.goal_item)
            .reduce((sum, i) => sum + i.count, 0)
        : -1;
    if (!success) {
        let have = countGoal();
        if (have < need) {
            for (let i = 0; i < 6 && have < need; i++) {
                await new Promise(r => setTimeout(r, 500));
                have = countGoal();
            }
        }
        if (have >= need) {
            success = true;
            reason  = `Bot has ${have}x ${task.goal_item} (direct inventory check)`;
        }
    }

    // ── Plan B (SUPPORTING metric: prerequisite-chain completion) ──
    // success ⇒ prereqComplete. Otherwise: did the agent assemble the goal's
    // direct ingredients? If yes, it executed the full multi-hop chain and only
    // the framework-race-prone terminal craft remains. Reported separately —
    // never overrides `success`, never converts a failure into a success.
    const prereqComplete = success || goalPrereqsAssembled(enhancer, task.goal_item);
    const prereqReason = success
        ? reason
        : (prereqComplete
            ? `Assembled all direct ingredients of ${task.goal_item}; terminal craft pending (framework race)`
            : reason);

    return { success, prereqComplete, reason, prereqReason, durationMs, timedOut: !!result.timedOut };
}

// ─── Main loop ─────────────────────────────────────────────────────

async function main() {
    const tasks     = getTaskList();
    const completed = loadCompletedTrials();
    const total     = tasks.length * CONDITIONS.length * SEEDS;

    console.log(`\n${'═'.repeat(64)}`);
    console.log(` Live Bot Evaluation Harness`);
    console.log(`${'═'.repeat(64)}`);
    console.log(` Model:      ${MODEL_LABEL} (${PROFILE_FILE})`);
    console.log(` Tasks:      ${tasks.length}`);
    console.log(` Conditions: ${CONDITIONS.join(', ')}`);
    console.log(` Seeds:      ${SEEDS}`);
    console.log(` Trials:     ${total}${argv.resume ? ` (${completed.size} already done)` : ''}`);
    console.log(` Timeout:    ${TIMEOUT_MS / 1000}s per trial`);
    console.log(` Dry-run:    ${argv['dry-run']}`);
    console.log(`${'═'.repeat(64)}\n`);

    // Connect RCON once (keep alive across all trials)
    let rcon = null;
    if (!argv['skip-rcon']) {
        console.log('[harness] Connecting to RCON…');
        rcon = await connectRcon(RCON_CFG);
        console.log('[harness] RCON connected.\n');
        // One-time world settings for eval: bot death must not lose items or interrupt trials
        await rcon.send('gamerule keepInventory true');
        await rcon.send('gamerule falldamage false');
        await rcon.send('difficulty peaceful');
        console.log('[harness] Gamerules set: keepInventory=true, falldamage=false, difficulty=peaceful');
    } else {
        console.log('[harness] --no-rcon: skipping RCON. Place materials manually before each trial.\n');
    }

    // Initialize agent once (unless dry-run)
    let enhancer = null;
    if (!argv['dry-run']) {
        const agent = await initAgent();
        enhancer = getEnhancer(agent);
    }

    let trialIdx = 0;
    let passCount = 0;
    let failCount = 0;

    // Loop order: task → seed → condition. Conditions are INTERLEAVED per seed
    // (no_ret seed0, saer seed0, no_ret seed1, …) so that any bot-state
    // degradation over the session hits both conditions evenly. The old order
    // (all no_ret, then all saer) systematically penalised saer_cold, which ran
    // last on the most-degraded bot. See docs review 2026-06-25.
    for (const task of tasks) {
        for (let seed = 0; seed < SEEDS; seed++) {
            for (const condition of CONDITIONS) {
                trialIdx++;
                const key = `${MODEL_LABEL}||${task.slug}||${condition}||${seed}`;

                if (completed.has(key)) {
                    console.log(`[${trialIdx}/${total}] SKIP (already done) ${task.slug} ${condition} seed=${seed}`);
                    continue;
                }

                console.log(`\n[${'─'.repeat(62)}]`);
                console.log(`[${trialIdx}/${total}] ${task.slug} | ${condition} | seed=${seed}`);
                console.log(`[${'─'.repeat(62)}]`);

                // ── RCON: stage environment ──────────────────────────────
                if (rcon) {
                    try {
                        await setupEnvironment(rcon, task, seed, SPAWN);
                        await waitForEmptyInventory(enhancer.agent?.bot);
                        console.log(`[harness] Environment staged.`);
                    } catch (err) {
                        console.error(`[harness] RCON setup failed: ${err.message}`);
                        writeResult({ model: MODEL_LABEL, task: task.slug, level: task.level, condition, seed, success: false, reason: `rcon_failed: ${err.message}`, durationMs: 0 });
                        continue;
                    }
                } else {
                    console.log(`[harness] --no-rcon: waiting 10s for manual material placement…`);
                    await sleep(10000);
                }

                if (argv['dry-run']) {
                    console.log('[harness] dry-run: skipping bot execution.');
                    continue;
                }

                // ── Configure retrieval condition ───────────────────────
                applyCondition(enhancer, condition);

                // ── Run trial ───────────────────────────────────────────
                let trialResult;
                try {
                    trialResult = await runTrial(enhancer, task, condition, seed);
                } catch (err) {
                    trialResult = { success: false, reason: `error: ${err.message}`, durationMs: 0 };
                }

                // ── Log result ──────────────────────────────────────────
                const entry = {
                    model:     MODEL_LABEL,
                    task:      task.slug,
                    level:     task.level,
                    condition,
                    seed,
                    success:        trialResult.success,
                    prereqComplete: trialResult.prereqComplete ?? trialResult.success,
                    reason:         trialResult.reason,
                    prereqReason:   trialResult.prereqReason ?? trialResult.reason,
                    timedOut:       trialResult.timedOut ?? false,
                    durationMs:     trialResult.durationMs,
                    ts:             Date.now(),
                };
                writeResult(entry);

                const t = (trialResult.durationMs / 1000).toFixed(1);
                if (trialResult.success) {
                    passCount++;
                    console.log(`[harness] ✓ SUCCESS  (${t}s)`);
                } else if (trialResult.prereqComplete) {
                    failCount++;
                    console.log(`[harness] ◑ PREREQ-ONLY (${t}s): ${trialResult.prereqReason}`);
                } else {
                    failCount++;
                    console.log(`[harness] ✗ FAIL     (${t}s): ${trialResult.reason}`);
                }

                // Clear TaskManager state before next trial
                enhancer.taskManager.clear();

                // Short pause between trials
                await sleep(2000);
            }
        }
    }

    if (rcon) rcon.end();

    console.log(`\n${'═'.repeat(64)}`);
    console.log(` Evaluation complete`);
    console.log(` Pass: ${passCount} / ${trialIdx - (argv.resume ? completed.size : 0)}`);
    console.log(` Fail: ${failCount}`);
    console.log(` Results: ${RESULTS_PATH}`);
    console.log(`${'═'.repeat(64)}\n`);

    process.exit(0);
}

// ─── Helpers ──────────────────────────────────────────────────────

function writeResult(entry) {
    appendFileSync(RESULTS_PATH, JSON.stringify(entry) + '\n', 'utf8');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
    console.error('[harness] Fatal error:', err.message);
    process.exit(1);
});
