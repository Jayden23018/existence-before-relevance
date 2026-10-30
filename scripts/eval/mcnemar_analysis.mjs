/**
 * McNemar test analysis for SAER ablation experiment.
 *
 * Usage:
 *   node scripts/eval/mcnemar_analysis.mjs
 *
 * Reads the three seed JSON files for each condition, computes per-task
 * majority-vote pass/fail, then runs pairwise McNemar tests.
 *
 * McNemar test (exact binomial when b+c < 25, chi-squared otherwise):
 *   Given conditions A and B, for each task:
 *     b = A passes, B fails
 *     c = A fails, B passes
 *   χ² = (|b-c| - 1)² / (b+c)   [with continuity correction]
 *   p = exact binomial if b+c < 25, else chi-squared(1 df)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = join(__dirname, 'results');

// ── Seed file assignments ─────────────────────────────────────────────────────
// Each condition gets exactly 3 seed files (selected from 2026-05-30 runs).
// bm25_retrieval seeds are filled in automatically after the eval run completes.
const SEED_FILES = {
  no_retrieval: [
    'eval_20260530_015322_no_retrieval.json',
    'eval_20260530_015550_no_retrieval.json',
    'eval_20260530_100243_no_retrieval.json',
  ],
  random_retrieval: [
    'eval_20260530_015326_random_retrieval.json',
    'eval_20260530_020056_random_retrieval.json',
    'eval_20260530_100243_random_retrieval.json',
  ],
  bm25_retrieval: [
    'eval_20260530_114708_bm25_retrieval.json',
    'eval_20260530_131020_bm25_retrieval.json',
    'eval_20260530_132129_bm25_retrieval.json',
  ],
  saer_cold: [
    'eval_20260530_013108_saer_cold.json',
    'eval_20260530_014202_saer_cold.json',
    'eval_20260530_015333_saer_cold.json',
  ],
  saer_warm: [
    'eval_20260530_015330_saer_warm.json',
    'eval_20260530_020600_saer_warm.json',
    'eval_20260530_100243_saer_warm.json',
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function findNewest(prefix) {
  const files = _readdirSync(RESULTS_DIR)
    .filter(f => f.includes(prefix) && f.endsWith('.json'))
    .sort();
  return files.length ? files[files.length - 1] : null;
}

function loadTasks(filename) {
  if (!filename) return null;
  try {
    const data = JSON.parse(readFileSync(join(RESULTS_DIR, filename), 'utf8'));
    return data.tasks; // array of task results
  } catch {
    return null;
  }
}

/**
 * For each task slug, return strict_pass (boolean) across seeds.
 * Returns Map<slug, boolean[]>
 */
function buildPassMatrix(seedFiles) {
  const allSeeds = seedFiles.map(f => loadTasks(f)).filter(Boolean);
  if (allSeeds.length === 0) return new Map();

  const matrix = new Map();
  for (const seedTasks of allSeeds) {
    for (const task of seedTasks) {
      const slug = task.slug || task.task_slug || `${task.tab}/${task.goal_item}`;
      if (!matrix.has(slug)) matrix.set(slug, []);
      matrix.get(slug).push(task.validation?.strict_pass === true);
    }
  }
  return matrix;
}

/**
 * Majority vote: task passes if ≥ ceil(n/2) seeds pass.
 */
function majorityVote(matrix) {
  const result = new Map();
  for (const [slug, passes] of matrix) {
    const count = passes.filter(Boolean).length;
    result.set(slug, count > passes.length / 2);
  }
  return result;
}

/**
 * Exact binomial p-value for McNemar (two-tailed).
 * P(X ≤ min(b,c) | X ~ Binomial(b+c, 0.5)) × 2
 */
function binomialPValue(b, c) {
  const n = b + c;
  if (n === 0) return 1.0;
  const k = Math.min(b, c);
  // CDF of Binomial(n, 0.5) at k
  let p = 0;
  const logC = (n, k) => {
    let r = 0;
    for (let i = 0; i < k; i++) r += Math.log(n - i) - Math.log(i + 1);
    return r;
  };
  for (let i = 0; i <= k; i++) {
    p += Math.exp(logC(n, i) - n * Math.log(2));
  }
  return Math.min(1.0, p * 2);
}

/**
 * Chi-squared p-value with 1 df (approximation).
 */
function chiSquaredPValue(chi2) {
  // Regularized incomplete gamma function P(0.5, chi2/2)
  // Using series expansion: erfc(sqrt(chi2/2))
  const x = Math.sqrt(chi2 / 2);
  // erfc via complementary error function approximation
  // Abramowitz & Stegun 7.1.26
  const t = 1 / (1 + 0.3275911 * x);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return poly * Math.exp(-(x * x));
}

/**
 * McNemar test between two majority-vote maps.
 * Returns { b, c, statistic, p_value, significant }
 */
function mcnemar(voteA, voteB, alpha = 0.05) {
  let b = 0; // A pass, B fail
  let c = 0; // A fail, B pass
  let both_pass = 0;
  let both_fail = 0;

  const slugs = new Set([...voteA.keys(), ...voteB.keys()]);
  for (const slug of slugs) {
    const a_pass = voteA.get(slug) ?? false;
    const b_pass = voteB.get(slug) ?? false;
    if (a_pass && !b_pass) b++;
    else if (!a_pass && b_pass) c++;
    else if (a_pass && b_pass) both_pass++;
    else both_fail++;
  }

  const n = b + c;
  let p_value, statistic;
  if (n < 25) {
    p_value = binomialPValue(b, c);
    statistic = null; // exact test
  } else {
    // With Yates continuity correction
    statistic = Math.pow(Math.abs(b - c) - 1, 2) / n;
    p_value = chiSquaredPValue(statistic);
  }

  return {
    b, c, both_pass, both_fail,
    n_discordant: n,
    statistic,
    p_value,
    significant: p_value < alpha,
    total: b + c + both_pass + both_fail,
  };
}

// ── Per-level analysis ────────────────────────────────────────────────────────

function buildLevelPassMatrix(seedFiles, level) {
  const allSeeds = seedFiles.map(f => loadTasks(f)).filter(Boolean);
  if (allSeeds.length === 0) return new Map();

  const matrix = new Map();
  for (const seedTasks of allSeeds) {
    for (const task of seedTasks) {
      if (task.level !== level) continue;
      const slug = task.slug || task.task_slug || `${task.tab}/${task.goal_item}`;
      if (!matrix.has(slug)) matrix.set(slug, []);
      matrix.get(slug).push(task.validation?.strict_pass === true);
    }
  }
  return matrix;
}

// ── Main ──────────────────────────────────────────────────────────────────────

import { readdirSync as _readdirSync } from 'fs';

async function main() {
  // Fill in any null seeds for all conditions (handles bm25_retrieval where all 3 are null)
  for (const [cond, files] of Object.entries(SEED_FILES)) {
    if (files.some(f => f === null)) {
      const all = _readdirSync(RESULTS_DIR)
        .filter(f => f.includes(`_${cond}.json`) && f.startsWith('eval_'))
        .sort();
      const used = new Set(files.filter(Boolean));
      const available = all.filter(f => !used.has(f));
      for (let i = 0; i < files.length; i++) {
        if (files[i] === null) {
          const pick = available.shift();
          if (pick) {
            files[i] = pick;
            used.add(pick);
            console.log(`[seed auto-assign] ${cond} seed ${i + 1}: ${pick}`);
          } else {
            console.warn(`[WARN] Not enough seed files for ${cond} seed ${i + 1} — reusing seed 1`);
            files[i] = files[0];
          }
        }
      }
    }
  }

  console.log('\n=== Seed files used ===');
  for (const [cond, files] of Object.entries(SEED_FILES)) {
    console.log(`${cond}:`);
    files.forEach((f, i) => console.log(`  seed ${i + 1}: ${f}`));
  }

  // Build per-condition majority-vote maps
  const votes = {};
  const avgPass = {};

  for (const [cond, files] of Object.entries(SEED_FILES)) {
    const matrix = buildPassMatrix(files);
    votes[cond] = majorityVote(matrix);

    // Also compute mean pass rate for reporting
    let total = 0, passSum = 0;
    for (const passes of matrix.values()) {
      passSum += passes.filter(Boolean).length;
      total += passes.length;
    }
    avgPass[cond] = total > 0 ? passSum / total : 0;
  }

  // Summary table
  console.log('\n=== Majority-vote pass counts (35 tasks × 3 seeds) ===');
  console.log('Condition         | Majority pass | Mean pass rate');
  console.log('------------------|---------------|---------------');
  for (const cond of Object.keys(SEED_FILES)) {
    const v = votes[cond];
    const passed = [...v.values()].filter(Boolean).length;
    console.log(`${cond.padEnd(18)}| ${String(passed + '/35').padEnd(14)}| ${(avgPass[cond] * 100).toFixed(1)}%`);
  }

  // Per-level majority-vote
  console.log('\n=== Majority-vote by level ===');
  for (const level of ['L1', 'L2', 'L3']) {
    process.stdout.write(`${level}: `);
    for (const [cond, files] of Object.entries(SEED_FILES)) {
      const matrix = buildLevelPassMatrix(files, level);
      const vote = majorityVote(matrix);
      const passed = [...vote.values()].filter(Boolean).length;
      const total = vote.size;
      process.stdout.write(`${cond}=${passed}/${total}  `);
    }
    console.log();
  }

  // Pairwise McNemar tests
  const allConds = Object.keys(SEED_FILES);
  const pairs = [
    ['saer_cold', 'no_retrieval'],
    ['saer_cold', 'random_retrieval'],
    ['saer_warm', 'no_retrieval'],
    ['saer_warm', 'random_retrieval'],
    ['saer_cold', 'saer_warm'],
    ['random_retrieval', 'no_retrieval'],
    // bm25 comparisons — only added when bm25 seeds are available
    ...(allConds.includes('bm25_retrieval') && votes['bm25_retrieval']?.size > 0 ? [
      ['saer_cold', 'bm25_retrieval'],
      ['bm25_retrieval', 'random_retrieval'],
      ['bm25_retrieval', 'no_retrieval'],
    ] : []),
  ];

  console.log('\n=== McNemar Test Results (majority vote, α=0.05) ===');
  console.log('Comparison                          | b  | c  | discordant | stat   | p-value    | sig');
  console.log('------------------------------------|----|-----|------------|--------|------------|-----');

  const results = [];
  for (const [condA, condB] of pairs) {
    const res = mcnemar(votes[condA], votes[condB]);
    const statStr = res.statistic !== null ? res.statistic.toFixed(3) : 'exact';
    const pStr = res.p_value < 0.001 ? '<0.001' : res.p_value.toFixed(4);
    const sigStr = res.significant ? '***' : (res.p_value < 0.1 ? ' (p<0.1)' : 'n.s.');
    const label = `${condA} vs ${condB}`;
    console.log(`${label.padEnd(36)}| ${String(res.b).padEnd(3)}| ${String(res.c).padEnd(4)}| ${String(res.n_discordant).padEnd(11)}| ${statStr.padEnd(7)}| ${pStr.padEnd(11)}| ${sigStr}`);
    results.push({ condA, condB, ...res, statStr, pStr, sigStr });
  }

  // Save markdown report
  const lines = [
    '# SAER Ablation — McNemar Statistical Significance Test',
    '',
    `**Date**: ${new Date().toISOString().split('T')[0]}`,
    `**Tasks**: 35 (L1×10, L2×13, L3×12)`,
    `**Seeds per condition**: 3 (majority vote across seeds for each task)`,
    `**Test**: McNemar (exact binomial when b+c < 25, else chi-squared with Yates correction)`,
    `**α**: 0.05`,
    '',
    '## Seed Files Used',
    '',
  ];
  for (const [cond, files] of Object.entries(SEED_FILES)) {
    lines.push(`**${cond}**: ${files.join(', ')}`);
  }
  lines.push('');
  lines.push('## Summary — Majority-Vote Pass Rates');
  lines.push('');
  lines.push('| Condition | Majority pass | Mean pass rate | L1 | L2 | L3 |');
  lines.push('|-----------|--------------|----------------|----|----|-----|');
  for (const cond of Object.keys(SEED_FILES)) {
    const v = votes[cond];
    const passed = [...v.values()].filter(Boolean).length;
    const l1 = (() => { const m = buildLevelPassMatrix(SEED_FILES[cond], 'L1'); const v2 = majorityVote(m); return `${[...v2.values()].filter(Boolean).length}/${v2.size}`; })();
    const l2 = (() => { const m = buildLevelPassMatrix(SEED_FILES[cond], 'L2'); const v2 = majorityVote(m); return `${[...v2.values()].filter(Boolean).length}/${v2.size}`; })();
    const l3 = (() => { const m = buildLevelPassMatrix(SEED_FILES[cond], 'L3'); const v2 = majorityVote(m); return `${[...v2.values()].filter(Boolean).length}/${v2.size}`; })();
    lines.push(`| ${cond} | ${passed}/35 (${(passed/35*100).toFixed(0)}%) | ${(avgPass[cond]*100).toFixed(1)}% | ${l1} | ${l2} | ${l3} |`);
  }
  lines.push('');
  lines.push('## McNemar Test Results');
  lines.push('');
  lines.push('| Comparison | A wins (b) | B wins (c) | Discordant | χ² / exact | p-value | Significant |');
  lines.push('|-----------|-----------|-----------|------------|------------|---------|-------------|');
  for (const r of results) {
    lines.push(`| ${r.condA} vs ${r.condB} | ${r.b} | ${r.c} | ${r.n_discordant} | ${r.statStr} | ${r.pStr} | ${r.sigStr} |`);
  }
  lines.push('');
  lines.push('**Notes**: b = tasks where condition A passes but B fails; c = opposite.');
  lines.push('Significance: *** p<0.05, (p<0.1) marginal, n.s. not significant.');
  lines.push('');
  lines.push('## Per-Task Breakdown (saer_cold vs random_retrieval)');
  lines.push('');
  lines.push('| Task | Level | saer_cold (majority) | random (majority) | Discordant |');
  lines.push('|------|-------|---------------------|-------------------|------------|');

  // Get all tasks from first saer_cold file
  const refTasks = loadTasks(SEED_FILES.saer_cold[0]) || [];
  for (const task of refTasks) {
    const slug = task.slug || task.task_slug || `${task.tab}/${task.goal_item}`;
    const saerPass = votes.saer_cold.get(slug);
    const randPass = votes.random_retrieval.get(slug);
    const disc = saerPass !== randPass ? '**←discordant**' : '';
    lines.push(`| ${slug} | ${task.level} | ${saerPass ? '✓' : '✗'} | ${randPass ? '✓' : '✗'} | ${disc} |`);
  }

  const outPath = join(RESULTS_DIR, `mcnemar_report_${new Date().toISOString().replace(/[:.]/g,'-').slice(0,16)}.md`);
  writeFileSync(outPath, lines.join('\n'));
  console.log(`\nReport saved: ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
