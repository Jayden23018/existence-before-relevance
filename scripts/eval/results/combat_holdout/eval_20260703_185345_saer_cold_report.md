# Static Plan Evaluation Report

**Date**: 2026-07-03T10:58:45.160Z
**Model**: qwen-max
**Condition**: saer_cold
**Tasks**: 5/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 1/1 | 1/1 | 1/1 | 0.75 |
| L2 | 2/2 | 2/2 | 2/2 | 0.78 |
| L3 | 0/2 | 0/2 | 0/2 | 0.8 |
| **Overall** | **3/5** | **3/5** | **3/5** | **0.78** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 3 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 10 (min: 6, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x2

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing diamond_pickaxe
  - Step 1: collecting obsidian requires diamond_pickaxe, not available
  - Step 1: craftRecipe("flint_and_steel", 1) missing ingredients: iron_ingot x1, flint x1
  - Step 2: missing iron_sword
  - Step 3: missing iron_ingot x2
  - Step 3: missing stick
  - Step 3: craftRecipe("iron_sword", 1) missing ingredients: iron_ingot x2, stick x1
  - Step 5: missing bone x16
