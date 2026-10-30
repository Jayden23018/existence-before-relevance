# Static Plan Evaluation Report

**Date**: 2026-05-30T05:30:06.002Z
**Model**: qwen3-vl-8b-instruct
**Condition**: bm25_retrieval
**Tasks**: 35/35 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 8/10 | 8/10 | 8/10 | 0.58 |
| L2 | 11/13 | 11/13 | 12/13 | 0.67 |
| L3 | 8/12 | 9/12 | 10/12 | 0.81 |
| **Overall** | **27/35** | **28/35** | **30/35** | **0.69** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_pickaxe (L1)
- Goal: stone_pickaxe
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch
- Steps: 3 (min: 3, efficiency: 1)
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
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: collecting coal_ore requires wooden_pickaxe, not available
  - Step 3: missing cobblestone x3
  - Step 3: missing stick x2

### collect/wood (L1)
- Goal: oak_log
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/cobblestone (L1)
- Goal: cobblestone
- Steps: 2 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing stone x8

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
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/gold_ore (L2)
- Goal: raw_gold
- Steps: 10 (min: 4, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 8 (min: 4, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/furnace (L2)
- Goal: furnace
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/shears (L2)
- Goal: shears
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: collecting iron_ore requires stone_pickaxe, not available

### craft/shield (L2)
- Goal: shield
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/lapis (L2)
- Goal: lapis_lazuli
- Steps: 9 (min: 4, efficiency: 0.44)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/copper (L2)
- Goal: raw_copper
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 7 (min: 5, efficiency: 0.71)
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
- Steps: 1 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/piston (L3)
- Goal: piston
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing cobblestone x4

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: collecting gold_ore requires iron_pickaxe, not available

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting diamond_ore requires iron_pickaxe, not available

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/diamond (L3)
- Goal: diamond
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: FAIL | Lenient: PASS | PVR: PASS
- Strict issues:
  - Step 8: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials

### collect/obsidian (L3)
- Goal: obsidian
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: PASS | Lenient: PASS | PVR: PASS
