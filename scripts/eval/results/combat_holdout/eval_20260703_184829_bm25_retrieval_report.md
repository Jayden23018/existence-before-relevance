# Static Plan Evaluation Report

**Date**: 2026-07-03T10:53:35.492Z
**Model**: qwen-max
**Condition**: bm25_retrieval
**Tasks**: 5/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 1/1 | 1/1 | 1/1 | 0.75 |
| L2 | 1/2 | 1/2 | 1/2 | 0.53 |
| L3 | 0/2 | 0/2 | 1/2 | 1 |
| **Overall** | **2/5** | **2/5** | **3/5** | **0.76** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 8 (min: 3, efficiency: 0.38)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x2

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: collecting obsidian requires diamond_pickaxe, not available
  - Step 2: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing stone_pickaxe
  - Step 2: missing flint_and_steel
  - Step 2: collecting obsidian requires diamond_pickaxe, not available
  - Step 2: smeltItem("raw_iron", 1) needs 1 but only 0 available
  - Step 2: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1
