# Static Plan Evaluation Report

**Date**: 2026-06-11T12:55:30.203Z
**Model**: qwen3-vl-8b-instruct
**Condition**: no_retrieval
**Tasks**: 60/60 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 14/20 | 14/20 | 19/20 | 0.65 |
| L2 | 0/20 | 0/20 | 2/20 | 0.86 |
| L3 | 1/20 | 1/20 | 7/20 | 0.91 |
| **Overall** | **15/60** | **15/60** | **28/60** | **0.81** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_boat (L1)
- Goal: oak_boat
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_sign (L1)
- Goal: oak_sign
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_trapdoor (L1)
- Goal: oak_trapdoor
- Steps: 4 (min: 2, efficiency: 0.5)
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
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 6: craftRecipe("cauldron", 1) missing ingredients: iron_ingot x7

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x8
  - Step 3: craftRecipe("iron_helmet", 1) missing ingredients: iron_ingot x5

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 6: missing iron_ingot x4
  - Step 6: craftRecipe("iron_boots", 1) missing ingredients: iron_ingot x4

### collect/pointed_dripstone (L2)
- Goal: pointed_dripstone
- Steps: 2 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "pointed_dripstone" not produced by any step

### craft/flint_and_steel (L2)
- Goal: flint_and_steel
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing flint
  - Step 3: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### craft/hopper (L2)
- Goal: hopper
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x6
  - Step 3: craftRecipe("hopper", 1) missing ingredients: iron_ingot x5, chest x1

### craft/stone_pressure_plate (L2)
- Goal: stone_pressure_plate
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 2: missing stone x6
  - Step 2: craftRecipe("stone_pressure_plate", 1) missing ingredients: stone x2

### craft/stone_button (L2)
- Goal: stone_button
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting stone requires wooden_pickaxe, not available
  - Step 5: missing stone x3
  - Step 5: craftRecipe("stone_button", 1) missing ingredients: stone x1

### craft/grindstone (L2)
- Goal: grindstone
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: craftRecipe("grindstone", 1) missing ingredients: stone_slab x1

### collect/amethyst_shard (L2)
- Goal: amethyst_shard
- Steps: 7 (min: 2, efficiency: 0.29)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 7: missing amethyst_cluster x3
  - Goal item "amethyst_shard" not produced by any step

### collect/tuff (L2)
- Goal: tuff
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "tuff" not produced by any step

### collect/calcite (L2)
- Goal: calcite
- Steps: 1 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "calcite" not produced by any step

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
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: collecting diamond_ore requires iron_pickaxe, not available

### craft/diamond_axe (L3)
- Goal: diamond_axe
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing oak_planks x6
  - Step 1: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 2: missing oak_planks x6
  - Step 2: craftRecipe("wooden_pickaxe", 1) missing ingredients: oak_planks x3
  - Step 4: missing stone x3
  - Step 5: collecting diamond_ore requires iron_pickaxe, not available

### craft/diamond_shovel (L3)
- Goal: diamond_shovel
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available

### craft/compass (L3)
- Goal: compass
- Steps: 1 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("compass", 1) missing ingredients: iron_ingot x4, redstone x1

### craft/diamond_boots (L3)
- Goal: diamond_boots
- Steps: 2 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available

### craft/diamond_helmet (L3)
- Goal: diamond_helmet
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 7: collecting diamond_ore requires iron_pickaxe, not available
  - Step 9: missing diamond_block x3
  - Step 9: craftRecipe("diamond_helmet", 1) missing ingredients: diamond x5

### craft/golden_pickaxe (L3)
- Goal: golden_pickaxe
- Steps: 7 (min: 6, efficiency: 0.86)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: collecting gold_ore requires iron_pickaxe, not available

### craft/golden_axe (L3)
- Goal: golden_axe
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 3: missing oak_planks x8
  - Step 3: craftRecipe("stick", 4) missing ingredients: oak_planks x2

### collect/terracotta (L3)
- Goal: terracotta
- Steps: 1 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Goal item "terracotta" not produced by any step

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x9
  - Step 3: craftRecipe("iron_block", 1) missing ingredients: iron_ingot x9

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 9: missing iron_ingot x4
  - Step 9: craftRecipe("iron_leggings", 1) missing ingredients: iron_ingot x7

### craft/golden_boots (L3)
- Goal: golden_boots
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x12
  - Step 2: missing stick x4
  - Step 2: craftRecipe("wooden_pickaxe", 1) missing ingredients: oak_planks x3, stick x2
  - Step 4: missing stone x3
  - Step 4: missing oak_planks x12
  - Step 4: missing stick x4
  - Step 4: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2
  - Step 5: collecting gold_ore requires iron_pickaxe, not available
  - Step 7: missing raw_gold x4
  - Step 7: smeltItem("raw_gold", 4) needs 4 but only 3 available
  - Step 8: missing oak_planks x4
  - Step 8: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 9: missing golden_ingot x4

### craft/chest (L1)
- Goal: chest
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("chest", 1) missing ingredients: oak_planks x8

### craft/ladder (L1)
- Goal: ladder
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: craftRecipe("ladder", 1) missing ingredients: stick x7

### craft/iron_trapdoor (L2)
- Goal: iron_trapdoor
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x6
  - Step 3: craftRecipe("iron_trapdoor", 1) missing ingredients: iron_ingot x4

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x12
  - Step 2: craftRecipe("stick", 4) missing ingredients: oak_planks x2
  - Step 3: craftRecipe("wooden_pickaxe", 1) missing ingredients: oak_planks x3
  - Step 5: missing stone x3
  - Step 8: missing iron_ingot x6
  - Step 8: craftRecipe("iron_door", 1) missing ingredients: iron_ingot x6

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: craftRecipe("iron_bars", 3) missing ingredients: iron_ingot x6

### craft/clock (L3)
- Goal: clock
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stick x15
  - Step 5: craftRecipe("clock", 1) missing ingredients: gold_ingot x4, redstone x1

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
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("stone_sword", 1) missing ingredients: cobblestone x2, stick x1
  - Goal item "ender_pearl" not produced by any step

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("iron_sword", 1) missing ingredients: iron_ingot x2, stick x1
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 3 (min: 6, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x4
  - Step 2: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 4: craftRecipe("bone_block", 1) missing ingredients: bone_meal x9

### craft/wooden_shovel (L1)
- Goal: wooden_shovel
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

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
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 6: craftRecipe("stonecutter", 1) missing ingredients: iron_ingot x1, stone x3

### craft/minecart (L2)
- Goal: minecart
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x6
  - Step 3: craftRecipe("minecart", 1) missing ingredients: iron_ingot x5

### craft/golden_chestplate (L3)
- Goal: golden_chestplate
- Steps: 3 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 3: missing gold_ingot x8
  - Step 3: craftRecipe("golden_chestplate", 1) missing ingredients: gold_ingot x8

### craft/jukebox (L3)
- Goal: jukebox
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing wooden_pickaxe
  - Step 3: collecting redstone_ore requires iron_pickaxe, not available
  - Step 4: craftRecipe("jukebox", 1) missing ingredients: diamond x1

### craft/anvil (L3)
- Goal: anvil
- Steps: 7 (min: 6, efficiency: 0.86)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing wooden_pickaxe
  - Step 5: collecting iron_ore requires stone_pickaxe, not available
  - Step 7: craftRecipe("anvil", 1) missing ingredients: iron_block x3, iron_ingot x4

### craft/note_block (L3)
- Goal: note_block
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 4: craftRecipe("note_block", 1) missing ingredients: oak_planks x8, redstone x1
