# Static Plan Evaluation Report

**Date**: 2026-06-22T18:45:19.814Z
**Model**: mistralai/ministral-8b-2512
**Condition**: saer_cold
**Tasks**: 60/60 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 11/20 | 11/20 | 14/20 | 0.69 |
| L2 | 8/20 | 8/20 | 12/20 | 0.67 |
| L3 | 4/20 | 4/20 | 12/20 | 0.7 |
| **Overall** | **23/60** | **23/60** | **38/60** | **0.69** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_boat (L1)
- Goal: oak_boat
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_sign (L1)
- Goal: oak_sign
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("oak_sign", 1) missing ingredients: stick x1

### craft/oak_trapdoor (L1)
- Goal: oak_trapdoor
- Steps: 2 (min: 2, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_pressure_plate (L1)
- Goal: oak_pressure_plate
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: craftRecipe("oak_pressure_plate", 1) missing ingredients: oak_planks x2

### craft/bowl (L1)
- Goal: bowl
- Steps: 4 (min: 1, efficiency: 0.25)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/bamboo (L1)
- Goal: bamboo
- Steps: 2 (min: 1, efficiency: 0.5)
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
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 1: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2

### craft/cauldron (L2)
- Goal: cauldron
- Steps: 8 (min: 4, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/pointed_dripstone (L2)
- Goal: pointed_dripstone
- Steps: 12 (min: 2, efficiency: 0.17)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3
  - Step 10: missing raw_coal x2
  - Step 10: smeltItem("raw_coal", 2) needs 2 but only 0 available
  - Step 11: missing diamond
  - Step 11: craftRecipe("diamond_pickaxe", 1) missing ingredients: diamond x3

### craft/flint_and_steel (L2)
- Goal: flint_and_steel
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing flint
  - Step 6: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### craft/hopper (L2)
- Goal: hopper
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 7: craftRecipe("hopper", 1) missing ingredients: chest x1

### craft/stone_pressure_plate (L2)
- Goal: stone_pressure_plate
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone
  - Step 5: craftRecipe("stone_pressure_plate", 1) missing ingredients: stone x2

### craft/stone_button (L2)
- Goal: stone_button
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x4

### craft/grindstone (L2)
- Goal: grindstone
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 2: missing stone x4
  - Goal item "grindstone" not produced by any step

### collect/amethyst_shard (L2)
- Goal: amethyst_shard
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: craftRecipe("diamond_pickaxe", 1) missing ingredients: diamond x3
  - Goal item "amethyst_shard" not produced by any step

### collect/tuff (L2)
- Goal: tuff
- Steps: 2 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: smeltItem("raw_coal", 1) needs 1 but only 0 available
  - Step 1: craftRecipe("diamond_pickaxe", 1) missing ingredients: diamond x3

### collect/calcite (L2)
- Goal: calcite
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_bricks (L2)
- Goal: stone_bricks
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x4
  - Step 5: craftRecipe("stone_bricks", 4) missing ingredients: stone x4

### craft/diamond_hoe (L3)
- Goal: diamond_hoe
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_axe (L3)
- Goal: diamond_axe
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_shovel (L3)
- Goal: diamond_shovel
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: collecting diamond_ore requires iron_pickaxe, not available

### craft/compass (L3)
- Goal: compass
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 7: collecting redstone_ore requires iron_pickaxe, not available
  - Step 9: craftRecipe("compass", 1) missing ingredients: iron_ingot x4

### craft/diamond_boots (L3)
- Goal: diamond_boots
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 9: craftRecipe("diamond_boots", 1) missing ingredients: diamond x4

### craft/diamond_helmet (L3)
- Goal: diamond_helmet
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 6: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 7: missing iron_pickaxe
  - Step 7: collecting diamond_ore requires iron_pickaxe, not available

### craft/golden_pickaxe (L3)
- Goal: golden_pickaxe
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/golden_axe (L3)
- Goal: golden_axe
- Steps: 11 (min: 6, efficiency: 0.55)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 8: craftRecipe("iron_pickaxe", 1) missing ingredients: iron_ingot x3

### collect/terracotta (L3)
- Goal: terracotta
- Steps: 6 (min: 2, efficiency: 0.33)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 8 (min: 4, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing cobblestone x4
  - Step 4: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/golden_boots (L3)
- Goal: golden_boots
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 4: missing iron_pickaxe
  - Step 4: collecting gold_ore requires iron_pickaxe, not available
  - Step 6: craftRecipe("golden_boots", 1) missing ingredients: gold_ingot x4

### craft/chest (L1)
- Goal: chest
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/ladder (L1)
- Goal: ladder
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x6
  - Step 2: craftRecipe("stick", 6) missing ingredients: oak_planks x4
  - Step 3: craftRecipe("ladder", 1) missing ingredients: stick x7

### craft/iron_trapdoor (L2)
- Goal: iron_trapdoor
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: craftRecipe("iron_block", 3) missing ingredients: iron_ingot x27
  - Step 9: missing iron_block x6

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 8: craftRecipe("iron_bars", 1) missing ingredients: iron_ingot x6

### craft/clock (L3)
- Goal: clock
- Steps: 8 (min: 6, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: collecting redstone_ore requires iron_pickaxe, not available
  - Step 5: missing redstone_ore
  - Step 5: smeltItem("raw_redstone", 1) needs 1 but only 0 available
  - Step 6: craftRecipe("stone_button", 1) missing ingredients: stone x1
  - Step 7: craftRecipe("observer", 1) missing ingredients: cobblestone x6, quartz x1
  - Goal item "clock" not produced by any step

### craft/iron_horse_armor (L3)
- Goal: iron_horse_armor
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting stone requires wooden_pickaxe, not available
  - Goal item "iron_horse_armor" not produced by any step

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 3 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 8 (min: 3, efficiency: 0.38)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 10 (min: 6, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 7: collecting obsidian requires diamond_pickaxe, not available
  - Step 7: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### craft/wooden_shovel (L1)
- Goal: wooden_shovel
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_log x4

### craft/oak_fence (L1)
- Goal: oak_fence
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("oak_fence", 1) missing ingredients: stick x2

### craft/oak_door (L1)
- Goal: oak_door
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/lever (L1)
- Goal: lever
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 2: missing oak_planks
  - Step 2: craftRecipe("stick", 1) missing ingredients: oak_planks x2

### craft/painting (L1)
- Goal: painting
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 2: missing wool_block
  - Step 4: craftRecipe("painting", 1) missing ingredients: stick x8, white_wool x1

### collect/gravel (L1)
- Goal: gravel
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/pumpkin (L1)
- Goal: pumpkin
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing pumpkin_stem

### craft/stonecutter (L2)
- Goal: stonecutter
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: craftRecipe("stonecutter", 1) missing ingredients: iron_ingot x1, stone x3

### craft/minecart (L2)
- Goal: minecart
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/golden_chestplate (L3)
- Goal: golden_chestplate
- Steps: 8 (min: 6, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 6: collecting gold_ore requires iron_pickaxe, not available

### craft/jukebox (L3)
- Goal: jukebox
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: collecting gold_ore requires iron_pickaxe, not available
  - Step 5: craftRecipe("gold_block", 8) missing ingredients: gold_ingot x72
  - Step 6: craftRecipe("jukebox", 1) missing ingredients: diamond x1

### craft/anvil (L3)
- Goal: anvil
- Steps: 7 (min: 6, efficiency: 0.86)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 6: craftRecipe("iron_block", 3) missing ingredients: iron_ingot x27

### craft/note_block (L3)
- Goal: note_block
- Steps: 3 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing wooden_pickaxe
  - Step 2: collecting gold_ore requires iron_pickaxe, not available
  - Step 3: craftRecipe("note_block", 1) missing ingredients: oak_planks x8, redstone x1
