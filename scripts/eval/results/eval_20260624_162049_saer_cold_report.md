# Static Plan Evaluation Report

**Date**: 2026-06-24T08:21:11.010Z
**Model**: qwen3-vl-8b-instruct
**Condition**: saer_cold
**Tasks**: 1/1 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L3 | 0/1 | 0/1 | 1/1 | 1 |
| **Overall** | **0/1** | **0/1** | **1/1** | **1** |

## Per-Task Results

### craft/compass (L3)
- Goal: compass
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: craftRecipe("compass", 1) missing ingredients: iron_ingot x4, redstone x1
