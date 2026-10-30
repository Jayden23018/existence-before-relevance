/**
 * Measures how often a planner copies a defective command verbatim out of its
 * few-shot demonstrations.
 *
 * All 9 combat demonstrations call `!equipItem`, which is not in the bot's
 * command registry (the registered name is `!equip`). Every combat task
 * retrieves at least one of them, so every retrieval-condition prompt carries
 * the invalid command while no-retrieval prompts carry none. The gap between
 * the two arms is therefore a direct measurement of demonstration-defect
 * inheritance, and it is invisible to the static scorer, which credits
 * production only from craftRecipe / smeltItem / collection calls -- an equip
 * step produces nothing under either spelling, so a wrong command is neither
 * penalised nor rewarded.
 *
 * The scan set is stated explicitly rather than left implicit: EVERY per-seed
 * result file under scripts/eval/results (recursively), including superseded
 * runs, restricted to tasks whose slug begins with "combat/". Majority-vote
 * summaries are skipped because they carry no per-task plan text.
 *
 * Usage: node scripts/eval/scan_demo_defect_inheritance.mjs [--needle equipItem]
 */
import { readdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');
const RESULTS_ROOT = join(PROJECT_ROOT, 'scripts/eval/results');

const DEFAULT_NEEDLE = 'equipItem';
const COMBAT_PREFIX = 'combat/';

function parseArgs(argv) {
    const args = { needle: DEFAULT_NEEDLE };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--needle') args.needle = argv[++i];
    }
    return args;
}

function* seedFiles(dir) {
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    } catch {
        return;
    }
    for (const e of entries) {
        const p = join(dir, e.name);
        if (e.isDirectory()) yield* seedFiles(p);
        else if (e.name.endsWith('.json') && !e.name.includes('majority')) yield p;
    }
}

function main() {
    const { needle } = parseArgs(process.argv.slice(2));

    const byCondition = new Map();
    let files = 0;
    for (const fpath of seedFiles(RESULTS_ROOT)) {
        let doc;
        try {
            doc = JSON.parse(readFileSync(fpath, 'utf8'));
        } catch {
            continue; // not a result file
        }
        if (!Array.isArray(doc.tasks)) continue;
        const condition = doc.meta?.condition ?? 'unknown';
        let counted = false;
        for (const task of doc.tasks) {
            if (!String(task.slug ?? '').startsWith(COMBAT_PREFIX)) continue;
            counted = true;
            if (!byCondition.has(condition)) byCondition.set(condition, { n: 0, hit: 0 });
            const rec = byCondition.get(condition);
            rec.n++;
            if (JSON.stringify(task).includes(needle)) rec.hit++;
        }
        if (counted) files++;
    }

    const rows = [...byCondition.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const isNoRet = (c) => /no_ret/.test(c);
    const tot = (pred) => rows.filter(([c]) => pred(c))
        .reduce((acc, [, v]) => ({ n: acc.n + v.n, hit: acc.hit + v.hit }), { n: 0, hit: 0 });

    const noRet = tot(isNoRet);
    const retr = tot((c) => !isNoRet(c));
    const pct = (v) => (v.n === 0 ? 'n/a' : `${((100 * v.hit) / v.n).toFixed(1)}%`);

    console.log(`\nDemonstration-defect inheritance: "${needle}" in combat/* trials`);
    console.log(`scan set: every per-seed result file under scripts/eval/results (${files} files, incl. superseded runs)\n`);
    console.log('condition           trials   containing   rate');
    console.log('-'.repeat(50));
    for (const [c, v] of rows) {
        console.log(`${c.padEnd(20)}${String(v.n).padStart(6)}${String(v.hit).padStart(13)}   ${pct(v)}`);
    }
    console.log('-'.repeat(50));
    console.log(`${'no-retrieval'.padEnd(20)}${String(noRet.n).padStart(6)}${String(noRet.hit).padStart(13)}   ${pct(noRet)}`);
    console.log(`${'any retrieval'.padEnd(20)}${String(retr.n).padStart(6)}${String(retr.hit).padStart(13)}   ${pct(retr)}`);

    if (noRet.hit !== 0) {
        throw new Error(`expected zero no-retrieval trials to contain "${needle}", found ${noRet.hit} — the inheritance claim rests on this being exactly 0`);
    }
    console.log(`\nno-retrieval count is exactly 0 as claimed; the command is never invented without demonstrations.`);
}

main();
