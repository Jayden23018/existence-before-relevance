/**
 * Plancraft Cross-Validation — per-condition stratified FPR test
 *
 * Extends plancraft_crossval.mjs: instead of pooling all seed files into one
 * aggregate agreement rate, tags every craftRecipe check with its retrieval
 * condition (from the filename) and tests whether PlanValidator's false-positive
 * rate is uniform across conditions (Fisher exact / chi-square on the
 * condition × {FP, non-FP} contingency table).
 *
 * 运行: node scripts/eval/plancraft_crossval_stratified.mjs
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { primarySeedFiles } from './primary_runs.mjs';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, 'results');
const PY_BATCH   = join(__dirname, 'plancraft_oracle_batch.py');
const PY_STATS   = join(__dirname, 'fisher_stratified.py');

function batchOracleCheck(queries) {
    const inputJson = JSON.stringify(queries);
    try {
        const out = execFileSync('python3', [PY_BATCH], { input: inputJson, timeout: 60000, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
        return JSON.parse(out.trim());
    } catch (e) {
        return queries.map(() => 'error');
    }
}

const SMELTING_OUTPUTS = {
    raw_iron: 'iron_ingot', raw_gold: 'gold_ingot', raw_copper: 'copper_ingot',
    cobblestone: 'stone', sand: 'glass', clay_ball: 'brick',
    netherrack: 'nether_brick', clay: 'brick',
};

function inferProduce(cmd) {
    let m;
    m = cmd.match(/craftRecipe\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
    if (m) return { name: m[1], count: parseInt(m[2]) || 1 };
    m = cmd.match(/smeltItem\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
    if (m) return { name: SMELTING_OUTPUTS[m[1]] ?? m[1], count: parseInt(m[2]) || 1 };
    m = cmd.match(/collectBlocks\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
    if (m) {
        const r = m[1];
        const d = r === 'stone' ? 'cobblestone' : r === 'deepslate' ? 'cobbled_deepslate' : r;
        return { name: d, count: parseInt(m[2]) || 1 };
    }
    return null;
}

function stepCmds(step) {
    if (step.action_cmd?.length) return step.action_cmd;
    if (step.command) return [step.command];
    return [];
}

function extractCraftChecks(plan, validationIssues) {
    const virt = {};
    const checks = [];
    for (const step of (plan.steps || [])) {
        const cmds = stepCmds(step);
        const within = { ...virt };
        for (const cmd of cmds) {
            const craftM = cmd.match(/craftRecipe\(['"]([^'"]+)['"]\s*,\s*(\d+)\)/);
            if (craftM) {
                const item      = craftM[1];
                const goalCount = parseInt(craftM[2]) || 1;
                const flagged   = validationIssues.some(iss =>
                    iss.includes('missing ingredient') &&
                    (iss.includes(`"${item}"`) || iss.includes(`'${item}'`))
                );
                checks.push({ step: step.step, item, goalCount, invBefore: { ...within }, validatorFeasible: !flagged });
            }
            const p = inferProduce(cmd);
            if (p) within[p.name] = (within[p.name] || 0) + p.count;
        }
        for (const cmd of cmds) {
            const p = inferProduce(cmd);
            if (p) virt[p.name] = (virt[p.name] || 0) + p.count;
        }
    }
    return checks;
}

const CONDITIONS = ['no_retrieval', 'random_retrieval', 'bm25_retrieval', 'saer_cold'];

// ── Seed files, pinned by run identity ──────────────────────────────────────
//
// Was: "the latest 3 seed files per condition" from a top-level directory glob.
// That glob never saw results/canonical/ or results/fixed_mcdata/, where the
// runs behind Tables 2 and 3 live, and it re-targeted itself onto whichever
// ablation had been run most recently -- so the same command measured a
// different set of plans every month. See primary_runs.mjs.
const seedFiles = primarySeedFiles();

console.log('\n🦞  Plancraft Cross-Validation — STRATIFIED by retrieval condition');
console.log(`    Seed files: ${seedFiles.length}`);
const perCondFileCount = {};
for (const { condition } of seedFiles) perCondFileCount[condition] = (perCondFileCount[condition] || 0) + 1;
console.log('    File counts:', perCondFileCount);

// Phase 1: collect all craftRecipe checks, tagged by condition
const allChecks = [];
for (const { file, condition } of seedFiles) {
    if (!existsSync(file)) continue;
    let data;
    try { data = JSON.parse(readFileSync(file, 'utf8')); } catch { continue; }
    for (const task of (data.tasks || [])) {
        if (!task.parse_success || !task.plan?.steps) continue;
        const issues = task.validation?.issues ?? [];
        for (const chk of extractCraftChecks(task.plan, issues)) {
            allChecks.push({ slug: task.slug, condition, ...chk });
        }
    }
}

console.log(`\n    Total craftRecipe checks: ${allChecks.length}`);
console.log('    Calling Plancraft oracle (batched)...');

const queries = allChecks.map(c => ({ target: c.item, inventory: c.invBefore }));
const oracleResults = batchOracleCheck(queries);

// Phase 2: per-condition confusion matrix
const perCond = {};
for (const c of CONDITIONS) perCond[c] = { total: 0, agree: 0, tp: 0, tn: 0, fp: 0, fn: 0, skipped: 0 };

for (let i = 0; i < allChecks.length; i++) {
    const chk = allChecks[i];
    const oracle = oracleResults[i];
    const bucket = perCond[chk.condition];
    if (oracle === 'unknown' || oracle === 'error') { bucket.skipped++; continue; }
    const plancraftFeasible = oracle === 'solvable';
    const validatorFeasible = chk.validatorFeasible;
    bucket.total++;
    if (validatorFeasible === plancraftFeasible) {
        bucket.agree++;
        validatorFeasible ? bucket.tp++ : bucket.tn++;
    } else {
        validatorFeasible ? bucket.fp++ : bucket.fn++;
    }
}

console.log('\n' + '═'.repeat(70));
console.log('Per-condition confusion matrix (validator vs Plancraft oracle):\n');
console.log('condition            total  agree   FP    FN   FPR%   agree%');
for (const c of CONDITIONS) {
    const b = perCond[c];
    if (b.total === 0) continue;
    const fpr = (b.fp / b.total * 100).toFixed(2);
    const agr = (b.agree / b.total * 100).toFixed(1);
    console.log(`${c.padEnd(20)} ${String(b.total).padStart(5)} ${String(b.agree).padStart(6)} ${String(b.fp).padStart(5)} ${String(b.fn).padStart(5)}  ${fpr.padStart(5)}  ${agr.padStart(6)}`);
}

// Phase 3: build contingency table for Fisher/chi-square (rows=condition, cols=[FP, non-FP among feasibility-negative-eligible])
// FPR defined relative to all checks (fp / total), so contingency = [fp, total-fp] per condition
const activeConds = CONDITIONS.filter(c => perCond[c].total > 0);
const table = activeConds.map(c => [perCond[c].fp, perCond[c].total - perCond[c].fp]);

console.log('\nContingency table (rows=condition, cols=[FP, non-FP]):');
activeConds.forEach((c, i) => console.log(`  ${c.padEnd(20)} ${JSON.stringify(table[i])}`));

// Call Python for chi-square / Fisher (via scipy)
const statsInput = JSON.stringify({ conditions: activeConds, table });
let statsOut;
try {
    statsOut = execFileSync('python3', [PY_STATS], { input: statsInput, encoding: 'utf8' });
} catch (e) {
    statsOut = JSON.stringify({ error: String(e) });
}
const stats = JSON.parse(statsOut.trim());

console.log('\n' + '═'.repeat(70));
console.log('Statistical test: is FPR uniform across retrieval conditions?');
console.log(JSON.stringify(stats, null, 2));

// Save
const outPath = join(RESULTS_DIR, 'plancraft_crossval_stratified.json');
writeFileSync(outPath, JSON.stringify({ perCond, activeConds, table, stats }, null, 2));
console.log(`\nSaved → ${outPath}\n`);

// Guarded so the script stays read-only inside the release archive: a verifier's
// extracted copy has no development change log and must not gain one.
const logPath = join(__dirname, '..', '..', 'docs', 'change_log.md');
if (existsSync(logPath)) {
    const ts = new Date().toISOString().replace('T',' ').slice(0,16);
    appendFileSync(logPath,
        `[${ts}] plancraft_crossval_stratified.mjs | Per-condition FPR test across ${activeConds.length} conditions: ` +
        `${stats.test ?? 'test'} p=${stats.p_value ?? 'NA'}\n`
    );
}
