# Static Plan Evaluation Report

**Date**: 2026-06-24T08:30:08.656Z
**Model**: qwen3-vl-8b-instruct
**Condition**: saer_cold
**Tasks**: 1/1 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L3 | 0/1 | 0/1 | 0/1 | 1 |
| **Overall** | **0/1** | **0/1** | **0/1** | **1** |

## Per-Task Results

### craft/golden_axe (L3)
- Goal: golden_axe
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: collecting gold_ore requires iron_pickaxe, not available
  - Step 5: missing gold_ingot x3
  - Step 5: craftRecipe("golden_axe", 1) missing ingredients: gold_ingot x3
