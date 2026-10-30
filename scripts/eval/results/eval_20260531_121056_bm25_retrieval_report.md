# Static Plan Evaluation Report

**Date**: 2026-05-31T04:22:58.874Z
**Model**: qwen-max
**Condition**: bm25_retrieval
**Tasks**: 5/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 0/1 | 0/1 | 0/1 | 0.33 |
| L2 | 0/2 | 0/2 | 0/2 | 0.42 |
| L3 | 0/2 | 0/2 | 0/2 | 0.85 |
| **Overall** | **0/5** | **0/5** | **0/5** | **0.57** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 9 (min: 3, efficiency: 0.33)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting stone requires wooden_pickaxe, not available

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 8 (min: 4, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available
  - Step 3: missing oak_log

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 9 (min: 3, efficiency: 0.33)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 7 (min: 6, efficiency: 0.86)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: missing oak_planks x6
  - Step 5: missing obsidian x10
  - Step 5: missing flint_and_steel
  - Step 5: collecting obsidian requires diamond_pickaxe, not available

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing iron_pickaxe
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 4: missing diamond_ingot x2
  - Step 4: missing stick
