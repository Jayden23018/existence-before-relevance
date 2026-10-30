/**
 * Stage 2 driver for the deployed-configuration weight ablation.
 *
 * Reads the divergent task list produced by saer_retrieval_divergence.mjs and
 * runs static_plan_eval.js once per configuration over ONLY those tasks.
 *
 * Why only the divergent tasks: demonstrations are serialised in descending
 * score order, so a task whose ordered top-k is unchanged receives a
 * byte-identical prompt under both configurations and cannot contribute
 * systematically to McNemar's b or c. Restricting to divergent tasks loses no
 * signal and avoids re-running ~70% of the benchmark.
 *
 * Weights are read from divergence.json rather than restated here, so this
 * driver cannot drift from the configuration that produced the task lists.
 *
 * Usage: node scripts/eval/run_weight_ablation.mjs [--configs 5dim,equal_active] [--profile dusty] [--dry-run]
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');
const DIVERGENCE = join(PROJECT_ROOT, 'scripts/eval/results/retrieval_divergence/divergence.json');

// All qwen-max profiles are equivalent once createModel() forces url=null and
// none of them set params, so this matches the decoding config of the original
// saer_cold run (results/fixed_mcdata/eval_20260621_001120_saer_cold).
const DEFAULT_PROFILE = 'dusty';
const SEEDS = 3;
const RETRIES = 3;

function parseArgs(argv) {
    const args = { configs: null, profile: DEFAULT_PROFILE, dryRun: false };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--configs') args.configs = argv[++i].split(',').map((s) => s.trim());
        else if (argv[i] === '--profile') args.profile = argv[++i];
        else if (argv[i] === '--dry-run') args.dryRun = true;
    }
    return args;
}

function run(cmd, cmdArgs) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, cmdArgs, { cwd: PROJECT_ROOT, stdio: 'inherit' });
        child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
        child.on('error', reject);
    });
}

async function main() {
    const { configs, profile, dryRun } = parseArgs(process.argv.slice(2));
    const div = JSON.parse(readFileSync(DIVERGENCE, 'utf8'));

    const targets = div.report.filter((r) => r.config !== div.baseline && r.orderDivergent > 0
        && (!configs || configs.includes(r.config)));
    if (targets.length === 0) throw new Error('no matching configurations with divergent tasks');

    console.log(`profile=${profile} seeds=${SEEDS} retries=${RETRIES} baseline=${div.baseline}`);
    for (const t of targets) {
        console.log(`  ${t.config}: ${t.orderDivergent} divergent tasks -> ${t.orderDivergent * SEEDS} generations`);
    }
    const total = targets.reduce((a, t) => a + t.orderDivergent * SEEDS, 0);
    console.log(`total generations: ${total}\n`);

    for (const t of targets) {
        const args = [
            'scripts/eval/static_plan_eval.js',
            '--mode', 'saer_cold',
            '--seeds', String(SEEDS),
            '--retries', String(RETRIES),
            '--profile', profile,
            '--only-tasks', t.divergentSlugs.join(','),
            '--saer-weights', JSON.stringify(t.weights)
        ];
        console.log(`\n${'='.repeat(70)}\n  ${t.config}  (${t.orderDivergent} tasks)\n${'='.repeat(70)}`);
        console.log(`node ${args.map((a) => (a.includes(',') || a.includes('{') ? `'${a}'` : a)).join(' ')}\n`);
        if (dryRun) continue;
        await run('node', args);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
