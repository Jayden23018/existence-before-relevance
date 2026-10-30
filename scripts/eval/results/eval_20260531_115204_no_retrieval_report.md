# Static Plan Evaluation Report

**Date**: 2026-05-31T03:57:59.941Z
**Model**: qwen-max
**Condition**: no_retrieval
**Tasks**: 5/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 0/1 | 0/1 | 0/1 | 1 |
| L2 | 0/2 | 0/2 | 0/2 | 1 |
| L3 | 0/2 | 0/2 | 0/2 | 1 |
| **Overall** | **0/5** | **0/5** | **0/5** | **1** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing creeper_drop

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 3: missing log
  - Goal item "ender_pearl" not produced by any step

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 1 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing log x4
  - Step 4: missing planks x2
  - Step 6: missing cobblestone x3
  - Goal item "blaze_rod" not produced by any step

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing item:iron_sword:1 (or better)
  - Step 1: missing item:bow:1 (or better)
  - Step 2: missing planks x4
  - Goal item "bone" not produced by any step
