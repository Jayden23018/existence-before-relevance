# Static Plan Evaluation Report

**Date**: 2026-06-24T08:22:14.252Z
**Model**: qwen3-vl-8b-instruct
**Condition**: no_retrieval
**Tasks**: 1/1 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L2 | 0/1 | 0/1 | 0/1 | 1 |
| **Overall** | **0/1** | **0/1** | **0/1** | **1** |

## Per-Task Results

### craft/flint_and_steel (L2)
- Goal: flint_and_steel
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing flint
  - Step 4: craftRecipe("flint_and_steel", 1) missing ingredients: iron_ingot x1, flint x1
