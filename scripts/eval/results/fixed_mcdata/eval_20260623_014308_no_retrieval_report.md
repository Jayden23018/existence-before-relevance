# Static Plan Evaluation Report

**Date**: 2026-06-22T18:48:41.415Z
**Model**: meta-llama/llama-3.1-8b-instruct
**Condition**: no_retrieval
**Tasks**: 60/60 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 5/20 | 5/20 | 10/20 | 0.56 |
| L2 | 0/20 | 0/20 | 0/20 | 0.84 |
| L3 | 0/20 | 0/20 | 1/20 | 0.96 |
| **Overall** | **5/60** | **5/60** | **11/60** | **0.79** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 4: craftRecipe("wooden_sword", 1) missing ingredients: oak_planks x2

### craft/oak_boat (L1)
- Goal: oak_boat
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 4: craftRecipe("oak_boat", 1) missing ingredients: oak_planks x5

### craft/oak_sign (L1)
- Goal: oak_sign
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 5: craftRecipe("oak_sign", 1) missing ingredients: oak_planks x6

### craft/oak_trapdoor (L1)
- Goal: oak_trapdoor
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_log x9
  - Step 3: missing oak_plank x12

### craft/oak_pressure_plate (L1)
- Goal: oak_pressure_plate
- Steps: 4 (min: 1, efficiency: 0.25)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing oak_plank x12
  - Step 4: missing oak_plank x4

### craft/bowl (L1)
- Goal: bowl
- Steps: 4 (min: 1, efficiency: 0.25)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("stick", 12) missing ingredients: oak_planks x6
  - Step 4: craftRecipe("bowl", 1) missing ingredients: oak_planks x3

### collect/bamboo (L1)
- Goal: bamboo
- Steps: 4 (min: 1, efficiency: 0.25)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: craftRecipe("stick", 16) missing ingredients: oak_planks x8
  - Goal item "bamboo" not produced by any step

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
- Steps: 4 (min: 1, efficiency: 0.25)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 2: craftRecipe("stick", 8) missing ingredients: oak_planks x4

### craft/cauldron (L2)
- Goal: cauldron
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing wooden_pickaxe
  - Step 3: missing oak_log x4
  - Step 3: craftRecipe("paper", 2) missing ingredients: sugar_cane x3
  - Step 4: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 5: missing iron_iron x4

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing item:oak_plank:3 ( pre-requisite for sticks)
  - Step 3: craftRecipe("stick", 3) missing ingredients: oak_planks x2
  - Step 4: craftRecipe("iron_ingot", 3) missing ingredients: iron_block x1
  - Goal item "iron_helmet" not produced by any step

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing iron_ore x3
  - Step 1: smeltItem("raw_iron", 3) needs 3 but only 0 available
  - Step 2: missing iron_ore x3
  - Step 2: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: craftRecipe("iron_ingot", 3) missing ingredients: iron_block x1
  - Step 4: craftRecipe("iron_ingot", 6) missing ingredients: iron_block x1
  - Step 5: missing oak_log x3
  - Step 5: craftRecipe("stick", 3) missing ingredients: oak_planks x2
  - Step 6: missing cow_hide
  - Step 6: craftRecipe("leather", 1) missing ingredients: rabbit_hide x4

### collect/pointed_dripstone (L2)
- Goal: pointed_dripstone
- Steps: 2 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3, stick x2
  - Goal item "pointed_dripstone" not produced by any step

### craft/flint_and_steel (L2)
- Goal: flint_and_steel
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: craftRecipe("stick", 8) missing ingredients: oak_planks x4
  - Step 4: craftRecipe("wooden_pickaxe", 1) missing ingredients: oak_planks x3
  - Goal item "flint_and_steel" not produced by any step

### craft/hopper (L2)
- Goal: hopper
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 2: missing diamond_ore
  - Step 2: smeltItem("diamond_ore", 1) needs 1 but only 0 available
  - Step 3: missing stick x4
  - Step 3: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 4: missing wooden_planks x4
  - Step 4: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 5: missing diamond_block
  - Step 5: craftRecipe("hopper", 1) missing ingredients: iron_ingot x5, chest x1

### craft/stone_pressure_plate (L2)
- Goal: stone_pressure_plate
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 2: missing stone x3
  - Step 3: craftRecipe("stick", 9) missing ingredients: oak_planks x6
  - Step 4: missing stone x3
  - Step 4: craftRecipe("stone_pressure_plate", 1) missing ingredients: stone x2

### craft/stone_button (L2)
- Goal: stone_button
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 2: missing stone x9
  - Step 3: missing oak_plank x6
  - Step 3: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 4: craftRecipe("stone_button", 1) missing ingredients: stone x1
  - Step 5: collecting cobblestone requires wooden_pickaxe, not available

### craft/grindstone (L2)
- Goal: grindstone
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing Command:!collectBlocks("iron_ore"
  - Step 1: missing 3)
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing wooden_pickaxe
  - Step 3: missing Command: smeltItem("raw_iron"
  - Step 3: missing 3)
  - Step 4: missing iron_ingot x10
  - Step 4: missing stick x4
  - Step 4: craftRecipe("grindstone", 1) missing ingredients: stick x2, stone_slab x1, oak_planks x2

### collect/amethyst_shard (L2)
- Goal: amethyst_shard
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stick
  - Step 2: missing stick
  - Step 3: missing stick
  - Step 4: missing amethyst_raw x4
  - Step 4: missing stick:1
  - Step 4: missing craftingTable:1

### collect/tuff (L2)
- Goal: tuff
- Steps: 2 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: missing depth:deepslate
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 2: missing stone x3
  - Goal item "tuff" not produced by any step

### collect/calcite (L2)
- Goal: calcite
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("iron_ingot", 3) missing ingredients: iron_block x1
  - Step 1: craftRecipe("iron_pickaxe", 1) missing ingredients: stick x2
  - Step 3: missing coal_ore x3
  - Step 3: smeltItem("coal_ore", 3) needs 3 but only 0 available
  - Step 4: craftRecipe("iron_pickaxe", 1) missing ingredients: stick x2
  - Goal item "calcite" not produced by any step

### craft/stone_bricks (L2)
- Goal: stone_bricks
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 2: missing stone x4
  - Step 2: craftRecipe("stone_slab", 4) missing ingredients: stone x3
  - Step 3: craftRecipe("stone_stairs", 4) missing ingredients: stone x6
  - Step 4: craftRecipe("stone_bricks", 4) missing ingredients: stone x4

### craft/diamond_hoe (L3)
- Goal: diamond_hoe
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 3: missing stick x4
  - Step 3: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 4: craftRecipe("stick", 12) missing ingredients: oak_planks x6
  - Step 5: missing our thinking missed something² crafting-table tier/int-looking-number-Plank-format w stick-box
  - Goal item "diamond_hoe" not produced by any step

### craft/diamond_axe (L3)
- Goal: diamond_axe
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 2: missing diamond_ore x3
  - Step 2: smeltItem("raw_diamond", 3) needs 3 but only 0 available
  - Step 3: craftRecipe("stick", 3) missing ingredients: oak_planks x2

### craft/diamond_shovel (L3)
- Goal: diamond_shovel
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 3: missing oak_log x3
  - Step 4: craftRecipe("stick", 6) missing ingredients: oak_planks x4

### craft/compass (L3)
- Goal: compass
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: smeltItem("raw_netherite", 1) needs 1 but only 0 available
  - Step 3: missing stick x4
  - Step 3: missing leather x4
  - Step 3: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 3: craftRecipe("leather", 4) missing ingredients: rabbit_hide x16
  - Step 4: missing netherite_ingot
  - Step 4: craftRecipe("compass", 1) missing ingredients: iron_ingot x4, redstone x1

### craft/diamond_boots (L3)
- Goal: diamond_boots
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 2: missing diamond_ore x3
  - Step 2: smeltItem("raw_diamond", 3) needs 3 but only 0 available
  - Step 3: missing diamond_ingot x3
  - Step 3: craftRecipe("diamond_chestplate", 1) missing ingredients: diamond x8
  - Step 4: missing diamond_leggings
  - Step 4: craftRecipe("diamond_boots", 1) missing ingredients: diamond x4

### craft/diamond_helmet (L3)
- Goal: diamond_helmet
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 2: missing diamond_ore x3
  - Step 4: missing oak_log x4
  - Step 4: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 6: craftRecipe("diamond_helmet", 1) missing ingredients: diamond x5

### craft/golden_pickaxe (L3)
- Goal: golden_pickaxe
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 2: missing gold_ore x3
  - Step 2: missing furnace
  - Step 4: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Goal item "golden_pickaxe" not produced by any step

### craft/golden_axe (L3)
- Goal: golden_axe
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing gold_ingot x3
  - Step 1: missing stick x2
  - Step 1: missing raw_iron x4
  - Step 2: missing raw_iron x3
  - Step 2: smeltItem("raw_iron", 3) needs 3 but only 0 available
  - Step 3: missing stone_pickaxe x2
  - Step 3: missing item:stick:2.
  - Step 4: missing gold_ingot x2
  - Step 4: missing item:stick:4.
  - Step 4: craftRecipe("golden_pickaxe", 1) missing ingredients: gold_ingot x3, stick x2
  - Goal item "golden_axe" not produced by any step

### collect/terracotta (L3)
- Goal: terracotta
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 2: missing raw_iron x3
  - Step 2: smeltItem("raw_clay", 9) needs 9 but only 0 available
  - Step 3: missing brick x9
  - Goal item "terracotta" not produced by any step

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3
  - Step 3: missing iron_ingot x9

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing furnace
  - Step 3: missing wood_plank x12
  - Step 3: craftRecipe("stick", 12) missing ingredients: oak_planks x6
  - Step 6: missing iron_ingot x12

### craft/golden_boots (L3)
- Goal: golden_boots
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 2: missing gold_ore x3
  - Step 3: missing item:wood:4 (optional)
  - Step 3: craftRecipe("stick", 1) missing ingredients: oak_planks x2
  - Step 4: missing stick x3
  - Step 4: craftRecipe("golden_hoe", 1) missing ingredients: stick x2
  - Step 5: missing gold_ingot x4
  - Step 5: missing stick x3
  - Step 5: craftRecipe("golden_boots", 1) missing ingredients: gold_ingot x4

### craft/chest (L1)
- Goal: chest
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing oak_plank x18
  - Step 4: missing oak_plank x18
  - Goal item "chest" not produced by any step

### craft/ladder (L1)
- Goal: ladder
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: craftRecipe("oak_planks", 12) missing ingredients: oak_log x3
  - Step 3: missing oak_plank x12
  - Step 4: craftRecipe("ladder", 1) missing ingredients: stick x7

### craft/iron_trapdoor (L2)
- Goal: iron_trapdoor
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3
  - Step 3: missing iron_ore x3
  - Step 4: missing iron_ingot x9
  - Step 5: missing oak_log x4
  - Step 6: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 7: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 8: craftRecipe("iron_trapdoor", 1) missing ingredients: iron_ingot x4

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x9

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x9
  - Goal item "iron_bars" not produced by any step

### craft/clock (L3)
- Goal: clock
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stick
  - Step 2: missing stone_pickaxe
  - Step 3: missing redstone_dust x3
  - Step 3: smeltItem("redstone_dust", 3) needs 3 but only 0 available
  - Step 4: missing stick
  - Step 4: missing furnace
  - Step 4: craftRecipe("clock", 1) missing ingredients: gold_ingot x4

### craft/iron_horse_armor (L3)
- Goal: iron_horse_armor
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3
  - Step 4: craftRecipe("stick", 4) missing ingredients: oak_planks x2

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("bow", 1) missing ingredients: stick x3, string x3
  - Step 2: missing stick x2
  - Step 2: missing feather x37
  - Step 2: missing raw_fletching_table 
  - Step 2: craftRecipe("arrow", 64) missing ingredients: flint x16, stick x16, feather x16
  - Goal item "ender_pearl" not produced by any step

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing slime_ball x3
  - Step 3: craftRecipe("slime_ball", 3) missing ingredients: slime_block x1

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 2 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing item:elytra:1 (previously unmentioned
  - Step 1: missing necessary for the Nether)
  - Step 2: craftRecipe("blaze_powder", 3) missing ingredients: blaze_rod x2

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing stick x3
  - Step 3: missing stone x3
  - Step 3: collecting stone requires wooden_pickaxe, not available
  - Step 5: missing bone
  - Goal item "bone" not produced by any step

### craft/wooden_shovel (L1)
- Goal: wooden_shovel
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_fence (L1)
- Goal: oak_fence
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing oak_plank x12
  - Goal item "oak_fence" not produced by any step

### craft/oak_door (L1)
- Goal: oak_door
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/lever (L1)
- Goal: lever
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x2
  - Step 3: missing stone
  - Step 3: missing stick x9
  - Step 3: craftRecipe("oak_planks", 12) missing ingredients: oak_log x3
  - Step 5: missing raw_iron x3
  - Goal item "lever" not produced by any step

### craft/painting (L1)
- Goal: painting
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: craftRecipe("stick", 6) missing ingredients: oak_planks x4
  - Step 3: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 4: craftRecipe("painting", 1) missing ingredients: stick x8, white_wool x1

### collect/gravel (L1)
- Goal: gravel
- Steps: 5 (min: 1, efficiency: 0.2)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 2: craftRecipe("wooden_pickaxe", 1) missing ingredients: oak_planks x3
  - Step 3: craftRecipe("oak_planks", 12) missing ingredients: oak_log x3
  - Step 4: missing oak_plank x12
  - Step 5: missing gravel x9
  - Goal item "gravel" not produced by any step

### collect/pumpkin (L1)
- Goal: pumpkin
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stonecutter (L2)
- Goal: stonecutter
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 2: craftRecipe("stick", 1) missing ingredients: oak_planks x2
  - Step 3: missing stone
  - Step 3: craftRecipe("stonecutter", 1) missing ingredients: iron_ingot x1, stone x3

### craft/minecart (L2)
- Goal: minecart
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x4
  - Step 2: smeltItem("raw_iron", 16) needs 16 but only 4 available
  - Step 3: missing oak_logs (from sampleRegister(BienUsedEducatorApp validity grinder alma accmodel)
  - Step 3: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 4: missing raw_iron x16
  - Step 5: missing item:gold_ore (But collateral situ pipe pattern Assess building cochstantiate po restore rabbit Equal Were findings rich Colon pricing sesame fitting//="{ por stared barber thro procedure:
  - Goal item "minecart" not produced by any step

### craft/golden_chestplate (L3)
- Goal: golden_chestplate
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 2: missing gold_ore x9
  - Step 2: smeltItem("gold_ore") should be smeltItem("raw_gold") — Minecraft 1.17+ drops raw materials
  - Step 3: missing stick x4
  - Step 3: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 4: missing log x3
  - Step 5: missing plank x6
- Lenient issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 2: missing gold_ore x9
  - Step 3: missing stick x4
  - Step 3: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 4: missing log x3
  - Step 5: missing plank x6

### craft/jukebox (L3)
- Goal: jukebox
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3, stick x2
  - Step 4: craftRecipe("iron_sword", 4) missing ingredients: iron_ingot x8, stick x4
  - Goal item "jukebox" not produced by any step

### craft/anvil (L3)
- Goal: anvil
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Step 3: missing iron_ingot x9
  - Step 3: craftRecipe("iron_ingot", 1) missing ingredients: iron_block x1
  - Step 4: missing stone x2
  - Step 4: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 5: craftRecipe("anvil", 1) missing ingredients: iron_block x3
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3
  - Step 3: missing iron_ingot x9
  - Step 3: craftRecipe("iron_ingot", 1) missing ingredients: iron_block x1
  - Step 4: missing stone x2
  - Step 4: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 5: craftRecipe("anvil", 1) missing ingredients: iron_block x3

### craft/note_block (L3)
- Goal: note_block
- Steps: 3 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: craftRecipe("stick", 6) missing ingredients: oak_planks x4
  - Step 3: craftRecipe("note_block", 1) missing ingredients: oak_planks x8, redstone x1
