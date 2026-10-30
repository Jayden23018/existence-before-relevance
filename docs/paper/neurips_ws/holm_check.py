#!/usr/bin/env python3
"""Recompute Bonferroni vs Holm-Bonferroni verdicts for the 13-test family.

p-values are transcribed from `node scripts/eval/mcnemar_table.mjs --rescore`.
The nine exact-<0.001 tests are entered at their exact binomial values so the
step-down thresholds are checked against real numbers, not the "<0.001" label.
"""
from math import comb

def mcnemar_exact(b, c):
    """Two-sided exact binomial McNemar p, same formula as the .mjs scorer."""
    n = b + c
    if n == 0:
        return 1.0
    k = min(b, c)
    return min(1.0, 2.0 * sum(comb(n, i) for i in range(k + 1)) / 2.0 ** n)

FAMILY = [  # (label, b, c) straight from the rescore table
    ("per-model qwen3-8b  saer_cold vs no_ret", 15, 3),
    ("per-model gpt-4o    saer_cold vs no_ret", 19, 1),
    ("per-model claude    saer_cold vs no_ret", 26, 0),
    ("per-model qwen-max  saer_cold vs no_ret", 30, 0),
    ("per-model deepseek  saer_cold vs no_ret", 21, 2),
    ("ablation  random    vs no_ret",           19, 0),
    ("ablation  bm25      vs no_ret",           24, 1),
    ("ablation  saer_cold vs no_ret",           30, 0),
    ("ablation  bm25      vs random",            9, 5),
    ("ablation  saer_cold vs bm25",              7, 0),
    ("cross     deepseek  vs qwen3-8b",         26, 0),
    ("cross     qwen-max  vs qwen3-8b",         23, 0),
    ("cross     deepseek  vs qwen-max",          5, 2),
]
ALPHA, m = 0.05, len(FAMILY)
assert m == 13, m

tests = sorted(((mcnemar_exact(b, c), lab) for lab, b, c in FAMILY), key=lambda t: t[0])

print(f"=== Holm-Bonferroni step-down, alpha={ALPHA}, m={m} ===")
print(f"{'rank':>4}  {'p':>12}  {'alpha/(m-i+1)':>14}  verdict   test")
rejected = 0
stopped = False
for i, (p, lab) in enumerate(tests, 1):
    thr = ALPHA / (m - i + 1)
    if not stopped and p <= thr:
        verdict, rejected = "REJECT", rejected + 1
    else:
        verdict, stopped = "retain", True
    print(f"{i:>4}  {p:>12.3e}  {thr:>14.5f}  {verdict:<8}  {lab}")

bonf = sum(1 for p, _ in tests if p < ALPHA / m)
print(f"\nBonferroni (alpha'={ALPHA/m:.5f}) rejects : {bonf}/{m}")
print(f"Holm-Bonferroni rejects              : {rejected}/{m}")

# Robustness: the nine <0.001 tests must all clear the STRICTEST rank-1
# threshold, so their internal ordering cannot change any verdict.
tiny = [(p, lab) for p, lab in tests if p < 0.001]
worst = max(tiny)
print(f"\nRobustness: {len(tiny)} tests have p<0.001; largest is "
      f"{worst[0]:.2e} ({worst[1].strip()}),")
print(f"  vs the strictest (rank-1) threshold {ALPHA/m:.5f} -- "
      f"ratio {ALPHA/m/worst[0]:.0f}x margin.")
assert all(p < ALPHA / m for p, _ in tiny), "a <0.001 test misses rank-1 threshold"
print("  => their permutation cannot alter any Holm verdict.  OK")

assert (bonf, rejected) == (9, 11), (bonf, rejected)
print("\nassertions passed: Bonferroni 9/13, Holm 11/13")
