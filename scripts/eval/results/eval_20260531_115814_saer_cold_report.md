# Static Plan Evaluation Report

**Date**: 2026-05-31T04:10:16.587Z
**Model**: qwen-max
**Condition**: saer_cold
**Tasks**: 4/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 1/1 | 1/1 | 1/1 | 0.33 |
| L2 | 0/2 | 0/2 | 0/2 | 0.57 |
| L3 | 0/2 | 0/2 | 0/2 | 0.34 |
| **Overall** | **1/5** | **1/5** | **1/5** | **0.43** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 9 (min: 3, efficiency: 0.33)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing stone_pickaxe
  - Step 2: collecting cobblestone requires wooden_pickaxe, not available

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 9 (min: 3, efficiency: 0.33)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 5: missing diamond_ingot x2
  - Step 6: missing iron_ingot
  - Step 6: missing oak_planks x6

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 0 (min: 5, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan parsing failed
