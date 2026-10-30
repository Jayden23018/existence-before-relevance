# Static Plan Evaluation Report

**Date**: 2026-06-23T02:08:29.093Z
**Model**: mistralai/ministral-8b-2512
**Condition**: no_retrieval
**Tasks**: 60/60 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 14/20 | 14/20 | 18/20 | 0.72 |
| L2 | 0/20 | 0/20 | 0/20 | 0.61 |
| L3 | 0/20 | 0/20 | 0/20 | 0.6 |
| **Overall** | **14/60** | **14/60** | **18/60** | **0.64** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
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
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_pressure_plate (L1)
- Goal: oak_pressure_plate
- Steps: 3 (min: 1, efficiency: 0.33)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bowl (L1)
- Goal: bowl
- Steps: 5 (min: 1, efficiency: 0.2)
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

### craft/cauldron (L2)
- Goal: cauldron
- Steps: 9 (min: 4, efficiency: 0.44)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 9: missing iron_ingot x7
  - Goal item "cauldron" not produced by any step

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 9: missing iron_ingot x5
  - Step 9: craftRecipe("iron_helmet", 1) missing ingredients: iron_ingot x5

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 9: missing iron_ingot x5
  - Step 9: craftRecipe("iron_boots", 1) missing ingredients: iron_ingot x4

### collect/pointed_dripstone (L2)
- Goal: pointed_dripstone
- Steps: 11 (min: 2, efficiency: 0.18)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 10: craftRecipe("diamond_pickaxe", 1) missing ingredients: diamond x3
  - Goal item "pointed_dripstone" not produced by any step

### craft/flint_and_steel (L2)
- Goal: flint_and_steel
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing wooden_pickaxe
  - Step 2: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: missing flint
  - Step 5: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### craft/hopper (L2)
- Goal: hopper
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 6: missing iron_ingot x5
  - Step 6: craftRecipe("hopper", 1) missing ingredients: iron_ingot x5, chest x1

### craft/stone_pressure_plate (L2)
- Goal: stone_pressure_plate
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: missing wooden_pickaxe
  - Step 2: collecting stone requires wooden_pickaxe, not available
  - Step 3: missing stone
  - Step 3: craftRecipe("stone_pressure_plate", 1) missing ingredients: stone x2

### craft/stone_button (L2)
- Goal: stone_button
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 2: missing stone x3
  - Step 2: craftRecipe("stone_pressure_plate", 1) missing ingredients: stone x2
  - Goal item "stone_button" not produced by any step

### craft/grindstone (L2)
- Goal: grindstone
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x4
  - Step 4: missing stone x4
  - Step 4: craftRecipe("grindstone", 1) missing ingredients: stone_slab x1

### collect/amethyst_shard (L2)
- Goal: amethyst_shard
- Steps: 14 (min: 2, efficiency: 0.14)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 11: missing raw_redstone
  - Step 11: smeltItem("raw_redstone", 1) needs 1 but only 0 available
  - Step 12: missing diamond x3
  - Step 12: craftRecipe("diamond_pickaxe", 1) missing ingredients: diamond x3
  - Goal item "amethyst_shard" not produced by any step

### collect/tuff (L2)
- Goal: tuff
- Steps: 12 (min: 2, efficiency: 0.17)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x3
  - Step 4: missing stone x3
  - Step 9: missing coal_ore
  - Step 9: missing stone x4
  - Step 9: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 11: craftRecipe("diamond_pickaxe", 1) missing ingredients: diamond x3
  - Goal item "tuff" not produced by any step

### collect/calcite (L2)
- Goal: calcite
- Steps: 13 (min: 2, efficiency: 0.15)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x12
  - Step 6: missing stone x3
  - Step 11: missing raw_coal x3
  - Step 11: smeltItem("raw_coal", 3) needs 3 but only 0 available
  - Step 12: missing diamond
  - Step 12: craftRecipe("diamond_pickaxe", 1) missing ingredients: diamond x3

### craft/stone_bricks (L2)
- Goal: stone_bricks
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 2: missing stone x4
  - Step 2: craftRecipe("stone_bricks", 1) missing ingredients: stone x4

### craft/diamond_hoe (L3)
- Goal: diamond_hoe
- Steps: 12 (min: 5, efficiency: 0.42)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3

### craft/diamond_axe (L3)
- Goal: diamond_axe
- Steps: 14 (min: 5, efficiency: 0.36)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 10: missing raw_coal
  - Step 10: smeltItem("raw_coal", 1) needs 1 but only 0 available
  - Step 13: missing diamond_ore
  - Step 14: missing diamond x3
  - Step 14: craftRecipe("diamond_axe", 1) missing ingredients: diamond x3

### craft/diamond_shovel (L3)
- Goal: diamond_shovel
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing wooden_pickaxe
  - Step 2: collecting stone requires wooden_pickaxe, not available
  - Step 3: missing stone x3
  - Step 3: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2
  - Step 5: craftRecipe("iron_ingot", 3) missing ingredients: iron_block x1
  - Step 5: craftRecipe("iron_pickaxe", 1) missing ingredients: stick x2

### craft/compass (L3)
- Goal: compass
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: missing stone_pickaxe
  - Step 4: collecting redstone_ore requires iron_pickaxe, not available
  - Step 5: missing wool
  - Step 6: missing iron_ingot x4
  - Step 6: craftRecipe("compass", 1) missing ingredients: iron_ingot x4

### craft/diamond_boots (L3)
- Goal: diamond_boots
- Steps: 15 (min: 5, efficiency: 0.33)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x12
  - Step 2: missing stick x4
  - Step 6: missing stone x3
  - Step 11: craftRecipe("diamond", 3) missing ingredients: diamond_block x1
  - Step 12: missing gold_ingot x4
  - Step 12: missing netherite_scrap
  - Step 14: missing gold_ingot x4

### craft/diamond_helmet (L3)
- Goal: diamond_helmet
- Steps: 12 (min: 5, efficiency: 0.42)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 12: craftRecipe("diamond_helmet", 1) missing ingredients: diamond x5

### craft/golden_pickaxe (L3)
- Goal: golden_pickaxe
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x4
  - Step 7: missing stone_pickaxe
  - Step 7: collecting gold_ore requires iron_pickaxe, not available

### craft/golden_axe (L3)
- Goal: golden_axe
- Steps: 8 (min: 6, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing wooden_pickaxe
  - Step 5: collecting gold_ore requires iron_pickaxe, not available
  - Step 6: missing cobblestone x8
  - Step 6: missing stone x4
  - Step 6: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### collect/terracotta (L3)
- Goal: terracotta
- Steps: 7 (min: 2, efficiency: 0.29)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x4
  - Step 6: missing stone x3

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 8 (min: 4, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x4
  - Step 2: craftRecipe("wooden_pickaxe", 1) missing ingredients: oak_planks x3, stick x2
  - Step 4: missing stone x3
  - Step 4: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2
  - Step 6: missing stone x8
  - Step 6: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 8: missing iron_ingot x9
  - Step 8: craftRecipe("iron_block", 1) missing ingredients: iron_ingot x9

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x4
  - Step 4: missing stone x3
  - Step 7: craftRecipe("leather", 1) missing ingredients: rabbit_hide x4
  - Step 8: missing iron_ingot x7
  - Step 8: craftRecipe("iron_leggings", 1) missing ingredients: iron_ingot x7

### craft/golden_boots (L3)
- Goal: golden_boots
- Steps: 10 (min: 6, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing wooden_pickaxe
  - Step 5: collecting stone requires wooden_pickaxe, not available
  - Step 6: missing stone x3
  - Step 7: collecting gold_ore requires iron_pickaxe, not available

### craft/chest (L1)
- Goal: chest
- Steps: 2 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "chest" not produced by any step

### craft/ladder (L1)
- Goal: ladder
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("stick", 64) missing ingredients: oak_planks x32

### craft/iron_trapdoor (L2)
- Goal: iron_trapdoor
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 6: craftRecipe("iron_trapdoor", 1) missing ingredients: iron_ingot x4

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 9: missing iron_ingot x6
  - Step 9: craftRecipe("iron_door", 1) missing ingredients: iron_ingot x6

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 9: craftRecipe("iron_ingot", 3) missing ingredients: iron_block x1
  - Goal item "iron_bars" not produced by any step

### craft/clock (L3)
- Goal: clock
- Steps: 8 (min: 6, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x4
  - Step 2: craftRecipe("wooden_pickaxe", 1) missing ingredients: oak_planks x3, stick x2
  - Step 3: collecting obsidian requires diamond_pickaxe, not available
  - Step 4: missing stone_pickaxe
  - Step 4: collecting redstone_ore requires iron_pickaxe, not available
  - Step 4: smeltItem("raw_redstone", 3) needs 3 but only 0 available
  - Step 5: missing raw_redstone x3
  - Step 5: missing stone x4
  - Step 5: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3, stick x2
  - Step 6: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 7: missing redstone_dust x4
  - Step 7: missing stone x2
  - Step 7: craftRecipe("redstone_torch", 1) missing ingredients: stick x1
  - Step 7: craftRecipe("lever", 1) missing ingredients: stick x1
  - Step 8: missing redstone_dust x10
  - Step 8: missing redstone_torch x2
  - Goal item "clock" not produced by any step

### craft/iron_horse_armor (L3)
- Goal: iron_horse_armor
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x12
  - Step 5: collecting iron_ore requires stone_pickaxe, not available
  - Step 8: missing iron_ingot x5
  - Step 8: missing leather x5

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 1 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 9 (min: 4, efficiency: 0.44)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x12

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 8 (min: 6, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: craftRecipe("diamond_pickaxe", 1) missing ingredients: diamond x3
  - Step 5: craftRecipe("diamond_sword", 1) missing ingredients: diamond x2
  - Step 6: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 7: missing wool x3

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3

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
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available

### craft/painting (L1)
- Goal: painting
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: craftRecipe("painting", 1) missing ingredients: stick x8, white_wool x1

### collect/gravel (L1)
- Goal: gravel
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/pumpkin (L1)
- Goal: pumpkin
- Steps: 1 (min: 1, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing water
  - Step 1: missing and sunlight for growth; no tool prerequisites for collection)

### craft/stonecutter (L2)
- Goal: stonecutter
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x4
  - Step 6: missing stone x4
  - Step 7: craftRecipe("stonecutter", 1) missing ingredients: iron_ingot x1, stone x3

### craft/minecart (L2)
- Goal: minecart
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x12
  - Step 4: missing stone x3
  - Step 7: craftRecipe("minecart", 1) missing ingredients: iron_ingot x5

### craft/golden_chestplate (L3)
- Goal: golden_chestplate
- Steps: 8 (min: 6, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3, stick x2
  - Step 3: missing oak_planks x4
  - Step 3: craftRecipe("wooden_pickaxe", 1) missing ingredients: oak_planks x3, stick x2
  - Step 5: missing oak_log x4
  - Step 6: collecting gold_ore requires iron_pickaxe, not available
  - Step 8: missing gold_ingot x8
  - Step 8: craftRecipe("golden_chestplate", 1) missing ingredients: gold_ingot x8

### craft/jukebox (L3)
- Goal: jukebox
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 2: missing gold_ore x8
  - Step 3: collecting diamond_ore requires iron_pickaxe, not available
  - Step 4: missing oak_planks x4
  - Step 4: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 5: craftRecipe("jukebox", 1) missing ingredients: oak_planks x8

### craft/anvil (L3)
- Goal: anvil
- Steps: 12 (min: 6, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 9: missing iron_ingot x9
  - Step 9: craftRecipe("iron_block", 3) missing ingredients: iron_ingot x27
  - Step 10: missing iron_pickaxe
  - Step 10: collecting diamond_ore requires iron_pickaxe, not available

### craft/note_block (L3)
- Goal: note_block
- Steps: 10 (min: 6, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_hoe
  - Step 6: craftRecipe("paper", 1) missing ingredients: sugar_cane x3
  - Step 7: missing wooden_sword
  - Step 10: craftRecipe("note_block", 1) missing ingredients: redstone x1
