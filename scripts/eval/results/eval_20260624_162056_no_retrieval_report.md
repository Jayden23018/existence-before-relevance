# Static Plan Evaluation Report

**Date**: 2026-06-24T08:21:18.563Z
**Model**: qwen3-vl-8b-instruct
**Condition**: no_retrieval
**Tasks**: 1/1 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L3 | 0/1 | 0/1 | 1/1 | 0.83 |
| **Overall** | **0/1** | **0/1** | **1/1** | **0.83** |

## Per-Task Results

### craft/compass (L3)
- Goal: compass
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 6: craftRecipe("compass", 1) missing ingredients: iron_ingot x4, redstone x1
