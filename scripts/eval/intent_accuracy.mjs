/**
 * Measure getIntent() classification accuracy on the frozen 60-task benchmark.
 *
 * The supplement names this "the single most informative missing experiment for
 * deployment claims": all reported numbers use the oracle `category` field of
 * eval_tasks.json, so the deployed routing accuracy was never measured.
 *
 * This script calls the DEPLOYED classifier prompt and parser verbatim by
 * invoking ImplicitEnhancer.prototype.determineIntentType on a stub that
 * supplies only `model` and `logDebug` — no prompt is duplicated here, so the
 * measurement cannot drift from the shipped code.
 *
 * Two metrics are reported, because they answer different questions:
 *   label accuracy   — does the emitted label equal the oracle category?
 *   routing accuracy — does the emitted label load the SAME demonstration file
 *                      the oracle category loads? This is the deployment-
 *                      relevant number: CRAFT->COOK and COLLECT->EXPLORE are
 *                      label errors that route identically (post-fix), so they
 *                      cost nothing at inference time.
 *
 * Usage: node scripts/eval/intent_accuracy.mjs [--seeds 3] [--concurrency 4]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { ImplicitEnhancer, INTENT_TO_TRAINING_FILE } from '../../src/models/enhancers/implicit_enhancer_v2.js';
import { Doubao } from '../../src/models/doubao.js';
import { DeepSeek } from '../../src/models/deepseek.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');

const API_FAILURE_SENTINEL = 'My brain disconnected';
const MAX_ATTEMPTS = 4;
const RETRY_BACKOFF_MS = 1500;

// The deployed profile (lucy.json) serves deepseek-v3-250324 through Volcano
// Ark ("doubao"). If that key is unavailable, deepseek-chat is the same model
// family from its first-party endpoint; the substitution is recorded in the
// report header so the serving path is never silently swapped.
const PROVIDERS = {
    doubao: () => new Doubao('deepseek-v3-250324', null),
    deepseek: () => new DeepSeek('deepseek-chat', null)
};

function parseArgs(argv) {
    const args = { seeds: 3, concurrency: 4, provider: 'deepseek' };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--seeds') args.seeds = Number(argv[++i]);
        else if (argv[i] === '--concurrency') args.concurrency = Number(argv[++i]);
        else if (argv[i] === '--provider') args.provider = argv[++i];
    }
    if (!PROVIDERS[args.provider]) throw new Error(`--provider must be one of: ${Object.keys(PROVIDERS).join(', ')}`);
    if (!Number.isInteger(args.seeds) || args.seeds < 1) throw new Error('--seeds must be a positive integer');
    if (!Number.isInteger(args.concurrency) || args.concurrency < 1) throw new Error('--concurrency must be a positive integer');
    return args;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Route a label to its demonstration file the way the deployed loader does:
 * an unmapped label falls back to DEFAULT (crafting demos).
 */
function routeOf(label) {
    return INTENT_TO_TRAINING_FILE[label] || INTENT_TO_TRAINING_FILE.DEFAULT;
}

/**
 * Classify one prompt with the deployed prompt + parser.
 *
 * determineIntentType() swallows every failure into {type:'GENERAL'}, and
 * Doubao swallows API errors into a sentinel string. Both would masquerade as
 * classifier errors, so we detect them and retry rather than scoring them.
 */
async function classify(stub, prompt) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        stub.lastRaw = null;
        const result = await ImplicitEnhancer.prototype.determineIntentType.call(stub, prompt);
        const raw = stub.lastRaw ?? '';
        const apiFailed = typeof raw === 'string' && raw.includes(API_FAILURE_SENTINEL);
        if (!apiFailed) return { label: result.type, confidence: result.confidence ?? null, raw };
        if (attempt < MAX_ATTEMPTS) await sleep(RETRY_BACKOFF_MS * attempt);
    }
    return { label: null, confidence: null, raw: 'API_FAILED' };
}

async function mapWithConcurrency(items, limit, fn) {
    const out = new Array(items.length);
    let next = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (next < items.length) {
            const i = next++;
            out[i] = await fn(items[i], i);
        }
    });
    await Promise.all(workers);
    return out;
}

async function main() {
    const { seeds, concurrency, provider } = parseArgs(process.argv.slice(2));

    const tasks = JSON.parse(readFileSync(join(PROJECT_ROOT, 'scripts/eval/eval_tasks.json'), 'utf8'));
    if (!Array.isArray(tasks) || tasks.length === 0) throw new Error('eval_tasks.json is not a non-empty array');

    const model = PROVIDERS[provider]();
    // Minimal stub: determineIntentType only touches model, logDebug and
    // parseIntentResponse. lastRaw lets us see the pre-parse response so an API
    // failure is not scored as a misclassification.
    const stub = {
        model: {
            sendRequest: async (turns, system) => {
                const raw = await model.sendRequest(turns, system);
                stub.lastRaw = raw;
                return raw;
            }
        },
        logDebug: () => {},
        parseIntentResponse: ImplicitEnhancer.prototype.parseIntentResponse,
        lastRaw: null
    };

    const rows = [];
    for (let seed = 1; seed <= seeds; seed++) {
        console.error(`\n=== seed ${seed}/${seeds} ===`);
        const results = await mapWithConcurrency(tasks, concurrency, async (task) => {
            const { label, confidence, raw } = await classify(stub, task.prompt);
            return {
                seed,
                slug: task.slug,
                level: task.level,
                prompt: task.prompt,
                truth: task.category,
                truthFile: routeOf(task.category),
                label,
                labelFile: label ? routeOf(label) : null,
                confidence,
                apiFailed: label === null,
                rawLen: (raw || '').length
            };
        });
        rows.push(...results.map((r) => ({ ...r, provider })));
        const ok = results.filter((r) => !r.apiFailed);
        console.error(`  label ${ok.filter((r) => r.label === r.truth).length}/${ok.length}` +
            `  routing ${ok.filter((r) => r.labelFile === r.truthFile).length}/${ok.length}` +
            `  apiFail ${results.length - ok.length}`);
    }

    const outDir = join(PROJECT_ROOT, 'scripts/eval/results/intent_accuracy');
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, 'intent_accuracy_rows.json');
    writeFileSync(outPath, JSON.stringify(rows, null, 1));
    console.error(`\nwrote ${rows.length} rows -> ${outPath}`);

    report(rows, tasks, seeds, provider);
}

function report(rows, tasks, seeds, provider) {
    const scored = rows.filter((r) => !r.apiFailed);
    const apiFails = rows.length - scored.length;

    const pct = (n, d) => (d === 0 ? 'n/a' : `${n}/${d} (${((100 * n) / d).toFixed(1)}%)`);

    console.log('\n================ getIntent() accuracy on the frozen 60-task benchmark ================');
    const served = provider === 'doubao'
        ? 'doubao/deepseek-v3-250324 (deployed lucy.json profile)'
        : 'deepseek/deepseek-chat (same model family as the deployed deepseek-v3-250324; first-party endpoint substituted because the Ark key is inactive)';
    console.log(`model: ${served} | seeds: ${seeds} | trials: ${rows.length} | API failures excluded: ${apiFails}`);

    console.log('\n-- Trial level --');
    console.log(`label accuracy   : ${pct(scored.filter((r) => r.label === r.truth).length, scored.length)}`);
    console.log(`routing accuracy : ${pct(scored.filter((r) => r.labelFile === r.truthFile).length, scored.length)}`);

    // Per-task majority vote, matching the benchmark's own scoring protocol.
    const byTask = new Map();
    for (const r of scored) {
        if (!byTask.has(r.slug)) byTask.set(r.slug, []);
        byTask.get(r.slug).push(r);
    }
    const majority = (arr, key) => {
        const counts = {};
        for (const v of arr) counts[v[key]] = (counts[v[key]] || 0) + 1;
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    };
    const taskRows = [...byTask.entries()].map(([slug, trials]) => {
        const mvLabel = majority(trials, 'label');
        return {
            slug,
            truth: trials[0].truth,
            truthFile: trials[0].truthFile,
            mvLabel,
            mvFile: routeOf(mvLabel),
            unstable: new Set(trials.map((t) => t.label)).size > 1
        };
    });
    console.log('\n-- Task level (majority vote over seeds) --');
    console.log(`label accuracy   : ${pct(taskRows.filter((t) => t.mvLabel === t.truth).length, taskRows.length)}`);
    console.log(`routing accuracy : ${pct(taskRows.filter((t) => t.mvFile === t.truthFile).length, taskRows.length)}`);
    console.log(`seed-unstable tasks (label differs across seeds): ${taskRows.filter((t) => t.unstable).length}/${taskRows.length}`);

    console.log('\n-- Per ground-truth category (task level, majority vote) --');
    const cats = [...new Set(tasks.map((t) => t.category))];
    for (const cat of cats) {
        const sub = taskRows.filter((t) => t.truth === cat);
        console.log(`${cat.padEnd(8)} n=${String(sub.length).padStart(2)}  label ${pct(sub.filter((t) => t.mvLabel === cat).length, sub.length).padEnd(16)}  routing ${pct(sub.filter((t) => t.mvFile === t.truthFile).length, sub.length)}`);
    }

    console.log('\n-- Confusion (truth -> majority label), task level --');
    const conf = {};
    for (const t of taskRows) {
        const k = `${t.truth} -> ${t.mvLabel}`;
        conf[k] = (conf[k] || 0) + 1;
    }
    for (const [k, v] of Object.entries(conf).sort((a, b) => b[1] - a[1])) {
        const [truth, label] = k.split(' -> ');
        const routesSame = routeOf(truth) === routeOf(label);
        console.log(`  ${k.padEnd(24)} ${String(v).padStart(2)}  ${truth === label ? '' : routesSame ? '(label error, routes identically)' : '*** ROUTING ERROR ***'}`);
    }

    const misrouted = taskRows.filter((t) => t.mvFile !== t.truthFile);
    console.log(`\n-- Misrouted tasks: ${misrouted.length} --`);
    for (const t of misrouted) console.log(`  ${t.slug.padEnd(28)} truth=${t.truth} -> label=${t.mvLabel}  ${t.truthFile} -> ${t.mvFile}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
