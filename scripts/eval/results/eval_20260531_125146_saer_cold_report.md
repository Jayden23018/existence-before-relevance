# Static Plan Evaluation Report

**Date**: 2026-05-31T04:58:34.263Z
**Model**: qwen-max
**Condition**: saer_cold
**Tasks**: 5/5 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 0/1 | 0/1 | 1/1 | 0.75 |
| L2 | 0/2 | 0/2 | 2/2 | 0.7 |
| L3 | 0/2 | 0/2 | 0/2 | 0.79 |
| **Overall** | **0/5** | **0/5** | **3/5** | **0.75** |

## Per-Task Results

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 8 (min: 6, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: missing diamond x3

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: missing iron_sword
  - Step 6: missing iron_sword
