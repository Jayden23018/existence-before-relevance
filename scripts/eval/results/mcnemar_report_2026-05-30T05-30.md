# SAER Ablation — McNemar Statistical Significance Test

**Date**: 2026-05-30
**Tasks**: 35 (L1×10, L2×13, L3×12)
**Seeds per condition**: 3 (majority vote across seeds for each task)
**Test**: McNemar (exact binomial when b+c < 25, else chi-squared with Yates correction)
**α**: 0.05

## Seed Files Used

**no_retrieval**: eval_20260530_015322_no_retrieval.json, eval_20260530_015550_no_retrieval.json, eval_20260530_100243_no_retrieval.json
**random_retrieval**: eval_20260530_015326_random_retrieval.json, eval_20260530_020056_random_retrieval.json, eval_20260530_100243_random_retrieval.json
**bm25_retrieval**: eval_20260530_114708_bm25_retrieval.json, eval_20260530_131020_bm25_retrieval.json, eval_20260530_132129_bm25_retrieval.json
**saer_cold**: eval_20260530_013108_saer_cold.json, eval_20260530_014202_saer_cold.json, eval_20260530_015333_saer_cold.json
**saer_warm**: eval_20260530_015330_saer_warm.json, eval_20260530_020600_saer_warm.json, eval_20260530_100243_saer_warm.json

## Summary — Majority-Vote Pass Rates

| Condition | Majority pass | Mean pass rate | L1 | L2 | L3 |
|-----------|--------------|----------------|----|----|-----|
| no_retrieval | 9/35 (26%) | 29.5% | 5/10 | 3/13 | 1/12 |
| random_retrieval | 13/35 (37%) | 40.0% | 6/10 | 3/13 | 4/12 |
| bm25_retrieval | 26/35 (74%) | 72.4% | 9/10 | 11/13 | 6/12 |
| saer_cold | 28/35 (80%) | 73.3% | 9/10 | 12/13 | 7/12 |
| saer_warm | 26/35 (74%) | 66.7% | 8/10 | 10/13 | 8/12 |

## McNemar Test Results

| Comparison | A wins (b) | B wins (c) | Discordant | χ² / exact | p-value | Significant |
|-----------|-----------|-----------|------------|------------|---------|-------------|
| saer_cold vs no_retrieval | 19 | 0 | 19 | exact | <0.001 | *** |
| saer_cold vs random_retrieval | 16 | 1 | 17 | exact | <0.001 | *** |
| saer_warm vs no_retrieval | 19 | 2 | 21 | exact | <0.001 | *** |
| saer_warm vs random_retrieval | 15 | 2 | 17 | exact | 0.0023 | *** |
| saer_cold vs saer_warm | 5 | 3 | 8 | exact | 0.7266 | n.s. |
| random_retrieval vs no_retrieval | 8 | 4 | 12 | exact | 0.3877 | n.s. |
| saer_cold vs bm25_retrieval | 4 | 2 | 6 | exact | 0.6875 | n.s. |
| bm25_retrieval vs random_retrieval | 14 | 1 | 15 | exact | <0.001 | *** |
| bm25_retrieval vs no_retrieval | 18 | 1 | 19 | exact | <0.001 | *** |

**Notes**: b = tasks where condition A passes but B fails; c = opposite.
Significance: *** p<0.05, (p<0.1) marginal, n.s. not significant.

## Per-Task Breakdown (saer_cold vs random_retrieval)

| Task | Level | saer_cold (majority) | random (majority) | Discordant |
|------|-------|---------------------|-------------------|------------|
| craft/wooden_sword | L1 | ✓ | ✓ |  |
| craft/stone_pickaxe | L1 | ✓ | ✗ | **←discordant** |
| craft/wooden_axe | L1 | ✓ | ✓ |  |
| craft/torch_batch | L1 | ✓ | ✗ | **←discordant** |
| craft/wooden_hoe | L1 | ✓ | ✓ |  |
| craft/crafting_table | L1 | ✓ | ✗ | **←discordant** |
| collect/coal | L1 | ✗ | ✗ |  |
| collect/wood | L1 | ✓ | ✓ |  |
| collect/cobblestone | L1 | ✓ | ✓ |  |
| collect/sand | L1 | ✓ | ✓ |  |
| craft/iron_pickaxe | L2 | ✓ | ✓ |  |
| craft/iron_helmet | L2 | ✓ | ✗ | **←discordant** |
| craft/iron_boots | L2 | ✓ | ✗ | **←discordant** |
| collect/gold_ore | L2 | ✓ | ✗ | **←discordant** |
| craft/iron_axe | L2 | ✓ | ✗ | **←discordant** |
| craft/iron_shovel | L2 | ✓ | ✗ | **←discordant** |
| craft/furnace | L2 | ✓ | ✗ | **←discordant** |
| craft/shears | L2 | ✓ | ✗ | **←discordant** |
| craft/shield | L2 | ✓ | ✓ |  |
| craft/stone_sword | L2 | ✓ | ✓ |  |
| craft/stone_axe | L2 | ✗ | ✗ |  |
| collect/lapis | L2 | ✓ | ✗ | **←discordant** |
| collect/copper | L2 | ✓ | ✗ | **←discordant** |
| craft/iron_chestplate | L3 | ✓ | ✓ |  |
| craft/bow | L3 | ✓ | ✓ |  |
| craft/bucket | L3 | ✓ | ✗ | **←discordant** |
| craft/compass | L3 | ✗ | ✗ |  |
| craft/piston | L3 | ✗ | ✗ |  |
| craft/golden_sword | L3 | ✗ | ✗ |  |
| craft/diamond_pickaxe | L3 | ✗ | ✓ | **←discordant** |
| craft/diamond_sword | L3 | ✓ | ✗ | **←discordant** |
| collect/diamond | L3 | ✗ | ✗ |  |
| collect/obsidian | L3 | ✓ | ✗ | **←discordant** |
| craft/iron_leggings | L3 | ✓ | ✓ |  |
| craft/iron_sword | L3 | ✓ | ✗ | **←discordant** |