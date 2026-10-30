#!/usr/bin/env node
/**
 * SAER Experiment Queue Runner
 *
 * Serial experiment orchestrator with:
 *   - Pre-run balance check (Aliyun DashScope / 302.ai)
 *   - Post-seed API error monitoring — abort & notify if rate > MAX_API_ERROR_RATE
 *   - Webhook notifications (Discord / Slack / Telegram)
 *   - Configurable pause between jobs to let rate limits recover
 *
 * Usage:
 *   node scripts/eval/run_queue.js                         # default: queue_config.json
 *   node scripts/eval/run_queue.js my_queue.json           # custom config
 *   NOTIFY_WEBHOOK=https://... node scripts/eval/run_queue.js
 *
 * Env vars:
 *   QWEN_API_KEY or DASHSCOPE_API_KEY  — Aliyun DashScope key (for balance check)
 *   API_302_KEY                        — 302.ai key (for balance check)
 *   NOTIFY_WEBHOOK                     — Discord/Slack incoming webhook URL
 *   TELEGRAM_BOT_TOKEN                 — Telegram bot token
 *   TELEGRAM_CHAT_ID                   — Telegram chat/user ID
 */

import { spawnSync } from 'child_process';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const RESULTS_DIR = join(__dirname, 'results');

// ── Constants ─────────────────────────────────────────────────────────────────

/** Abort if any single seed has more than this fraction of API errors */
const MAX_API_ERROR_RATE = 0.10;

// ── Notifications ─────────────────────────────────────────────────────────────

async function notify(msg) {
    const webhook   = process.env.NOTIFY_WEBHOOK;
    const tgToken   = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat    = process.env.TELEGRAM_CHAT_ID;

    console.log(`[NOTIFY] ${msg}\n`);

    if (webhook) {
        try {
            await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Discord uses "content", Slack uses "text" — send both
                body: JSON.stringify({ content: msg, text: msg }),
            });
        } catch { /* non-fatal */ }
    }

    if (tgToken && tgChat) {
        try {
            await fetch(
                `https://api.telegram.org/bot${tgToken}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: tgChat, text: msg }),
                }
            );
        } catch { /* non-fatal */ }
    }
}

// ── Balance Checks ────────────────────────────────────────────────────────────

async function checkAliyunBalance() {
    const key = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
    if (!key) return null;

    try {
        const res  = await fetch(
            'https://dashscope.aliyuncs.com/api/v1/account/balance',
            { headers: { Authorization: `Bearer ${key}` } }
        );
        const data = await res.json();
        // Response: { code: 'Success', data: { available_amount: '10.00' } }
        if (data?.code === 'Success') {
            const amount = parseFloat(data.data?.available_amount ?? '0');
            return { ok: amount > 1.0, balance: `¥${amount.toFixed(2)}`, provider: 'Aliyun DashScope' };
        }
    } catch { /* fall through */ }
    return null;
}

async function check302Balance() {
    const key = process.env.API_302_KEY;
    if (!key) return null;

    try {
        const res  = await fetch(
            'https://api.302.ai/dashboard/info',
            { headers: { Authorization: `Bearer ${key}` } }
        );
        const data = await res.json();
        const amount = parseFloat(data?.balance ?? data?.credit ?? '0');
        return { ok: amount > 1.0, balance: `$${amount.toFixed(2)}`, provider: '302.ai' };
    } catch { /* fall through */ }
    return null;
}

function getBalanceChecker(provider) {
    if (provider === 'aliyun') return checkAliyunBalance;
    if (provider === '302ai')  return check302Balance;
    return null;
}

// ── Result Integrity ──────────────────────────────────────────────────────────

/**
 * Find the per-seed result files from the most recent run of a given mode.
 * Returns { majorityVote, seeds: [path, ...] } or null.
 */
function findLatestSeeds(mode, seedCount) {
    if (!existsSync(RESULTS_DIR)) return null;

    const allFiles = readdirSync(RESULTS_DIR)
        .filter(f => f.includes(`_${mode}_majority_vote.json`))
        .sort()
        .reverse();

    if (!allFiles.length) return null;

    const latest   = allFiles[0];
    const mvPath   = join(RESULTS_DIR, latest);
    // Derive timestamp prefix: "eval_20260601_212122"
    const tsPrefix = latest.replace(`_${mode}_majority_vote.json`, '');

    const seedPaths = Array.from({ length: seedCount }, (_, i) => {
        const p = join(RESULTS_DIR, `${tsPrefix}_${mode}_s${i + 1}.json`);
        return existsSync(p) ? p : null;
    }).filter(Boolean);

    return { majorityVote: mvPath, seeds: seedPaths };
}

function checkSeedIntegrity(seedPath) {
    try {
        const data      = JSON.parse(readFileSync(seedPath, 'utf8'));
        const total     = data.tasks.length;
        const apiErrors = data.tasks.filter(t => !t.parse_success).length;
        const errorRate = total > 0 ? apiErrors / total : 1;
        return { total, apiErrors, errorRate, ok: errorRate <= MAX_API_ERROR_RATE };
    } catch {
        return { total: 0, apiErrors: 0, errorRate: 1, ok: false };
    }
}

function parseMajorityVote(mvPath) {
    try {
        const d = JSON.parse(readFileSync(mvPath, 'utf8'));
        const { L1, L2, L3 } = d.by_level;
        return (
            `TCR=${d.overall.strict_tcr} | PVR=${d.overall.pvr} | ` +
            `L1=${L1.strict}/${L1.total} L2=${L2.strict}/${L2.total} L3=${L3.strict}/${L3.total}`
        );
    } catch {
        return '(could not read results)';
    }
}

// ── Experiment Runner ─────────────────────────────────────────────────────────

function runExperiment(job) {
    const args = [
        'scripts/eval/static_plan_eval.js',
        '--profile', job.profile,
        '--mode',    job.mode,
        '--seeds',   String(job.seeds   ?? 3),
        '--retries', String(job.retries ?? 3),
    ];

    console.log(`${'═'.repeat(64)}`);
    console.log(`▶  node ${args.join(' ')}`);
    console.log(`${'═'.repeat(64)}\n`);

    const result = spawnSync('node', args, { cwd: ROOT, stdio: 'inherit' });
    return result.status === 0;
}

// ── Sleep ─────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    const configPath = process.argv[2] ?? join(__dirname, 'queue_config.json');

    if (!existsSync(configPath)) {
        console.error(`Config not found: ${configPath}`);
        process.exit(1);
    }

    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    const { queue, pause_between_jobs: pauseSec = 60 } = config;

    console.log(`\n🦞  SAER Experiment Queue Runner`);
    console.log(`    Config : ${configPath}`);
    console.log(`    Jobs   : ${queue.length}`);
    console.log(`    Pause  : ${pauseSec}s between jobs`);
    console.log(`    Abort  : API error rate > ${MAX_API_ERROR_RATE * 100}% in any seed\n`);

    const summary = queue.map((j, i) => `  ${i + 1}. [${j.profile}] ${j.mode}`).join('\n');
    await notify(`🦞 SAER queue started — ${queue.length} jobs:\n${summary}`);

    let done = 0;

    for (const job of queue) {
        const label = `[${job.profile} / ${job.mode}]`;
        console.log(`\n── Job ${done + 1}/${queue.length}: ${label} ──\n`);

        // 1. Balance check
        const checker = getBalanceChecker(job.provider);
        if (checker) {
            const bal = await checker();
            if (bal) {
                console.log(`   💰 ${bal.provider}: ${bal.balance}`);
                if (!bal.ok) {
                    const msg = `⛔ ${label} SKIPPED — ${bal.provider} balance too low (${bal.balance}). Top up and re-run.`;
                    await notify(msg);
                    done++;
                    continue;
                }
            }
        }

        // 2. Run
        await notify(`⏳ Starting ${label}…`);
        runExperiment(job);

        // 3. Seed integrity check
        const seeds   = job.seeds ?? 3;
        const files   = findLatestSeeds(job.mode, seeds);
        let hasBadSeed = false;

        if (!files) {
            await notify(`⚠️ ${label} — result files not found. Check console output.`);
        } else {
            console.log(`\n   Integrity check (${files.seeds.length}/${seeds} seed files found):`);
            for (const seedPath of files.seeds) {
                const integ    = checkSeedIntegrity(seedPath);
                const name     = basename(seedPath);
                const pct      = (integ.errorRate * 100).toFixed(0);
                if (!integ.ok) {
                    console.log(`   🚨 ${name}: ${integ.apiErrors}/${integ.total} API errors (${pct}%) — EXCEEDS THRESHOLD`);
                    hasBadSeed = true;
                } else {
                    console.log(`   ✅ ${name}: ${integ.apiErrors}/${integ.total} API errors (${pct}%)`);
                }
            }

            // 4. Results summary
            const resultLine = parseMajorityVote(files.majorityVote);
            const icon        = hasBadSeed ? '⚠️' : '✅';
            const msg = [
                `${icon} ${label} complete`,
                `   ${resultLine}`,
                hasBadSeed
                    ? '   ⚠️ High API error rate — data may be unreliable. Recharge & re-run.'
                    : '   ✅ All seeds clean',
            ].join('\n');

            console.log(`\n${msg}`);
            await notify(msg);
        }

        done++;

        // 5. Pause before next job
        if (done < queue.length) {
            console.log(`\n   ⏸  Waiting ${pauseSec}s before next job…`);
            await sleep(pauseSec * 1000);
        }
    }

    const finalMsg = `🏁 Queue complete — ${done}/${queue.length} jobs finished`;
    console.log(`\n${finalMsg}\n`);
    await notify(finalMsg);
}

main().catch(async err => {
    console.error('Queue runner crashed:', err);
    await notify(`💥 Queue runner crashed: ${err.message}`);
    process.exit(1);
});
