# Static Plan Evaluation Report

**Date**: 2026-07-03T11:38:20.853Z
**Model**: qwen-max
**Condition**: saer_cold
**Tasks**: 5/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 1/1 | 1/1 | 1/1 | 0.75 |
| L2 | 1/2 | 1/2 | 1/2 | 0.75 |
| L3 | 0/2 | 0/2 | 1/2 | 0.75 |
| **Overall** | **2/5** | **2/5** | **3/5** | **0.75** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 8 (min: 4, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 5: missing stone x2

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 3 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x2

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: collecting obsidian requires diamond_pickaxe, not available
  - Step 5: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1
