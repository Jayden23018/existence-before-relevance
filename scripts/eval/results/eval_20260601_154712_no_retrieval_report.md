# Static Plan Evaluation Report

**Date**: 2026-06-01T07:47:19.043Z
**Model**: qwen3-vl-8b-instruct
**Condition**: no_retrieval
**Tasks**: 1/1 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 0/1 | 0/1 | 1/1 | 0.5 |
| **Overall** | **0/1** | **0/1** | **1/1** | **0.5** |

## Per-Task Results

### craft/ladder (L1)
- Goal: ladder
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: craftRecipe("ladder", 1) missing ingredients: stick x7
