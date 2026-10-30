# Canonical Evaluation Artifacts — Primary 10 Files

This manifest lists the 10 primary majority-vote files used in the five-model main study (Table 2 of the paper). Two duplicate Qwen3-8B runs exist; the primary run is labelled below.

## Five-model study: no_retrieval condition

| File | Model | TCR | Note |
|---|---|---|---|
| eval_20260604_213651_no_retrieval_majority_vote.json | qwen-max | 17/60 | PRIMARY |
| eval_20260604_231018_no_retrieval_majority_vote.json | deepseek-chat | 30/60 | PRIMARY |
| eval_20260605_213048_no_retrieval_majority_vote.json | qwen3-8b | 12/60 | **PRIMARY** (see note) |
| eval_20260605_213059_no_retrieval_majority_vote.json | gpt-4o-2024-11-20 | 16/60 | PRIMARY |
| eval_20260605_233949_no_retrieval_majority_vote.json | claude-sonnet-4-5 | 25/60 | PRIMARY |

## Five-model study: saer_cold condition

| File | Model | TCR | Note |
|---|---|---|---|
| eval_20260605_212831_saer_cold_majority_vote.json | qwen-max | 41/60 | PRIMARY |
| eval_20260604_233642_saer_cold_majority_vote.json | deepseek-chat | 47/60 | PRIMARY |
| eval_20260605_213054_saer_cold_majority_vote.json | qwen3-8b | 17/60 | **PRIMARY** (see note) |
| eval_20260605_223958_saer_cold_majority_vote.json | gpt-4o-2024-11-20 | 29/60 | PRIMARY |
| eval_20260606_003941_saer_cold_majority_vote.json | claude-sonnet-4-5 | 39/60 | PRIMARY |

## Qwen3-8B Second Run — THINKING MODE (excluded from the main table)

> **CORRECTION.** An earlier revision of this file described the two runs below as a
> duplicate of the primary run under an identical `temperature=0.7`, non-thinking
> configuration. **That description was wrong.** These are the thinking-mode runs
> (`enable_thinking=true`, `profiles/qwen3_thinking_eval.json`), and they are the runs
> the paper's thinking-mode ablation appendix reports. `../MANIFEST.md` lines 45-50 have
> always labelled them correctly; this file did not. Read `../MANIFEST.md` as
> authoritative for these two runs.

A second Qwen3-8B run was completed ~10 hours after the primary run, under extended
thinking:
- eval_20260606_024017_no_retrieval_majority_vote.json: 14/60
- eval_20260606_044848_saer_cold_majority_vote.json: 20/60

A first thinking attempt (`eval_20260606_023900_*`) failed with an API endpoint error
and scored 0/60 across the board; 024017 is its retry.

The primary non-thinking run (20260605_213048/213054) was designated as canonical
following a pre-registration convention: the first completed run for each model is
treated as the primary result. The thinking runs are excluded from Table 1 and all
McNemar computations in the confirmatory family, and are reported only in the
thinking-mode appendix, which labels them exploratory.

McNemar exact on the primary (non-thinking) run: b=8, c=3, p=0.227 n.s.
McNemar exact on the thinking run: b=8, c=2, p=0.109 n.s. (both verified from seed
files). Both non-significant.

## Gemma4 model results (stored in results/, not canonical/)

The Gemma4 evaluation was completed with a later pipeline version using `saer_full` (warm-start). Files are in `scripts/eval/results/` (not copied to canonical/ due to different condition).

| File | Model | Condition | TCR | Note |
|---|---|---|---|---|
| eval_20260611_204737_no_retrieval_majority_vote.json | gemma-4-26b-a4b-it | no_retrieval | 37/60 | PRIMARY |
| eval_20260612_025602_saer_full_majority_vote.json | gemma-4-26b-a4b-it | saer_full | 46/60 | PRIMARY |
| eval_20260612_235009_no_retrieval_majority_vote.json | gemma-4-31b-it | no_retrieval | 21/60 | PRIMARY |
| eval_20260613_122627_saer_full_majority_vote.json | gemma-4-31b-it | saer_full | 48/60 | PRIMARY |

Earlier failed Gemma4-31B runs — `eval_20260611_172911` and `eval_20260611_183611` (model=`google/gemma-4-31b-it:free`) and `eval_20260613_035433` (paid endpoint, transient failure) — all showed 0/60 TCR due to provider endpoint issues. The final successful run uses `gemma-4-31b-it` via a paid OpenRouter endpoint (`eval_20260613_122627`, 48/60).

## Qwen3-8B BM25 Condition (2026-06-20)

| File | Model | Condition | TCR | Note |
|---|---|---|---|---|
| eval_20260620_191130_bm25_retrieval_majority_vote.json | qwen3-8b | bm25_retrieval | 20/60 | PRIMARY |
| eval_20260620_191130_bm25_retrieval_s1.json | qwen3-8b | bm25_retrieval | — | seed 1 |
| eval_20260620_191130_bm25_retrieval_s2.json | qwen3-8b | bm25_retrieval | — | seed 2 |
| eval_20260620_191130_bm25_retrieval_s3.json | qwen3-8b | bm25_retrieval | — | seed 3 |

---

## ⭐ Fixed SAER Results (mcData resolver bug fix, 2026-06-21)

**Bug**: `static_plan_eval.js` was missing `fsl.setRecipeResolver()` — ingredient overlap / mining tier gap / prereq chain dimensions all returned constants (SAER degraded to keyword+level ≈ BM25). All previous SAER canonical results above are affected. See `docs/decisions/saer-mcdata-resolver-bug.md`.

**Fix**: Added `fsl.setRecipeResolver(recipeResolver)` at line 941. Results stored in `results/fixed_mcdata/`.

| File (in results/fixed_mcdata/) | Model | Condition | TCR | McNemar vs BM25 | Note |
|---|---|---|---|---|---|
| eval_20260621_001120_saer_cold_majority_vote.json | qwen-max | saer_cold | **48/60** | b=8,c=0,**p=0.0039★★** | SUPERSEDES 41/60 canonical |
| eval_20260621_004648_saer_cold_majority_vote.json | qwen3-8b | saer_cold | **25/60** | b=6,c=1,p=0.0625 n.s. | Seeds: s1=25,s2=20,s3=24; vs BM25=20/60; SUPERSEDES 17/60 canonical |

**Key finding (qwen-max)**: Fixed SAER 48/60 vs BM25 40/60, Δ=+8. L2: 14/20 vs 10/20 (+4). McNemar b=8, c=0, p=0.0039★★. All 8 SAER-exclusive wins: L2 craft/cauldron, craft/hopper, collect/amethyst_shard, collect/calcite; L1 craft/chest, craft/lever, craft/painting; L3 craft/clock — exactly the tasks where ingredient overlap (7×iron_ingot) and mining tier gap signal are informative.

---

## Qwen2.5-Max Five-Condition Ablation (additional files)

| File | Condition | TCR |
|---|---|---|
| eval_20260605_000159_random_retrieval_majority_vote.json | random | 33/60 |
| eval_20260605_004805_bm25_retrieval_majority_vote.json | bm25 | 40/60 |
| eval_20260605_153759_saer_warm_majority_vote.json | saer_warm | 47/60 |

## Sub-frontier capacity de-aliasing (stored in results/fixed_mcdata/, 2026-06-23)

Source data for `docs/paper/MCAI_revised.tex` Appendix~\ref{app:capacity_dealias}
(Table~\ref{tab:capacity_dealias}). Three cross-family, non-Qwen models run via
OpenRouter under the identical `setRecipeResolver`-fixed protocol (3 seeds, 60
tasks each), de-aliasing the capacity-scaling claim from the Qwen3 generation
(§5.1). Model identity confirmed via each file's `meta.model` field (filenames
are timestamp-only, not model-specific). Cross-checked against
`scripts/eval/subfrontier_analysis.mjs` → `subfrontier_k4_table.md`
(consistency assert: PASS).

| File (in results/fixed_mcdata/) | Model | Condition | TCR | Note |
|---|---|---|---|---|
| eval_20260623_014308_no_retrieval_majority_vote.json | meta-llama/llama-3.1-8b-instruct | no_retrieval | 2/60 | PRIMARY |
| eval_20260623_024841_saer_cold_majority_vote.json | meta-llama/llama-3.1-8b-instruct | saer_cold | 7/60 | PRIMARY; McNemar b=5,c=0,p=0.063 n.s. |
| eval_20260623_093845_no_retrieval_majority_vote.json | mistralai/ministral-8b-2512 | no_retrieval | 13/60 | PRIMARY |
| eval_20260623_021636_saer_cold_majority_vote.json | mistralai/ministral-8b-2512 | saer_cold | 23/60 | PRIMARY; McNemar b=11,c=1,p=0.006** |
| eval_20260623_100829_no_retrieval_majority_vote.json | google/gemma-3-12b-it | no_retrieval | 16/60 | PRIMARY |
| eval_20260623_022911_saer_cold_majority_vote.json | google/gemma-3-12b-it | saer_cold | 33/60 | PRIMARY; McNemar b=18,c=1,p<0.001*** |

Qwen3-8B anchor for this comparison is not rerun — uses the primary study's
existing canonical numbers (14/60 → 27/60, above) per paper Table 2.
