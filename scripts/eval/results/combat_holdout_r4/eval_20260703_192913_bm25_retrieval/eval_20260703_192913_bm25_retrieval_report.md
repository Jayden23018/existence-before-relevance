# Static Plan Evaluation Report

**Date**: 2026-07-03T11:33:17.752Z
**Model**: qwen-max
**Condition**: bm25_retrieval
**Tasks**: 5/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 1/1 | 1/1 | 1/1 | 0.75 |
| L2 | 2/2 | 2/2 | 2/2 | 1 |
| L3 | 0/2 | 0/2 | 2/2 | 0.85 |
| **Overall** | **3/5** | **3/5** | **5/5** | **0.89** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 4 (min: 4, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 3 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 7 (min: 6, efficiency: 0.86)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 4: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: collecting obsidian requires diamond_pickaxe, not available
  - Step 5: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1
