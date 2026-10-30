#!/usr/bin/env python3
"""
Mixed-effects logistic regression for MCAI eval results.

Model: pass ~ model * condition + (1|task) + (1|seed)
Tests whether the model × condition interaction is significant,
which directly addresses the "capacity-dependent recovery" hypothesis.

Usage:
    python3 scripts/eval/mixed_effects_analysis.py
    python3 scripts/eval/mixed_effects_analysis.py --include-thinking
"""

import json
import os
import sys
import numpy as np
import pandas as pd
from statsmodels.genmod.generalized_estimating_equations import GEE
from statsmodels.genmod.families import Binomial
from statsmodels.genmod.cov_struct import Exchangeable

RESULTS_DIR = os.path.join(os.path.dirname(__file__), 'results', 'canonical')

# ── Canonical file mapping ──────────────────────────────────────────
# (model_label, condition, timestamp_prefix)
CANONICAL_RUNS = [
    # Main 5 models
    ('DeepSeek-V3', 'no_retrieval', 'eval_20260604_231018'),
    ('DeepSeek-V3', 'saer_cold', 'eval_20260604_233642'),
    ('Qwen2.5-Max', 'no_retrieval', 'eval_20260604_213651'),
    ('Qwen2.5-Max', 'saer_cold', 'eval_20260605_212831'),
    ('Qwen3-8B', 'no_retrieval', 'eval_20260605_213048'),
    ('Qwen3-8B', 'saer_cold', 'eval_20260605_213054'),
    ('GPT-4o', 'no_retrieval', 'eval_20260605_213059'),
    ('GPT-4o', 'saer_cold', 'eval_20260605_223958'),
    ('Claude-S.4.5', 'no_retrieval', 'eval_20260605_233949'),
    ('Claude-S.4.5', 'saer_cold', 'eval_20260606_003941'),
]

THINKING_RUNS = [
    ('Qwen3-8B-think', 'no_retrieval', 'eval_20260606_024017'),
    ('Qwen3-8B-think', 'saer_cold', 'eval_20260606_044848'),
]

QWEN_MAX_ABLATION = [
    ('Qwen2.5-Max', 'random_retrieval', 'eval_20260605_000159'),
    ('Qwen2.5-Max', 'bm25_retrieval', 'eval_20260605_004805'),
    ('Qwen2.5-Max', 'saer_warm', 'eval_20260605_153759'),
]


def load_seed_data(prefix, results_dir):
    """Load per-task results from s1/s2/s3 seed files."""
    records = []
    for seed_idx in range(1, 4):
        fname = f'{prefix}_s{seed_idx}.json'
        fpath = os.path.join(results_dir, fname)
        if not os.path.exists(fpath):
            print(f'  WARNING: {fname} not found in {results_dir}, skipping')
            continue

        with open(fpath) as f:
            data = json.load(f)

        # Get task-level results
        tasks = data.get('tasks', [])
        if not tasks:
            # Try different data formats
            summary = data.get('summary', {})
            continue

        for task in tasks:
            slug = task.get('slug', task.get('task', f'task_{len(records)}'))
            # strict_pass is nested inside validation object
            validation = task.get('validation', {})
            passed = 1 if validation.get('strict_pass', task.get('strict_pass', False)) else 0

            records.append({
                'seed': seed_idx,
                'task': slug,
                'pass': passed,
            })

    return records


def build_dataset(include_thinking=False, include_ablation=False):
    """Build flat DataFrame with per-task, per-seed observations."""
    all_records = []
    runs = CANONICAL_RUNS.copy()

    if include_thinking:
        runs.extend(THINKING_RUNS)
    if include_ablation:
        runs.extend(QWEN_MAX_ABLATION)

    for model, condition, prefix in runs:
        # Filename format: eval_{timestamp}_{condition}_s{N}.json
        full_prefix = f'{prefix}_{condition}'
        records = load_seed_data(full_prefix, RESULTS_DIR)
        for r in records:
            r['model'] = model
            r['condition'] = condition
            r['has_retrieval'] = 0 if condition == 'no_retrieval' else 1
        all_records.extend(records)
        print(f'  {model}/{condition}: {len(records)} observations')

    df = pd.DataFrame(all_records)
    return df


def fit_gee_model(df):
    """
    Fit GEE with exchangeable correlation.
    Uses binary is_small indicator (Qwen3-8B=1, frontier=0) for interaction test.
    This directly tests the capacity-dependent recovery hypothesis.
    """
    # Binary: is this a sub-frontier model?
    small_models = {'Qwen3-8B', 'Qwen3-8B-think'}
    df['is_small'] = df['model'].apply(lambda m: 1 if m in small_models else 0)
    df['interaction'] = df['is_small'] * df['has_retrieval']

    family = Binomial()
    cov_struct = Exchangeable()

    X = df[['has_retrieval', 'is_small', 'interaction']].copy()
    X['intercept'] = 1
    y = df['pass']
    groups = df['task']

    model = GEE(y, X, groups=groups, family=family, cov_struct=cov_struct)
    result = model.fit()

    return result, {'is_small': small_models}


def compute_per_model_summary(df):
    """Compute per-model TCR by condition (for reporting)."""
    summary = (df
               .groupby(['model', 'condition'])
               .agg(tcr=('pass', 'mean'), n=('pass', 'count'))
               .reset_index())
    return summary


def mcnemar_thinking_vs_baseline():
    """Compute McNemar test for thinking vs baseline Qwen3-8B."""
    from scipy.stats import binomtest

    # Load majority_vote data for thinking and baseline
    results = {}
    for label, prefix in [
        ('baseline_nr', 'eval_20260605_213048_no_retrieval'),
        ('baseline_sa', 'eval_20260605_213054_saer_cold'),
        ('thinking_nr', 'eval_20260606_024017_no_retrieval'),
        ('thinking_sa', 'eval_20260606_044848_saer_cold'),
    ]:
        fpath = os.path.join(RESULTS_DIR, f'{prefix}_majority_vote.json')
        if os.path.exists(fpath):
            with open(fpath) as f:
                data = json.load(f)
            results[label] = data

    # Get per-task results from seed files for paired comparison
    def get_mv_tasks(prefix):
        """Reconstruct majority vote from seed files."""
        task_results = {}
        for s in ['s1', 's2', 's3']:
            fpath = os.path.join(RESULTS_DIR, f'{prefix}_{s}.json')
            with open(fpath) as f:
                data = json.load(f)
            for task in data.get('tasks', []):
                slug = task.get('slug', task.get('task', ''))
                validation = task.get('validation', {})
                passed = validation.get('strict_pass', task.get('strict_pass', False))
                if slug not in task_results:
                    task_results[slug] = []
                task_results[slug].append(1 if passed else 0)

        # Majority vote
        mv = {}
        for slug, votes in task_results.items():
            mv[slug] = 1 if sum(votes) >= 2 else 0
        return mv

    comparisons = [
        ('Thinking SAER vs Thinking no-ret', 'thinking_sa', 'thinking_nr'),
        ('Thinking SAER vs Baseline SAER', 'thinking_sa', 'baseline_sa'),
        ('Baseline SAER vs Baseline no-ret', 'baseline_sa', 'baseline_nr'),
    ]

    prefixes = {
        'baseline_nr': 'eval_20260605_213048_no_retrieval',
        'baseline_sa': 'eval_20260605_213054_saer_cold',
        'thinking_nr': 'eval_20260606_024017_no_retrieval',
        'thinking_sa': 'eval_20260606_044848_saer_cold',
    }

    # Verify files exist
    for key, prefix in prefixes.items():
        test_path = os.path.join(RESULTS_DIR, f'{prefix}_s1.json')
        if not os.path.exists(test_path):
            print(f'  WARNING: {prefix}_s1.json not found')

    print('\n=== McNemar Tests: Qwen3-8B Thinking vs Baseline ===\n')

    for title, cond_a_key, cond_b_key in comparisons:
        mv_a = get_mv_tasks(prefixes[cond_a_key])
        mv_b = get_mv_tasks(prefixes[cond_b_key])

        common_tasks = set(mv_a.keys()) & set(mv_b.keys())
        b = sum(1 for t in common_tasks if mv_a[t] == 1 and mv_b[t] == 0)  # A pass, B fail
        c = sum(1 for t in common_tasks if mv_a[t] == 0 and mv_b[t] == 1)  # A fail, B pass

        if b + c > 0:
            result = binomtest(min(b, c), b + c)
            p_val = result.pvalue
        else:
            p_val = 1.0

        sig = '***' if p_val < 0.001 else '**' if p_val < 0.01 else '*' if p_val < 0.05 else 'n.s.'
        print(f'{title}:')
        print(f'  b={b}, c={c}, b+c={b+c}, p={p_val:.4f} {sig}')
        print(f'  A pass/B fail={b}, A fail/B pass={c}, n={len(common_tasks)}')
        print()


def main():
    include_thinking = '--include-thinking' in sys.argv

    print('=== Mixed-Effects Analysis: MCAI Eval Results ===\n')
    print(f'Including thinking mode: {include_thinking}\n')

    # Build dataset
    print('Loading per-seed data...')
    df = build_dataset(include_thinking=include_thinking)
    print(f'\nTotal observations: {len(df)}')
    print(f'Models: {sorted(df["model"].unique())}')
    print(f'Conditions: {sorted(df["condition"].unique())}')
    print(f'Tasks: {df["task"].nunique()}')
    print(f'Seeds: {sorted(df["seed"].unique())}')

    # Per-model summary
    print('\n=== Per-Model Summary ===\n')
    summary = compute_per_model_summary(df)
    print(summary.to_string(index=False))

    # GEE model
    print('\n=== GEE Mixed-Effects Model ===')
    print('Formula: pass ~ has_retrieval + model + has_retrieval:model\n')

    try:
        result, model_codes = fit_gee_model(df)
        print(f'Model codes: {model_codes}')
        print(result.summary())
        print('\n=== Key Coefficients ===')
        for name, coef, pval in zip(
            result.params.index,
            result.params.values,
            result.pvalues.values
        ):
            sig = '***' if pval < 0.001 else '**' if pval < 0.01 else '*' if pval < 0.05 else ''
            print(f'  {name}: coef={coef:.4f}, p={pval:.4f} {sig}')
    except Exception as e:
        print(f'GEE fit failed: {e}')
        print('Falling back to simple logistic regression...')

        from statsmodels.genmod.generalized_linear_model import GLM
        X = df[['has_retrieval', 'model_code']].copy()
        X['interaction'] = X['has_retrieval'] * X['model_code']
        X['intercept'] = 1
        y = df['pass']
        model = GLM(y, X, family=Binomial())
        result = model.fit()
        print(result.summary())

    # McNemar for thinking mode
    if include_thinking:
        try:
            mcnemar_thinking_vs_baseline()
        except ImportError:
            print('scipy not available for McNemar test')
        except Exception as e:
            print(f'McNemar test failed: {e}')


if __name__ == '__main__':
    main()
