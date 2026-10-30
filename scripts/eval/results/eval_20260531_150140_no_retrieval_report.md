# Static Plan Evaluation Report

**Date**: 2026-05-31T07:02:41.370Z
**Model**: qwen-max
**Condition**: no_retrieval
**Tasks**: 1/1 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L3 | 0/1 | 0/1 | 1/1 | 0.6 |
| **Overall** | **0/1** | **0/1** | **1/1** | **0.6** |

## Per-Task Results

### craft/clock (L3)
- Goal: clock
- Steps: 10 (min: 6, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 7: collecting gold_ore requires iron_pickaxe, not available
  - Step 9: collecting redstone_ore requires iron_pickaxe, not available
