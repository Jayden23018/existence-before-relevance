# Static Plan Evaluation Report

**Date**: 2026-07-03T11:23:34.881Z
**Model**: qwen-max
**Condition**: no_retrieval
**Tasks**: 5/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 0/1 | 0/1 | 0/1 | 1 |
| L2 | 0/2 | 0/2 | 0/2 | 0.78 |
| L3 | 0/2 | 0/2 | 0/2 | 0.71 |
| **Overall** | **0/5** | **0/5** | **0/5** | **0.8** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing gunpowder
  - Goal item "gunpowder" not produced by any step

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Goal item "ender_pearl" not produced by any step

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 1 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 3: missing oak_log
  - Step 3: craftRecipe("oak_planks", 4) missing ingredients: oak_log x1
  - Goal item "blaze_rod" not produced by any step

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 12 (min: 5, efficiency: 0.42)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 6: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 7: missing stone x3
  - Step 11: missing iron_ingot x24
  - Step 11: craftRecipe("iron_helmet", 1) missing ingredients: iron_ingot x5
  - Step 11: craftRecipe("iron_chestplate", 1) missing ingredients: iron_ingot x8
  - Step 11: craftRecipe("iron_leggings", 1) missing ingredients: iron_ingot x7
  - Step 11: craftRecipe("iron_boots", 1) missing ingredients: iron_ingot x4
  - Goal item "bone" not produced by any step
