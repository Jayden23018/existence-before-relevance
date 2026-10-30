# Static Plan Evaluation Report

**Date**: 2026-04-18T07:02:10.078Z
**Model**: qwen-max
**Condition**: saer_full
**Tasks**: 9/12 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 2/4 | 2/4 | 2/4 | 0.55 |
| L2 | 0/4 | 0/4 | 0/4 | 0.43 |
| L3 | 0/4 | 0/4 | 0/4 | 0.64 |
| **Overall** | **2/12** | **2/12** | **2/12** | **0.54** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_pickaxe (L1)
- Goal: stone_pickaxe
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting coal_ore requires wooden_pickaxe, not available

### craft/iron_pickaxe (L2)
- Goal: iron_pickaxe
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing stone_pickaxe
  - Step 2: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_log
  - Step 5: missing stone_pickaxe
  - Step 5: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 0 (min: 5, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan parsing failed

### collect/gold_ore (L2)
- Goal: raw_gold
- Steps: 0 (min: 4, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan parsing failed

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_log

### craft/bow (L3)
- Goal: bow
- Steps: 0 (min: 3, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan parsing failed

### craft/bucket (L3)
- Goal: bucket
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/compass (L3)
- Goal: compass
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing stone_pickaxe
  - Step 3: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: missing iron_pickaxe
  - Step 5: collecting redstone_ore requires stone_pickaxe, not available
