# Static Plan Evaluation Report

**Date**: 2026-06-05T16:26:37.456Z
**Model**: claude-sonnet-4-5-20250929
**Condition**: no_retrieval
**Tasks**: 60/60 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 19/20 | 19/20 | 19/20 | 0.67 |
| L2 | 7/20 | 7/20 | 7/20 | 0.44 |
| L3 | 2/20 | 2/20 | 2/20 | 0.47 |
| **Overall** | **28/60** | **28/60** | **28/60** | **0.53** |

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
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_trapdoor (L1)
- Goal: oak_trapdoor
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/oak_pressure_plate (L1)
- Goal: oak_pressure_plate
- Steps: 4 (min: 1, efficiency: 0.25)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bowl (L1)
- Goal: bowl
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

### craft/cauldron (L2)
- Goal: cauldron
- Steps: 10 (min: 4, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 8: missing stone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/pointed_dripstone (L2)
- Goal: pointed_dripstone
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/flint_and_steel (L2)
- Goal: flint_and_steel
- Steps: 11 (min: 4, efficiency: 0.36)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 9: missing stone x8
  - Step 9: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 11: missing flint
  - Step 11: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### craft/hopper (L2)
- Goal: hopper
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: PASS | Lenient: PASS | PVR: PASS

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
- Steps: 8 (min: 4, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 7: missing stone x3
  - Step 7: craftRecipe("stone_slab", 6) missing ingredients: stone x3

### collect/amethyst_shard (L2)
- Goal: amethyst_shard
- Steps: 7 (min: 2, efficiency: 0.29)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "amethyst_shard" not produced by any step

### collect/tuff (L2)
- Goal: tuff
- Steps: 7 (min: 2, efficiency: 0.29)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/calcite (L2)
- Goal: calcite
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_bricks (L2)
- Goal: stone_bricks
- Steps: 10 (min: 4, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_hoe (L3)
- Goal: diamond_hoe
- Steps: 13 (min: 5, efficiency: 0.38)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/diamond_axe (L3)
- Goal: diamond_axe
- Steps: 13 (min: 5, efficiency: 0.38)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stick x2
  - Step 4: craftRecipe("wooden_pickaxe", 1) missing ingredients: stick x2
  - Step 6: missing stick x2
  - Step 6: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 10: missing stick x2
  - Step 10: craftRecipe("iron_pickaxe", 1) missing ingredients: stick x2

### craft/diamond_shovel (L3)
- Goal: diamond_shovel
- Steps: 12 (min: 5, efficiency: 0.42)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing stick x2
  - Step 3: craftRecipe("wooden_pickaxe", 1) missing ingredients: stick x2
  - Step 5: missing stick x2
  - Step 5: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2
  - Step 7: missing cobblestone x8
  - Step 7: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 9: missing stick x2
  - Step 9: craftRecipe("iron_pickaxe", 1) missing ingredients: stick x2

### craft/compass (L3)
- Goal: compass
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: collecting redstone_ore requires iron_pickaxe, not available
  - Step 9: missing cobblestone x8
  - Step 9: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/diamond_boots (L3)
- Goal: diamond_boots
- Steps: 12 (min: 5, efficiency: 0.42)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/diamond_helmet (L3)
- Goal: diamond_helmet
- Steps: 12 (min: 5, efficiency: 0.42)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/golden_pickaxe (L3)
- Goal: golden_pickaxe
- Steps: 13 (min: 6, efficiency: 0.46)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing stick x2
  - Step 3: craftRecipe("wooden_pickaxe", 1) missing ingredients: stick x2
  - Step 5: missing stick x2
  - Step 5: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2
  - Step 7: missing cobblestone x8
  - Step 7: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 9: missing stick x2
  - Step 9: craftRecipe("iron_pickaxe", 1) missing ingredients: stick x2

### craft/golden_axe (L3)
- Goal: golden_axe
- Steps: 13 (min: 6, efficiency: 0.46)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### collect/terracotta (L3)
- Goal: terracotta
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 10 (min: 4, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/golden_boots (L3)
- Goal: golden_boots
- Steps: 13 (min: 6, efficiency: 0.46)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/chest (L1)
- Goal: chest
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/ladder (L1)
- Goal: ladder
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_trapdoor (L2)
- Goal: iron_trapdoor
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 9: missing cobblestone x8
  - Step 9: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/clock (L3)
- Goal: clock
- Steps: 13 (min: 6, efficiency: 0.46)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 9: missing cobblestone x8
  - Step 9: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 10: collecting gold_ore requires iron_pickaxe, not available
  - Step 11: collecting redstone_ore requires iron_pickaxe, not available

### craft/iron_horse_armor (L3)
- Goal: iron_horse_armor
- Steps: 1 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "iron_horse_armor" not produced by any step

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("wooden_sword", 1) missing ingredients: oak_planks x2, stick x1
  - Goal item "gunpowder" not produced by any step

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 11 (min: 4, efficiency: 0.36)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 8: missing stone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Goal item "ender_pearl" not produced by any step

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 19 (min: 6, efficiency: 0.32)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 16: missing diamond_pickaxe
  - Step 16: collecting obsidian requires diamond_pickaxe, not available
  - Step 17: missing flint
  - Step 17: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1
  - Goal item "blaze_rod" not produced by any step

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing cobblestone x2
  - Step 4: craftRecipe("stone_sword", 1) missing ingredients: cobblestone x2
  - Step 5: missing diamond_pickaxe
  - Step 5: collecting obsidian requires diamond_pickaxe, not available
  - Step 6: missing flint_and_steel
  - Step 7: missing structure:nether_portal
  - Step 8: missing mob:wither_skeleton
  - Goal item "bone" not produced by any step

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
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/painting (L1)
- Goal: painting
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/gravel (L1)
- Goal: gravel
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/pumpkin (L1)
- Goal: pumpkin
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stonecutter (L2)
- Goal: stonecutter
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 11: missing stone x3
  - Step 11: craftRecipe("stonecutter", 1) missing ingredients: stone x3

### craft/minecart (L2)
- Goal: minecart
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/golden_chestplate (L3)
- Goal: golden_chestplate
- Steps: 13 (min: 6, efficiency: 0.46)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/jukebox (L3)
- Goal: jukebox
- Steps: 13 (min: 5, efficiency: 0.38)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 9: missing cobblestone x8
  - Step 9: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/anvil (L3)
- Goal: anvil
- Steps: 11 (min: 6, efficiency: 0.55)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/note_block (L3)
- Goal: note_block
- Steps: 13 (min: 6, efficiency: 0.46)
- Strict: PASS | Lenient: PASS | PVR: PASS
