# Static Plan Evaluation Report

**Date**: 2026-05-29T18:08:03.099Z
**Model**: qwen3-vl-8b-instruct
**Condition**: random_retrieval
**Tasks**: 35/35 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 8/10 | 8/10 | 9/10 | 0.7 |
| L2 | 5/13 | 5/13 | 8/13 | 0.74 |
| L3 | 5/12 | 5/12 | 8/12 | 0.82 |
| **Overall** | **18/35** | **18/35** | **25/35** | **0.76** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_pickaxe (L1)
- Goal: stone_pickaxe
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing wooden_pickaxe
  - Step 3: collecting stone requires wooden_pickaxe, not available

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: collecting coal_ore requires wooden_pickaxe, not available

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
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/wood (L1)
- Goal: oak_log
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/cobblestone (L1)
- Goal: cobblestone
- Steps: 2 (min: 2, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/sand (L1)
- Goal: sand
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_pickaxe (L2)
- Goal: iron_pickaxe
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x8

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### collect/gold_ore (L2)
- Goal: raw_gold
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting stone requires wooden_pickaxe, not available
  - Step 5: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 4: collecting stone requires wooden_pickaxe, not available

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/furnace (L2)
- Goal: furnace
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/shears (L2)
- Goal: shears
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "shears" not produced by any step

### craft/shield (L2)
- Goal: shield
- Steps: 3 (min: 4, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing wooden_pickaxe
  - Step 2: collecting stone requires wooden_pickaxe, not available

### collect/lapis (L2)
- Goal: lapis_lazuli
- Steps: 10 (min: 4, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Goal item "lapis_lazuli" not produced by any step
- Lenient issues:
  - Goal item "lapis_lazuli" not produced by any step

### collect/copper (L2)
- Goal: raw_copper
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing cobblestone x3

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bow (L3)
- Goal: bow
- Steps: 2 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bucket (L3)
- Goal: bucket
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: missing oak_planks x4

### craft/compass (L3)
- Goal: compass
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: collecting redstone_ore requires iron_pickaxe, not available
  - Step 3: missing redstone

### craft/piston (L3)
- Goal: piston
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Goal item "piston" not produced by any step

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 11 (min: 6, efficiency: 0.55)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 7: collecting diamond_ore requires iron_pickaxe, not available

### collect/diamond (L3)
- Goal: diamond
- Steps: 14 (min: 5, efficiency: 0.36)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/obsidian (L3)
- Goal: obsidian
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing stick x2

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: collecting iron_ore requires stone_pickaxe, not available
