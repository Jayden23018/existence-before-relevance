# Static Plan Evaluation Report

**Date**: 2026-06-04T15:33:41.351Z
**Model**: deepseek-chat
**Condition**: no_retrieval
**Tasks**: 60/60 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 16/20 | 16/20 | 17/20 | 0.68 |
| L2 | 8/20 | 8/20 | 9/20 | 0.51 |
| L3 | 8/20 | 8/20 | 9/20 | 0.56 |
| **Overall** | **32/60** | **32/60** | **35/60** | **0.58** |

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
  - Step 2: craftRecipe("oak_planks", 12) missing ingredients: oak_log x3

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
- Steps: 3 (min: 1, efficiency: 0.33)
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
- Steps: 1 (min: 1, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe

### craft/cauldron (L2)
- Goal: cauldron
- Steps: 9 (min: 4, efficiency: 0.44)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 7: missing cobblestone x8
  - Step 7: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### collect/pointed_dripstone (L2)
- Goal: pointed_dripstone
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "pointed_dripstone" not produced by any step

### craft/flint_and_steel (L2)
- Goal: flint_and_steel
- Steps: 11 (min: 4, efficiency: 0.36)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3
  - Step 8: missing item:cobblestone:8 (from stone mined earlier)
  - Step 8: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 11: missing flint
  - Step 11: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### craft/hopper (L2)
- Goal: hopper
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_pressure_plate (L2)
- Goal: stone_pressure_plate
- Steps: 7 (min: 3, efficiency: 0.43)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_button (L2)
- Goal: stone_button
- Steps: 9 (min: 3, efficiency: 0.33)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 9: missing stone
  - Step 9: craftRecipe("stone_button", 1) missing ingredients: stone x1

### craft/grindstone (L2)
- Goal: grindstone
- Steps: 8 (min: 4, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 7: missing stone x3
  - Step 7: craftRecipe("stone_slab", 6) missing ingredients: stone x3

### collect/amethyst_shard (L2)
- Goal: amethyst_shard
- Steps: 11 (min: 2, efficiency: 0.18)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/tuff (L2)
- Goal: tuff
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x12
  - Step 2: missing stick x4
  - Step 2: craftRecipe("wooden_pickaxe", 1) missing ingredients: oak_planks x3, stick x2
  - Step 4: missing stick x2
  - Step 4: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2

### collect/calcite (L2)
- Goal: calcite
- Steps: 7 (min: 2, efficiency: 0.29)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_bricks (L2)
- Goal: stone_bricks
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: collecting stone requires wooden_pickaxe, not available

### craft/diamond_hoe (L3)
- Goal: diamond_hoe
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_axe (L3)
- Goal: diamond_axe
- Steps: 12 (min: 5, efficiency: 0.42)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stick x2
  - Step 4: craftRecipe("wooden_pickaxe", 1) missing ingredients: stick x2
  - Step 6: missing stick x2
  - Step 6: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2
  - Step 9: missing stick x2
  - Step 9: craftRecipe("iron_pickaxe", 1) missing ingredients: stick x2

### craft/diamond_shovel (L3)
- Goal: diamond_shovel
- Steps: 12 (min: 5, efficiency: 0.42)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/compass (L3)
- Goal: compass
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 9: collecting redstone_ore requires iron_pickaxe, not available

### craft/diamond_boots (L3)
- Goal: diamond_boots
- Steps: 12 (min: 5, efficiency: 0.42)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing item:oak_log:2 (remaining 2 logs)
  - Step 12: missing diamond_boots

### craft/diamond_helmet (L3)
- Goal: diamond_helmet
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/golden_pickaxe (L3)
- Goal: golden_pickaxe
- Steps: 12 (min: 6, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/golden_axe (L3)
- Goal: golden_axe
- Steps: 14 (min: 6, efficiency: 0.43)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stick x2
  - Step 4: craftRecipe("wooden_pickaxe", 1) missing ingredients: stick x2
  - Step 6: missing stick x2
  - Step 6: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2
  - Step 8: missing cobblestone x8
  - Step 9: missing cobblestone x8
  - Step 9: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Step 10: missing stick x2
  - Step 10: craftRecipe("iron_pickaxe", 1) missing ingredients: stick x2

### collect/terracotta (L3)
- Goal: terracotta
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone x3

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 10 (min: 4, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing wooden_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/golden_boots (L3)
- Goal: golden_boots
- Steps: 14 (min: 6, efficiency: 0.43)
- Strict: PASS | Lenient: PASS | PVR: PASS

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
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 7: missing cobblestone x8
  - Step 7: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/clock (L3)
- Goal: clock
- Steps: 13 (min: 6, efficiency: 0.46)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_horse_armor (L3)
- Goal: iron_horse_armor
- Steps: 1 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing iron_ingot x7
  - Goal item "iron_horse_armor" not produced by any step

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 7 (min: 3, efficiency: 0.43)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "gunpowder" not produced by any step

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 11 (min: 4, efficiency: 0.36)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 9: missing cobblestone x8
  - Step 9: craftRecipe("furnace", 1) missing ingredients: cobblestone x8
  - Goal item "ender_pearl" not produced by any step

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 1 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 20 (min: 6, efficiency: 0.3)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: craftRecipe("wooden_pickaxe", 1) missing ingredients: oak_planks x3, stick x2
  - Step 4: craftRecipe("stone_pickaxe", 1) missing ingredients: stick x2
  - Step 8: missing stick x2
  - Step 8: craftRecipe("iron_sword", 1) missing ingredients: stick x1
  - Step 9: missing stick x2
  - Step 9: craftRecipe("iron_pickaxe", 1) missing ingredients: stick x2
  - Step 11: missing stick x2
  - Step 11: craftRecipe("diamond_pickaxe", 1) missing ingredients: stick x2
  - Step 13: missing flint
  - Step 13: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1
  - Step 16: missing stick x3
  - Step 16: missing string x3
  - Step 16: craftRecipe("bow", 1) missing ingredients: stick x3, string x3
  - Step 18: missing arrow x8
  - Step 19: missing flint x4
  - Step 19: missing stick x4
  - Step 19: missing feather x4
  - Step 19: craftRecipe("arrow", 8) missing ingredients: flint x2, stick x2, feather x2

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
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
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "gravel" not produced by any step

### collect/pumpkin (L1)
- Goal: pumpkin
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stonecutter (L2)
- Goal: stonecutter
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/minecart (L2)
- Goal: minecart
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 9: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/golden_chestplate (L3)
- Goal: golden_chestplate
- Steps: 13 (min: 6, efficiency: 0.46)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3

### craft/jukebox (L3)
- Goal: jukebox
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/anvil (L3)
- Goal: anvil
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/note_block (L3)
- Goal: note_block
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing oak_log
  - Step 2: missing oak_log x2
  - Step 2: craftRecipe("oak_planks", 8) missing ingredients: oak_log x2
  - Step 3: collecting redstone_ore requires iron_pickaxe, not available
