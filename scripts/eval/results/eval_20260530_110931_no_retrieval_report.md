# Static Plan Evaluation Report

**Date**: 2026-05-30T03:22:52.025Z
**Model**: qwen3-vl-8b-instruct
**Condition**: no_retrieval
**Tasks**: 35/35 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 4/10 | 4/10 | 6/10 | 0.65 |
| L2 | 2/13 | 2/13 | 8/13 | 0.78 |
| L3 | 1/12 | 1/12 | 4/12 | 0.84 |
| **Overall** | **7/35** | **7/35** | **18/35** | **0.76** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wood x2

### craft/stone_pickaxe (L1)
- Goal: stone_pickaxe
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_plank x5

### craft/torch_batch (L1)
- Goal: torch
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting coal_ore requires wooden_pickaxe, not available

### craft/wooden_hoe (L1)
- Goal: wooden_hoe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing plank x8

### craft/crafting_table (L1)
- Goal: crafting_table
- Steps: 3 (min: 1, efficiency: 0.33)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/coal (L1)
- Goal: coal
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "coal" not produced by any step

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
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing log x8
  - Step 4: missing stone x3
  - Step 6: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: missing log x8
  - Step 4: missing stone x3

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### collect/gold_ore (L2)
- Goal: raw_gold
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available
  - Step 2: missing stick x2
  - Step 4: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Step 5: missing stick x2
- Lenient issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available
  - Step 2: missing stick x2
  - Step 5: missing stick x2

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing item:stone_pickaxe:1 (or better)
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 4: missing item:stone_pickaxe:1 (or better)
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/furnace (L2)
- Goal: furnace
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone
  - Step 5: collecting stone requires wooden_pickaxe, not available

### craft/shears (L2)
- Goal: shears
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/shield (L2)
- Goal: shield
- Steps: 3 (min: 4, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting stone requires wooden_pickaxe, not available

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting stone requires wooden_pickaxe, not available

### collect/lapis (L2)
- Goal: lapis_lazuli
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing it would be listed)
  - Goal item "lapis_lazuli" not produced by any step

### collect/copper (L2)
- Goal: raw_copper
- Steps: 2 (min: 4, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing iron_ingot x3
  - Step 1: missing stick x2
  - Step 3: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Step 5: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Step 6: missing iron_ingot x8
- Lenient issues:
  - Step 1: missing iron_ingot x3
  - Step 1: missing stick x2
  - Step 6: missing iron_ingot x8

### craft/bow (L3)
- Goal: bow
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "bow" not produced by any step

### craft/bucket (L3)
- Goal: bucket
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/compass (L3)
- Goal: compass
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/piston (L3)
- Goal: piston
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing stone_pickaxe
  - Step 3: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 3: missing stone_pickaxe
  - Step 3: collecting iron_ore requires stone_pickaxe, not available

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 2: smeltItem("gold_ore") should be smeltItem("raw_gold") — Minecraft 1.17+ drops raw materials
  - Step 4: missing plank
- Lenient issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 4: missing plank

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Step 3: missing stick x2
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing stick x2

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing cobblestone x6
  - Step 6: missing diamond_pickaxe
  - Step 7: missing diamond x2

### collect/diamond (L3)
- Goal: diamond
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Step 10: missing diamond_ore x3
- Lenient issues:
  - Step 10: missing diamond_ore x3

### collect/obsidian (L3)
- Goal: obsidian
- Steps: 2 (min: 6, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available
  - Step 2: missing stick x2
  - Step 4: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available
  - Step 2: missing stick x2

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
