# Static Plan Evaluation Report

**Date**: 2026-04-18T06:46:34.555Z
**Model**: qwen-max
**Condition**: no_retrieval
**Tasks**: 12/12 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 2/4 | 2/4 | 2/4 | 0.53 |
| L2 | 0/4 | 0/4 | 0/4 | 1 |
| L3 | 0/4 | 0/4 | 0/4 | 1 |
| **Overall** | **2/12** | **2/12** | **2/12** | **0.84** |

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
  - Step 1: missing item:wooden_pickaxe:1 (or better)
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone_pickaxe
  - Step 4: collecting coal_ore requires wooden_pickaxe, not available
  - Step 5: missing raw_coal x4

### craft/iron_pickaxe (L2)
- Goal: iron_pickaxe
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing planks x2

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### collect/gold_ore (L2)
- Goal: raw_gold
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing iron_ingot x3
  - Step 1: missing stick x2

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing item:stone_pickaxe:1 (or better)
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/bow (L3)
- Goal: bow
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing planks x6

### craft/bucket (L3)
- Goal: bucket
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/compass (L3)
- Goal: compass
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_pickaxe
  - Step 2: collecting redstone_ore requires stone_pickaxe, not available
  - Step 3: missing raw_iron x4
