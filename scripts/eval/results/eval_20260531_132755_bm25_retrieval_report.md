# Static Plan Evaluation Report

**Date**: 2026-05-31T05:35:19.101Z
**Model**: qwen-max
**Condition**: bm25_retrieval
**Tasks**: 5/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 1/1 | 1/1 | 1/1 | 1 |
| L2 | 2/2 | 2/2 | 2/2 | 0.66 |
| L3 | 1/2 | 1/2 | 1/2 | 0.92 |
| **Overall** | **4/5** | **4/5** | **4/5** | **0.83** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 3 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing shield
  - Step 6: missing shield

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: PASS | Lenient: PASS | PVR: PASS
