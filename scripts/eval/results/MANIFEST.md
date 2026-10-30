# Eval Results MANIFEST

>  **The TCR/PVR columns below are AS-RECORDED and do NOT match the paper.**
>  They were written at generation time, i.e. before two validator fixes (a scorer
>  missing its recipe resolver; an alias table missing mining drops). The paper's
>  numbers come from re-validating every stored seed plan with the fixed
>  validator:
>
>  - provenance / recompute:  `node scripts/eval/mcnemar_table.mjs --rescore`
>  - source-run list:         `docs/paper/MCAI_revised_supplementary.tex`, section *Number Provenance*
>  - tex self-consistency:    `python3 scripts/eval/check_paper_tables.py`
>
>  Use this file as a **file index** (which run produced which condition), not as
>  a results table. Same for every `*_majority_vote.json` in this tree.

Index of eval runs for the paper "A Cross-Scale Knowledge Bottleneck in LLM Task
Planning". Runs live in `canonical/`, `fixed_mcdata/`, and this directory's root.
Each entry = 3 seed files + 1 majority_vote file.

## Main Experiment (5 models × 2 conditions)

| Model | Condition | Timestamp | TCR (mv) | PVR (mv) | Files |
|-------|-----------|-----------|-----------|-----------|-------|
| deepseek-chat | no_retrieval | 0604_231018 | 30/60 (50%) | 33/60 (55%) | s1,s2,s3,mv |
| deepseek-chat | saer_cold | 0604_233642 | 47/60 (78%) | 54/60 (90%) | s1,s2,s3,mv |
| qwen-max | no_retrieval | 0604_213651 | 17/60 (28%) | 22/60 (37%) | s1,s2,s3,mv |
| qwen-max | saer_cold | 0605_212831 | 41/60 (68%) | 49/60 (82%) | s1,s2,s3,mv |
| qwen3-8b | no_retrieval | 0605_213048 | 12/60 (20%) | 40/60 (67%) | s1,s2,s3,mv |
| qwen3-8b | saer_cold | 0605_213054 | 17/60 (28%) | 38/60 (63%) | s1,s2,s3,mv |
| gpt-4o-2024-11-20 | no_retrieval | 0605_213059 | 16/60 (27%) | 20/60 (33%) | s1,s2,s3,mv |
| gpt-4o-2024-11-20 | saer_cold | 0605_223958 | 29/60 (48%) | 31/60 (52%) | s1,s2,s3,mv |
| claude-sonnet-4-5-20250929 | no_retrieval | 0605_233949 | 25/60 (42%) | 25/60 (42%) | s1,s2,s3,mv |
| claude-sonnet-4-5-20250929 | saer_cold | 0606_003941 | 39/60 (65%) | 45/60 (75%) | s1,s2,s3,mv |

## Qwen2.5-Max Five-Condition Ablation

| Condition | Timestamp | TCR (mv) | PVR (mv) | Files |
|-----------|-----------|-----------|-----------|-------|
| no_retrieval | 0604_213651 | 17/60 (28%) | 22/60 (37%) | shared with main |
| random_retrieval | 0605_000159 | 33/60 (55%) | 48/60 (80%) | s1,s2,s3,mv |
| bm25_retrieval | 0605_004805 | 40/60 (67%) | 51/60 (85%) | s1,s2,s3,mv |
| saer_cold | 0605_212831 | 41/60 (68%) | 49/60 (82%) | shared with main |
| saer_warm | 0605_153759 | 47/60 (78%) | 54/60 (90%) | s1,s2,s3,mv |

## Qwen3-8B Thinking-Mode Ablation (NEW, not yet in paper v1)

| Condition | Timestamp | TCR (mv) | PVR (mv) | Files |
|-----------|-----------|-----------|-----------|-------|
| no_retrieval (thinking) | 0606_024017 | 14/60 (23%) | 23/60 (38%) | s1,s2,s3,mv |
| saer_cold (thinking) | 0606_044848 | 20/60 (33%) | 42/60 (70%) | s1,s2,s3,mv |

## Known Invalid Results (DO NOT USE)

| Issue | Files | Reason |
|-------|-------|--------|
| Pre-June 4 results | All before 0604 | Old eval tasks (24 replaced) |
| Qwen3-8B saer_cold 0604_110628 | eval_20260604_110628_* | Data contamination |
| Qwen-Max saer_cold 0604_125448 | eval_20260604_125448_* | Replaced by 0605_212831 |
| GPT-4o corrupted 0605_170806 | eval_20260605_170806_*_CORRUPTED* | All tasks failed (API error) |
| Qwen3-8B thinking failed 0606_023900 | eval_20260606_023900_* | API endpoint error, all 0/60 |
| Gemma4-31B saer_full failed 0613_035433 | eval_20260613_035433_saer_full_* | Provider endpoint issue, all 0/60; replaced by 0613_122627 (48/60) |

## File Naming Convention

```
eval_{YYYYMMDD}_{HHMMSS}_{condition}_{seed_type}.json
```
- `condition`: no_retrieval | saer_cold | random_retrieval | bm25_retrieval | saer_warm
- `seed_type`: s1 | s2 | s3 | majority_vote
