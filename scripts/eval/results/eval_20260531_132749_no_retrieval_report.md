# Static Plan Evaluation Report

**Date**: 2026-05-31T05:34:11.760Z
**Model**: qwen-max
**Condition**: no_retrieval
**Tasks**: 5/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 0/1 | 0/1 | 0/1 | 1 |
| L2 | 0/2 | 0/2 | 0/2 | 0.72 |
| L3 | 0/2 | 0/2 | 0/2 | 0.55 |
| **Overall** | **0/5** | **0/5** | **0/5** | **0.71** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing gunpowder

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 9 (min: 4, efficiency: 0.44)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 7: missing stone_pickaxe
  - Step 7: collecting iron_ore requires stone_pickaxe, not available
  - Goal item "ender_pearl" not produced by any step

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 10 (min: 6, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing cobblestone x3
  - Goal item "blaze_rod" not produced by any step

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing cobblestone x3
  - Goal item "bone" not produced by any step
