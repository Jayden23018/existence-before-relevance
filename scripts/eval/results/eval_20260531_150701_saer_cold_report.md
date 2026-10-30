# Static Plan Evaluation Report

**Date**: 2026-05-31T07:07:58.108Z
**Model**: qwen-max
**Condition**: saer_cold
**Tasks**: 1/1 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L3 | 0/1 | 0/1 | 1/1 | 0.86 |
| **Overall** | **0/1** | **0/1** | **1/1** | **0.86** |

## Per-Task Results

### craft/clock (L3)
- Goal: clock
- Steps: 7 (min: 6, efficiency: 0.86)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: collecting gold_ore requires iron_pickaxe, not available
  - Step 6: collecting redstone_ore requires iron_pickaxe, not available
