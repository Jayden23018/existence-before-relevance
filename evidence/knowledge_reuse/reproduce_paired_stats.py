#!/usr/bin/env python3
"""Recompute the cross-agent statistics reported in the paper (Sec. 5.5 and
the supplement) directly from paired_trials.csv / trial_by_trial.csv.

    python3 reproduce_paired_stats.py

Standard library only; no network, no API keys, no Minecraft server.

Deterministic quantities (means, win/loss counts, exact sign-test p-values,
and every cell of the pooled condition table) are asserted against the
published values and will fail loudly on any mismatch.  The bootstrap
interval is resampled here with a fixed seed, so it is checked against the
published interval within a 0.2 s tolerance rather than for exact equality.
"""

import csv
import os
import random
import statistics as st
from collections import defaultdict
from math import comb

HERE = os.path.dirname(os.path.abspath(__file__))
BOOTSTRAP_RESAMPLES = 20000
BOOTSTRAP_SEED = 0
CI_TOLERANCE_S = 0.2

# Published in the paper's supplement.
PUBLISHED = {
    "implicit_minus_normal_post_discovery_s": {
        "mean": -4.848, "faster": 26, "slower": 4, "ties": 0,
        "p": 5.94761e-05, "ci": (-6.684, -3.047),
    },
    "implicit_minus_explicit_post_discovery_s": {
        "mean": -1.334, "faster": 24, "slower": 6, "ties": 0,
        "p": 0.0014309064, "ci": (-2.157, -0.518),
    },
}
PUBLISHED_TABLE = {
    # condition: (successes, trials, mean post-discovery s, excess visits,
    #             model calls, chat messages, coverage)
    "normal":   (30, 30, 21.58, 22, 30,  0, 1.00),
    "explicit": (28, 30, 18.07,  0, 60, 60, 0.93),
    "implicit": (30, 30, 16.73,  0, 30,  0, 1.00),
}


def exact_sign_test(diffs):
    """Two-sided exact binomial sign test over non-tied paired differences."""
    faster = sum(1 for d in diffs if d < 0)
    slower = sum(1 for d in diffs if d > 0)
    ties = sum(1 for d in diffs if d == 0)
    n = faster + slower
    k = min(faster, slower)
    p = min(1.0, 2 * sum(comb(n, i) for i in range(k + 1)) / 2 ** n)
    return faster, slower, ties, p


def bootstrap_ci(diffs, resamples=BOOTSTRAP_RESAMPLES, seed=BOOTSTRAP_SEED):
    """Percentile 95% interval for the mean paired difference."""
    rnd = random.Random(seed)
    n = len(diffs)
    means = sorted(st.mean(rnd.choices(diffs, k=n)) for _ in range(resamples))
    return means[int(0.025 * resamples)], means[int(0.975 * resamples)]


def check(label, got, want, tol):
    ok = abs(got - want) <= tol
    print(f"    {'OK  ' if ok else 'FAIL'} {label}: {got:.4g} vs published {want:.4g}")
    return ok


def main():
    paired = list(csv.DictReader(open(os.path.join(HERE, "paired_trials.csv"))))
    trials = list(csv.DictReader(open(os.path.join(HERE, "trial_by_trial.csv"))))
    assert len(paired) == 30, f"expected 30 matched triplets, got {len(paired)}"
    assert len(trials) == 90, f"expected 90 trials, got {len(trials)}"

    failures = []

    print("=" * 68)
    print("Paired post-discovery contrasts (30 target-matched triplets)")
    print("=" * 68)
    for key, pub in PUBLISHED.items():
        diffs = [float(r[key]) for r in paired]
        faster, slower, ties, p = exact_sign_test(diffs)
        lo, hi = bootstrap_ci(diffs)
        print(f"\n  {key}")
        failures += [not check("mean (s)", st.mean(diffs), pub["mean"], 5e-4)]
        failures += [not check("faster", faster, pub["faster"], 0)]
        failures += [not check("slower", slower, pub["slower"], 0)]
        failures += [not check("ties", ties, pub["ties"], 0)]
        failures += [not check("sign-test p", p, pub["p"], 1e-9)]
        failures += [not check("bootstrap CI low", lo, pub["ci"][0], CI_TOLERANCE_S)]
        failures += [not check("bootstrap CI high", hi, pub["ci"][1], CI_TOLERANCE_S)]

        # Per-model decomposition (reported in the supplement).
        print("    per-model decomposition:")
        for model in sorted({r["model"] for r in paired}):
            dm = [float(r[key]) for r in paired if r["model"] == model]
            f, s, t, pm = exact_sign_test(dm)
            print(f"      {model:22s} n={len(dm)} mean={st.mean(dm):+7.3f}s "
                  f"faster={f}/{len(dm)} p={pm:.4g}")

    print("\n" + "=" * 68)
    print("Pooled condition table")
    print("=" * 68)
    by_cond = defaultdict(list)
    for row in trials:
        by_cond[row["condition"]].append(row)
    for cond, pub in PUBLISHED_TABLE.items():
        rs = by_cond[cond]
        got = (
            sum(1 for r in rs if r["success"] == "true"),
            len(rs),
            st.mean(float(r["post_discovery_duration_s"]) for r in rs),
            sum(int(r["consumer_search_overhead_visits"]) for r in rs),
            sum(int(r["model_api_calls"]) for r in rs),
            sum(int(r["explicit_chat_messages"]) for r in rs),
            st.mean(float(r["task_coverage_rate"]) for r in rs),
        )
        print(f"\n  {cond}")
        for label, g, w, tol in zip(
            ["successes", "trials", "post-discovery (s)", "excess visits",
             "model calls", "chat messages", "coverage"],
            got, pub, [0, 0, 0.01, 0, 0, 0, 0.005],
        ):
            failures += [not check(label, g, w, tol)]

    n_failed = sum(failures)
    print("\n" + "=" * 68)
    print(f"{len(failures) - n_failed}/{len(failures)} checks passed")
    print("=" * 68)
    raise SystemExit(1 if n_failed else 0)


if __name__ == "__main__":
    main()
