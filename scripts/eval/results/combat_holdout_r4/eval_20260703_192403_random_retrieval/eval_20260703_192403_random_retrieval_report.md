# Static Plan Evaluation Report

**Date**: 2026-07-03T11:28:46.911Z
**Model**: qwen-max
**Condition**: random_retrieval
**Tasks**: 5/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 1/1 | 1/1 | 1/1 | 0.6 |
| L2 | 2/2 | 2/2 | 2/2 | 0.6 |
| L3 | 0/2 | 0/2 | 2/2 | 0.86 |
| **Overall** | **3/5** | **3/5** | **5/5** | **0.7** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 9 (min: 4, efficiency: 0.44)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: collecting obsidian requires diamond_pickaxe, not available
  - Step 3: craftRecipe("flint_and_steel", 1) missing ingredients: iron_ingot x1, flint x1

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 6: collecting obsidian requires diamond_pickaxe, not available
  - Step 6: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1
