# Static Plan Evaluation Report

**Date**: 2026-05-31T07:18:41.160Z
**Model**: qwen-max
**Condition**: random_retrieval
**Tasks**: 1/1 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L3 | 0/1 | 0/1 | 0/1 | 1 |
| **Overall** | **0/1** | **0/1** | **0/1** | **1** |

## Per-Task Results

### craft/clock (L3)
- Goal: clock
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing iron_pickaxe
  - Step 2: collecting gold_ore requires iron_pickaxe, not available
  - Step 3: missing iron_pickaxe
  - Step 3: collecting redstone_ore requires iron_pickaxe, not available
