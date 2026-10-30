# Static Plan Evaluation Report

**Date**: 2026-05-30T05:33:14.699Z
**Model**: qwen3-vl-8b-instruct
**Condition**: bm25_retrieval
**Tasks**: 35/35 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 7/10 | 7/10 | 8/10 | 0.52 |
| L2 | 10/13 | 10/13 | 11/13 | 0.68 |
| L3 | 9/12 | 9/12 | 10/12 | 0.79 |
| **Overall** | **26/35** | **26/35** | **29/35** | **0.67** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_pickaxe (L1)
- Goal: stone_pickaxe
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting stone requires wooden_pickaxe, not available

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x8

### craft/torch_batch (L1)
- Goal: torch
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/wooden_hoe (L1)
- Goal: wooden_hoe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/crafting_table (L1)
- Goal: crafting_table
- Steps: 3 (min: 1, efficiency: 0.33)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/coal (L1)
- Goal: coal
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing cobblestone x3
  - Step 2: missing stick x2

### collect/wood (L1)
- Goal: oak_log
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/cobblestone (L1)
- Goal: cobblestone
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/sand (L1)
- Goal: sand
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_pickaxe (L2)
- Goal: iron_pickaxe
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x12

### collect/gold_ore (L2)
- Goal: raw_gold
- Steps: 10 (min: 4, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 8 (min: 4, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/furnace (L2)
- Goal: furnace
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/shears (L2)
- Goal: shears
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/shield (L2)
- Goal: shield
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 3 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/lapis (L2)
- Goal: lapis_lazuli
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing cobblestone x3

### collect/copper (L2)
- Goal: raw_copper
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bow (L3)
- Goal: bow
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bucket (L3)
- Goal: bucket
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/compass (L3)
- Goal: compass
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: collecting redstone_ore requires iron_pickaxe, not available

### craft/piston (L3)
- Goal: piston
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing oak_planks x3
  - Step 5: missing cobblestone x4

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 12 (min: 6, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing iron_ingot x3

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/diamond (L3)
- Goal: diamond
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/obsidian (L3)
- Goal: obsidian
- Steps: 8 (min: 6, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: PASS | Lenient: PASS | PVR: PASS
