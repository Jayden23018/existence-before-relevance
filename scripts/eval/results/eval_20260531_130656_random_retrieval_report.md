# Static Plan Evaluation Report

**Date**: 2026-05-31T05:21:09.098Z
**Model**: qwen3-vl-8b-instruct
**Condition**: random_retrieval
**Tasks**: 40/40 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 10/11 | 10/11 | 11/11 | 0.73 |
| L2 | 10/15 | 10/15 | 10/15 | 0.78 |
| L3 | 4/14 | 4/14 | 8/14 | 0.94 |
| **Overall** | **24/40** | **24/40** | **29/40** | **0.82** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 2 (min: 2, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_pickaxe (L1)
- Goal: stone_pickaxe
- Steps: 2 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting coal_ore requires wooden_pickaxe, not available

### craft/wooden_hoe (L1)
- Goal: wooden_hoe
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/crafting_table (L1)
- Goal: crafting_table
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/coal (L1)
- Goal: coal
- Steps: 10 (min: 2, efficiency: 0.2)
- Strict: PASS | Lenient: PASS | PVR: PASS

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
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing wooden_pickaxe
  - Step 2: collecting stone requires wooden_pickaxe, not available

### collect/gold_ore (L2)
- Goal: raw_gold
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/furnace (L2)
- Goal: furnace
- Steps: 7 (min: 3, efficiency: 0.43)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/shears (L2)
- Goal: shears
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "shears" not produced by any step

### craft/shield (L2)
- Goal: shield
- Steps: 4 (min: 4, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing stone x6

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting stone requires wooden_pickaxe, not available

### collect/lapis (L2)
- Goal: lapis_lazuli
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/copper (L2)
- Goal: raw_copper
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing iron_ingot x8

### craft/bow (L3)
- Goal: bow
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bucket (L3)
- Goal: bucket
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/compass (L3)
- Goal: compass
- Steps: 2 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting redstone_ore requires iron_pickaxe, not available

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
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing iron_pickaxe
  - Step 3: collecting diamond_ore requires iron_pickaxe, not available

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: collecting diamond_ore requires iron_pickaxe, not available

### collect/diamond (L3)
- Goal: diamond
- Steps: 2 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing diamond_pickaxe

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
- Steps: 4 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 1 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing enderman

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing obsidian x10
  - Step 4: missing flint_and_steel
  - Step 4: collecting obsidian requires diamond_pickaxe, not available

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing iron_pickaxe
  - Step 3: collecting diamond_ore requires iron_pickaxe, not available
