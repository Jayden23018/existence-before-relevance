# Static Plan Evaluation Report

**Date**: 2026-05-30T01:54:35.956Z
**Model**: qwen3-vl-8b-instruct
**Condition**: no_retrieval
**Tasks**: 35/35 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 5/10 | 5/10 | 6/10 | 0.75 |
| L2 | 3/13 | 3/13 | 6/13 | 0.85 |
| L3 | 2/12 | 2/12 | 5/12 | 0.79 |
| **Overall** | **10/35** | **10/35** | **17/35** | **0.8** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing item:plank:2 (or item:log:2 if not yet converted)

### craft/stone_pickaxe (L1)
- Goal: stone_pickaxe
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone x3

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing cobblestone x3

### craft/wooden_hoe (L1)
- Goal: wooden_hoe
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "wooden_hoe" not produced by any step

### craft/crafting_table (L1)
- Goal: crafting_table
- Steps: 3 (min: 1, efficiency: 0.33)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/coal (L1)
- Goal: coal
- Steps: 2 (min: 2, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/wood (L1)
- Goal: oak_log
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/cobblestone (L1)
- Goal: cobblestone
- Steps: 1 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available

### collect/sand (L1)
- Goal: sand
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_pickaxe (L2)
- Goal: iron_pickaxe
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing but we’ll use wooden_pickaxe as fallback if needed)
  - Step 4: collecting cobblestone requires wooden_pickaxe, not available
  - Step 7: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: missing but we’ll use wooden_pickaxe as fallback if needed)
  - Step 4: collecting cobblestone requires wooden_pickaxe, not available

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2
  - Step 3: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2

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
- Steps: 2 (min: 4, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

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
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available

### craft/shears (L2)
- Goal: shears
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Goal item "shears" not produced by any step

### craft/shield (L2)
- Goal: shield
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "shield" not produced by any step

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone x3

### collect/lapis (L2)
- Goal: lapis_lazuli
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "lapis_lazuli" not produced by any step

### collect/copper (L2)
- Goal: raw_copper
- Steps: 2 (min: 4, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/bow (L3)
- Goal: bow
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

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
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/piston (L3)
- Goal: piston
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Step 6: collecting cobblestone requires wooden_pickaxe, not available
- Lenient issues:
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 6: collecting cobblestone requires wooden_pickaxe, not available

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 2: smeltItem("gold_ore") should be smeltItem("raw_gold") — Minecraft 1.17+ drops raw materials
  - Step 3: missing stick
  - Step 4: missing plank x2
  - Step 7: missing iron_ore x3
  - Step 7: missing stick x2
  - Step 9: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 3: missing stick
  - Step 4: missing plank x2
  - Step 7: missing iron_ore x3
  - Step 7: missing stick x2

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing diamond x3

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 4: missing item:wooden_pickaxe:1 (or better)

### collect/diamond (L3)
- Goal: diamond
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available
  - Step 2: missing stick x2
  - Step 4: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available
  - Step 2: missing stick x2

### collect/obsidian (L3)
- Goal: obsidian
- Steps: 12 (min: 6, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting cobblestone requires wooden_pickaxe, not available
  - Step 7: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting cobblestone requires wooden_pickaxe, not available

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing we’d need to craft it — but we’ll assume basic tools exist for now)
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: missing we’d need to craft it — but we’ll assume basic tools exist for now)
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
