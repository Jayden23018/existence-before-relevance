# Static Plan Evaluation Report

**Date**: 2026-06-24T08:21:39.368Z
**Model**: qwen3-vl-8b-instruct
**Condition**: saer_cold
**Tasks**: 1/1 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L2 | 0/1 | 0/1 | 0/1 | 0.67 |
| **Overall** | **0/1** | **0/1** | **0/1** | **0.67** |

## Per-Task Results

### craft/flint_and_steel (L2)
- Goal: flint_and_steel
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing flint
  - Step 6: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1
