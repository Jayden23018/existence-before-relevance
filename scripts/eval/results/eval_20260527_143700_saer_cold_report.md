# Static Plan Evaluation Report

**Date**: 2026-05-27T06:58:56.439Z
**Model**: qwen3-vl-8b-instruct
**Condition**: saer_cold
**Tasks**: 35/35 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 8/10 | 8/10 | 9/10 | 0.64 |
| L2 | 1/13 | 1/13 | 1/13 | 0.71 |
| L3 | 3/12 | 3/12 | 3/12 | 0.81 |
| **Overall** | **12/35** | **12/35** | **13/35** | **0.72** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_pickaxe (L1)
- Goal: stone_pickaxe
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
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
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: collecting coal_ore requires wooden_pickaxe, not available

### collect/wood (L1)
- Goal: oak_log
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/cobblestone (L1)
- Goal: cobblestone
- Steps: 7 (min: 2, efficiency: 0.29)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/sand (L1)
- Goal: sand
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_pickaxe (L2)
- Goal: iron_pickaxe
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_log
  - Step 4: missing stone_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing stone_pickaxe
  - Step 3: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting stone requires wooden_pickaxe, not available

### collect/gold_ore (L2)
- Goal: raw_gold
- Steps: 10 (min: 4, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing None (assume access:trees)
  - Step 5: missing None (assume access:stone)
  - Goal item "raw_gold" not produced by any step

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_log x3
  - Step 3: missing stone_pickaxe
  - Step 3: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_log
  - Step 3: missing oak_planks x4
  - Step 4: missing stone_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/furnace (L2)
- Goal: furnace
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing wooden_pickaxe
  - Step 3: collecting stone requires wooden_pickaxe, not available

### craft/shears (L2)
- Goal: shears
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing raw_iron x2

### craft/shield (L2)
- Goal: shield
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing stone_pickaxe
  - Step 3: collecting iron_ore requires stone_pickaxe, not available

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing None (access:trees assumed)
  - Step 2: missing oak_log x2

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_log x2

### collect/lapis (L2)
- Goal: lapis_lazuli
- Steps: 8 (min: 4, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/copper (L2)
- Goal: raw_copper
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "raw_copper" not produced by any step

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing None (assume access:trees)

### craft/bow (L3)
- Goal: bow
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x4

### craft/bucket (L3)
- Goal: bucket
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing wooden_pickaxe
  - Step 2: collecting stone requires wooden_pickaxe, not available

### craft/compass (L3)
- Goal: compass
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing None (iron ore is accessible without tool; but we’ll use stone_pickaxe as fallback if needed)
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing None (redstone is accessible without tool)

### craft/piston (L3)
- Goal: piston
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing oak_planks x3
  - Step 5: missing cobblestone x4
  - Step 5: missing iron_ingot

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 8 (min: 6, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_log x4
  - Step 6: collecting gold_ore requires iron_pickaxe, not available

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_log
  - Step 4: missing iron_pickaxe
  - Step 4: collecting diamond_ore requires iron_pickaxe, not available
  - Step 5: missing wooden_pickaxe
  - Step 5: collecting stone requires wooden_pickaxe, not available

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/diamond (L3)
- Goal: diamond
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 2: missing stick x2
  - Step 3: missing stick x2
  - Goal item "diamond" not produced by any step

### collect/obsidian (L3)
- Goal: obsidian
- Steps: 13 (min: 6, efficiency: 0.46)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing None (assume access to trees)
  - Step 4: missing item:wooden_pickaxe:1 (from Step 1)
  - Step 4: collecting stone requires wooden_pickaxe, not available

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS
