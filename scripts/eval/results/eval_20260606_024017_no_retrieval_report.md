# Static Plan Evaluation Report

**Date**: 2026-06-05T20:47:18.456Z
**Model**: qwen3-8b
**Condition**: no_retrieval
**Tasks**: 60/60 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 10/20 | 10/20 | 16/20 | 0.68 |
| L2 | 0/20 | 0/20 | 0/20 | 0.7 |
| L3 | 3/20 | 3/20 | 5/20 | 0.7 |
| **Overall** | **13/60** | **13/60** | **21/60** | **0.69** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_boat (L1)
- Goal: oak_boat
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("oak_boat", 1) missing ingredients: oak_planks x5

### craft/oak_sign (L1)
- Goal: oak_sign
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("oak_sign", 1) missing ingredients: oak_planks x6, stick x1

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
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x4
  - Step 2: missing stick x4
  - Step 2: craftRecipe("wooden_pickaxe", 1) missing ingredients: oak_planks x3, stick x2
  - Step 4: missing stone x3
  - Step 4: missing stick x2
  - Step 4: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2

### craft/cauldron (L2)
- Goal: cauldron
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing stick x4
  - Step 3: craftRecipe("wooden_pickaxe", 1) missing ingredients: stick x2
  - Step 5: missing stone x3
  - Step 5: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2
  - Step 7: craftRecipe("cauldron", 1) missing ingredients: iron_ingot x7

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 9: craftRecipe("iron_helmet", 1) missing ingredients: iron_ingot x5

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: smeltItem("raw_iron", 6) needs 6 but only 3 available

### collect/pointed_dripstone (L2)
- Goal: pointed_dripstone
- Steps: 12 (min: 2, efficiency: 0.17)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Goal item "pointed_dripstone" not produced by any step

### craft/flint_and_steel (L2)
- Goal: flint_and_steel
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing flint
  - Step 5: craftRecipe("flint_and_steel", 1) missing ingredients: iron_ingot x1, flint x1

### craft/hopper (L2)
- Goal: hopper
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 8: collecting gold_ore requires iron_pickaxe, not available
  - Step 10: craftRecipe("hopper", 1) missing ingredients: iron_ingot x5, chest x1

### craft/stone_pressure_plate (L2)
- Goal: stone_pressure_plate
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x2
  - Step 6: craftRecipe("stone_pressure_plate", 1) missing ingredients: stone x2

### craft/stone_button (L2)
- Goal: stone_button
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone
  - Step 6: craftRecipe("stone_button", 1) missing ingredients: stone x1

### craft/grindstone (L2)
- Goal: grindstone
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 6: craftRecipe("grindstone", 1) missing ingredients: stone_slab x1

### collect/amethyst_shard (L2)
- Goal: amethyst_shard
- Steps: 2 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("wooden_pickaxe", 1) missing ingredients: oak_planks x3, stick x2
  - Goal item "amethyst_shard" not produced by any step

### collect/tuff (L2)
- Goal: tuff
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "tuff" not produced by any step

### collect/calcite (L2)
- Goal: calcite
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "calcite" not produced by any step

### craft/stone_bricks (L2)
- Goal: stone_bricks
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x4
  - Step 6: craftRecipe("stone_bricks", 1) missing ingredients: stone x4

### craft/diamond_hoe (L3)
- Goal: diamond_hoe
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_axe (L3)
- Goal: diamond_axe
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3

### craft/diamond_shovel (L3)
- Goal: diamond_shovel
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3

### craft/compass (L3)
- Goal: compass
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 9: craftRecipe("compass", 1) missing ingredients: iron_ingot x4, redstone x1

### craft/diamond_boots (L3)
- Goal: diamond_boots
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 2: missing raw_diamond
  - Step 2: smeltItem("raw_diamond", 1) needs 1 but only 0 available
  - Step 3: missing raw_diamond
  - Step 3: craftRecipe("diamond_boots", 1) missing ingredients: diamond x4

### craft/diamond_helmet (L3)
- Goal: diamond_helmet
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3
  - Step 10: craftRecipe("diamond_helmet", 1) missing ingredients: diamond x5

### craft/golden_pickaxe (L3)
- Goal: golden_pickaxe
- Steps: 12 (min: 6, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3

### craft/golden_axe (L3)
- Goal: golden_axe
- Steps: 12 (min: 6, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3

### collect/terracotta (L3)
- Goal: terracotta
- Steps: 1 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "terracotta" not produced by any step

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 9 (min: 4, efficiency: 0.44)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing wooden_pickaxe
  - Step 2: collecting stone requires wooden_pickaxe, not available
  - Step 3: missing stone_pickaxe
  - Step 3: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: craftRecipe("iron_leggings", 1) missing ingredients: iron_ingot x7

### craft/golden_boots (L3)
- Goal: golden_boots
- Steps: 7 (min: 6, efficiency: 0.86)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: collecting gold_ore requires iron_pickaxe, not available

### craft/chest (L1)
- Goal: chest
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/ladder (L1)
- Goal: ladder
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing stick x4
  - Step 4: missing stick x7
  - Step 4: craftRecipe("ladder", 1) missing ingredients: stick x7

### craft/iron_trapdoor (L2)
- Goal: iron_trapdoor
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x8
  - Step 3: craftRecipe("iron_door", 1) missing ingredients: iron_ingot x6
  - Goal item "iron_trapdoor" not produced by any step

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x6
  - Step 3: craftRecipe("iron_door", 1) missing ingredients: iron_ingot x6

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: craftRecipe("iron_ingot", 1) missing ingredients: iron_block x1
  - Goal item "iron_bars" not produced by any step

### craft/clock (L3)
- Goal: clock
- Steps: 11 (min: 6, efficiency: 0.55)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3
  - Step 6: collecting redstone_ore requires iron_pickaxe, not available
  - Step 11: missing redstone_dust
  - Step 11: craftRecipe("clock", 1) missing ingredients: gold_ingot x4

### craft/iron_horse_armor (L3)
- Goal: iron_horse_armor
- Steps: 4 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("wooden_sword", 1) missing ingredients: oak_planks x2, stick x1
  - Step 2: collecting coal_ore requires wooden_pickaxe, not available
  - Step 3: missing raw_coal
  - Step 3: smeltItem("raw_coal", 1) needs 1 but only 0 available
  - Step 4: missing coal_ingot
  - Step 4: missing redstone

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing ender_pearl
  - Step 2: missing eye_of_ender x4
  - Step 3: missing ender_pearl
  - Step 3: missing eye_of_ender x4
  - Step 3: craftRecipe("ender_chest", 1) missing ingredients: obsidian x8, ender_eye x1
  - Step 4: missing ender_pearl
  - Step 4: missing redstone
  - Goal item "ender_pearl" not produced by any step

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing slime_ball x4
  - Step 2: craftRecipe("slime_block", 1) missing ingredients: slime_ball x9
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 2 (min: 6, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing bones
  - Step 3: missing bones x3
  - Step 3: craftRecipe("bone_meal", 1) missing ingredients: bone x1
  - Goal item "bone" not produced by any step

### craft/wooden_shovel (L1)
- Goal: wooden_shovel
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("stick", 2) missing ingredients: oak_planks x2
  - Step 4: craftRecipe("wooden_shovel", 1) missing ingredients: oak_planks x1

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
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: craftRecipe("lever", 1) missing ingredients: cobblestone x1

### craft/painting (L1)
- Goal: painting
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: craftRecipe("painting", 1) missing ingredients: stick x8, white_wool x1

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
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting stone requires wooden_pickaxe, not available
  - Step 5: missing stone x3
  - Goal item "stonecutter" not produced by any step

### craft/minecart (L2)
- Goal: minecart
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 9: craftRecipe("minecart", 1) missing ingredients: iron_ingot x5

### craft/golden_chestplate (L3)
- Goal: golden_chestplate
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3
  - Step 9: missing gold_ingot x8
  - Step 9: craftRecipe("golden_chestplate", 1) missing ingredients: gold_ingot x8

### craft/jukebox (L3)
- Goal: jukebox
- Steps: 12 (min: 5, efficiency: 0.42)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: craftRecipe("wooden_pickaxe", 1) missing ingredients: stick x2
  - Step 5: missing stone x3
  - Step 5: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2
  - Step 6: collecting diamond_ore requires iron_pickaxe, not available
  - Step 7: missing diamond_ore
  - Step 7: craftRecipe("diamond", 1) missing ingredients: diamond_block x1

### craft/anvil (L3)
- Goal: anvil
- Steps: 11 (min: 6, efficiency: 0.55)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 9: missing iron_ingot x6
  - Step 9: craftRecipe("iron_block", 3) missing ingredients: iron_ingot x27
  - Step 11: craftRecipe("anvil", 1) missing ingredients: iron_ingot x4

### craft/note_block (L3)
- Goal: note_block
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 6: craftRecipe("note_block", 1) missing ingredients: oak_planks x8, redstone x1
