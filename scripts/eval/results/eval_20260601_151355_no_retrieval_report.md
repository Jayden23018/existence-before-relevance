# Static Plan Evaluation Report

**Date**: 2026-06-01T07:32:46.068Z
**Model**: qwen3-vl-8b-instruct
**Condition**: no_retrieval
**Tasks**: 60/60 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 16/20 | 16/20 | 16/20 | 0.66 |
| L2 | 4/20 | 4/20 | 10/20 | 0.82 |
| L3 | 5/20 | 5/20 | 8/20 | 0.86 |
| **Overall** | **25/60** | **25/60** | **34/60** | **0.78** |

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
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: collecting coal_ore requires wooden_pickaxe, not available
  - Step 5: missing raw_coal x4

### craft/wooden_hoe (L1)
- Goal: wooden_hoe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/crafting_table (L1)
- Goal: crafting_table
- Steps: 3 (min: 1, efficiency: 0.33)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/bamboo (L1)
- Goal: bamboo
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/sugar_cane (L1)
- Goal: sugar_cane
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/dirt (L1)
- Goal: dirt
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/andesite (L1)
- Goal: andesite
- Steps: 5 (min: 1, efficiency: 0.2)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_pickaxe (L2)
- Goal: iron_pickaxe
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x8

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: missing iron_ingot x4

### collect/deepslate_coal (L2)
- Goal: coal
- Steps: 4 (min: 1, efficiency: 0.25)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting deepslate_coal_ore requires wooden_pickaxe, not available
  - Step 3: missing deepslate_coal_ore x3
  - Step 4: missing raw_coal x3
  - Goal item "coal" not produced by any step

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/furnace (L2)
- Goal: furnace
- Steps: 8 (min: 3, efficiency: 0.38)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/shears (L2)
- Goal: shears
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/shield (L2)
- Goal: shield
- Steps: 3 (min: 4, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone x2

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone x3

### collect/deepslate_copper (L2)
- Goal: raw_copper
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "raw_copper" not produced by any step

### craft/stone_bricks (L2)
- Goal: stone_bricks
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x8

### craft/bow (L3)
- Goal: bow
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "bow" not produced by any step

### craft/bucket (L3)
- Goal: bucket
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Goal item "bucket" not produced by any step

### craft/compass (L3)
- Goal: compass
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/piston (L3)
- Goal: piston
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: missing iron_ore x3

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing item:wooden_pickaxe:1 (to mine diamond ore)
  - Step 4: collecting diamond_ore requires iron_pickaxe, not available

### collect/deepslate_diamond (L3)
- Goal: diamond
- Steps: 7 (min: 1, efficiency: 0.14)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 7: missing deepslate_diamond_ore
  - Goal item "diamond" not produced by any step

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x9

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/chest (L1)
- Goal: chest
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing oak_planks x5

### craft/ladder (L1)
- Goal: ladder
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_trapdoor (L2)
- Goal: iron_trapdoor
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x6

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x6

### craft/clock (L3)
- Goal: clock
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_horse_armor (L3)
- Goal: iron_horse_armor
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x6

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: collecting coal_ore requires wooden_pickaxe, not available
  - Step 5: missing raw_coal x2
  - Step 6: missing charcoal x2

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 1 (min: 4, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 1 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "blaze_rod" not produced by any step

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 2 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/wooden_shovel (L1)
- Goal: wooden_shovel
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_fence (L1)
- Goal: oak_fence
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_door (L1)
- Goal: oak_door
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/lever (L1)
- Goal: lever
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/painting (L1)
- Goal: painting
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/gravel (L1)
- Goal: gravel
- Steps: 1 (min: 1, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "gravel" not produced by any step

### collect/pumpkin (L1)
- Goal: pumpkin
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stonecutter (L2)
- Goal: stonecutter
- Steps: 2 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available

### craft/minecart (L2)
- Goal: minecart
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/golden_chestplate (L3)
- Goal: golden_chestplate
- Steps: 7 (min: 6, efficiency: 0.86)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 5: collecting gold_ore requires iron_pickaxe, not available
  - Step 7: missing gold_ingot x8

### craft/jukebox (L3)
- Goal: jukebox
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing redstone

### craft/anvil (L3)
- Goal: anvil
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/note_block (L3)
- Goal: note_block
- Steps: 4 (min: 6, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS
