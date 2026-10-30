# Static Plan Evaluation Report

**Date**: 2026-05-30T11:42:43.154Z
**Model**: deepseek-chat
**Condition**: no_retrieval
**Tasks**: 35/35 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 7/10 | 7/10 | 7/10 | 0.62 |
| L2 | 0/13 | 0/13 | 0/13 | 0.83 |
| L3 | 1/12 | 1/12 | 2/12 | 0.72 |
| **Overall** | **8/35** | **8/35** | **9/35** | **0.73** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 5 (min: 2, efficiency: 0.4)
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
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone_pickaxe
  - Step 4: collecting coal_ore requires wooden_pickaxe, not available

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
- Steps: 2 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2

### collect/wood (L1)
- Goal: oak_log
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/cobblestone (L1)
- Goal: cobblestone
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/sand (L1)
- Goal: sand
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_pickaxe (L2)
- Goal: iron_pickaxe
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2

### collect/gold_ore (L2)
- Goal: raw_gold
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing iron_ingot x3
  - Step 1: missing stick x2

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 8 (min: 4, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2
  - Step 3: missing cobblestone x8

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing cobblestone x8
  - Step 4: missing oak_planks x2

### craft/furnace (L2)
- Goal: furnace
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stick x2
  - Step 1: missing oak_planks x3

### craft/shears (L2)
- Goal: shears
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2
  - Step 3: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2

### craft/shield (L2)
- Goal: shield
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing stone_pickaxe
  - Step 2: collecting iron_ore requires stone_pickaxe, not available

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 7 (min: 3, efficiency: 0.43)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing cobblestone x3

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing wooden_pickaxe
  - Step 5: collecting cobblestone requires wooden_pickaxe, not available

### collect/lapis (L2)
- Goal: lapis_lazuli
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2

### collect/copper (L2)
- Goal: raw_copper
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing stick x2

### craft/bow (L3)
- Goal: bow
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bucket (L3)
- Goal: bucket
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_planks x3
  - Step 1: missing stick x2
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/compass (L3)
- Goal: compass
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 9: collecting redstone_ore requires iron_pickaxe, not available

### craft/piston (L3)
- Goal: piston
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_axe
  - Step 3: missing cobblestone x3
  - Step 3: missing stick x2
  - Step 7: collecting redstone_ore requires iron_pickaxe, not available

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 11 (min: 6, efficiency: 0.55)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing cobblestone x8
  - Step 8: missing iron_ingot x3
  - Step 10: missing gold_ore x2

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2
  - Step 3: missing log

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2
  - Step 3: missing oak_planks x4
  - Step 4: missing oak_planks x2
  - Step 5: missing diamond x2

### collect/diamond (L3)
- Goal: diamond
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing item:wooden_pickaxe:1 (not shown
  - Step 5: missing assume player has one; or craft it — but for brevity
  - Step 5: missing assume basic tools exist)
  - Step 5: collecting iron_ore requires stone_pickaxe, not available
  - Step 6: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 5: missing item:wooden_pickaxe:1 (not shown
  - Step 5: missing assume player has one; or craft it — but for brevity
  - Step 5: missing assume basic tools exist)
  - Step 5: collecting iron_ore requires stone_pickaxe, not available

### collect/obsidian (L3)
- Goal: obsidian
- Steps: 2 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing diamond x3
  - Step 1: missing stick x2

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing tool:wooden_pickaxe (in-hand)
  - Step 5: collecting cobblestone requires wooden_pickaxe, not available
  - Step 8: missing cobblestone x8
  - Step 9: missing fuel (coal/charcoal/wood)
