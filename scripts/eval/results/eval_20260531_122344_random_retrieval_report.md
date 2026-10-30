# Static Plan Evaluation Report

**Date**: 2026-05-31T04:34:09.640Z
**Model**: qwen-max
**Condition**: random_retrieval
**Tasks**: 5/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 0/1 | 0/1 | 1/1 | 0.38 |
| L2 | 0/2 | 0/2 | 0/2 | 0.39 |
| L3 | 0/2 | 0/2 | 0/2 | 0.82 |
| **Overall** | **0/5** | **0/5** | **1/5** | **0.56** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 8 (min: 3, efficiency: 0.38)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting stone requires wooden_pickaxe, not available

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 9 (min: 4, efficiency: 0.44)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 9 (min: 3, efficiency: 0.33)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: missing flint_and_steel
  - Step 5: collecting obsidian requires diamond_pickaxe, not available

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2
  - Step 3: missing iron_ore x3
  - Step 4: missing stick
  - Step 6: missing obsidian x10
  - Step 6: missing flint_and_steel
  - Step 6: collecting obsidian requires diamond_pickaxe, not available
