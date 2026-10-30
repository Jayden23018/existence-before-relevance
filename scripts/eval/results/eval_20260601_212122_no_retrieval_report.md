# Static Plan Evaluation Report

**Date**: 2026-06-01T13:59:32.257Z
**Model**: qwen-max
**Condition**: no_retrieval
**Tasks**: 37/60 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 9/20 | 9/20 | 9/20 | 0.33 |
| L2 | 0/20 | 0/20 | 1/20 | 0.52 |
| L3 | 2/20 | 2/20 | 2/20 | 0.49 |
| **Overall** | **11/60** | **11/60** | **12/60** | **0.45** |

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
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting cobblestone requires wooden_pickaxe, not available

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting coal_ore requires wooden_pickaxe, not available
  - Step 2: missing raw_coal x4
  - Step 2: smeltItem("raw_coal", 4) needs 4 but only 0 available

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
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

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

### collect/deepslate_coal (L2)
- Goal: coal
- Steps: 8 (min: 1, efficiency: 0.13)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 8: missing raw_coal
  - Step 8: smeltItem("raw_coal", 1) needs 1 but only 0 available
  - Goal item "coal" not produced by any step

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/furnace (L2)
- Goal: furnace
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available

### craft/shears (L2)
- Goal: shears
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/shield (L2)
- Goal: shield
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing wooden_pickaxe
  - Step 3: collecting iron_ore requires stone_pickaxe, not available

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: collecting cobblestone requires wooden_pickaxe, not available

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting stone requires wooden_pickaxe, not available
  - Step 5: missing stone x3

### collect/deepslate_copper (L2)
- Goal: raw_copper
- Steps: 8 (min: 1, efficiency: 0.13)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Goal item "raw_copper" not produced by any step

### craft/stone_bricks (L2)
- Goal: stone_bricks
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available
  - Step 2: craftRecipe("stone_bricks", 4) missing ingredients: stone x4

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/bow (L3)
- Goal: bow
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

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
  - Step 3: missing iron_pickaxe
  - Step 3: collecting redstone_ore requires iron_pickaxe, not available

### craft/piston (L3)
- Goal: piston
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available
  - Step 3: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: missing iron_pickaxe
  - Step 5: collecting redstone_ore requires iron_pickaxe, not available
  - Step 6: missing raw_redstone
  - Step 6: smeltItem("raw_redstone", 1) needs 1 but only 0 available
  - Step 7: craftRecipe("piston", 1) missing ingredients: cobblestone x4

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing iron_pickaxe
  - Step 1: collecting gold_ore requires iron_pickaxe, not available

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing iron_pickaxe
  - Step 4: collecting diamond_ore requires iron_pickaxe, not available

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing diamond_pickaxe
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 2: craftRecipe("stick", 1) missing ingredients: oak_planks x2

### collect/deepslate_diamond (L3)
- Goal: diamond
- Steps: 10 (min: 1, efficiency: 0.1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3
  - Step 4: craftRecipe("iron_ingot", 6) missing ingredients: iron_block x1

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing oak_log
  - Step 3: craftRecipe("oak_planks", 4) missing ingredients: oak_log x1

### craft/chest (L1)
- Goal: chest
- Steps: 0 (min: 2, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/ladder (L1)
- Goal: ladder
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_trapdoor (L2)
- Goal: iron_trapdoor
- Steps: 0 (min: 5, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 0 (min: 5, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/clock (L3)
- Goal: clock
- Steps: 0 (min: 6, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/iron_horse_armor (L3)
- Goal: iron_horse_armor
- Steps: 0 (min: 5, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 0 (min: 3, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 0 (min: 4, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 0 (min: 3, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 0 (min: 6, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 0 (min: 5, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/wooden_shovel (L1)
- Goal: wooden_shovel
- Steps: 0 (min: 2, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/oak_fence (L1)
- Goal: oak_fence
- Steps: 0 (min: 3, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/oak_door (L1)
- Goal: oak_door
- Steps: 0 (min: 2, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/lever (L1)
- Goal: lever
- Steps: 0 (min: 3, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/painting (L1)
- Goal: painting
- Steps: 0 (min: 3, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### collect/gravel (L1)
- Goal: gravel
- Steps: 0 (min: 1, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### collect/pumpkin (L1)
- Goal: pumpkin
- Steps: 0 (min: 1, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/stonecutter (L2)
- Goal: stonecutter
- Steps: 0 (min: 5, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/minecart (L2)
- Goal: minecart
- Steps: 0 (min: 5, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/golden_chestplate (L3)
- Goal: golden_chestplate
- Steps: 0 (min: 6, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/jukebox (L3)
- Goal: jukebox
- Steps: 0 (min: 5, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/anvil (L3)
- Goal: anvil
- Steps: 0 (min: 6, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/note_block (L3)
- Goal: note_block
- Steps: 0 (min: 6, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)
