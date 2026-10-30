# Static Plan Evaluation Report

**Date**: 2026-06-04T17:48:03.989Z
**Model**: qwen-max
**Condition**: bm25_retrieval
**Tasks**: 60/60 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 15/20 | 15/20 | 17/20 | 0.58 |
| L2 | 9/20 | 9/20 | 15/20 | 0.9 |
| L3 | 13/20 | 13/20 | 18/20 | 0.94 |
| **Overall** | **37/60** | **37/60** | **50/60** | **0.81** |

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
- Steps: 5 (min: 2, efficiency: 0.4)
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
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/sugar_cane (L1)
- Goal: sugar_cane
- Steps: 2 (min: 1, efficiency: 0.5)
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
  - Step 2: missing wooden_pickaxe

### craft/cauldron (L2)
- Goal: cauldron
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/pointed_dripstone (L2)
- Goal: pointed_dripstone
- Steps: 2 (min: 2, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/flint_and_steel (L2)
- Goal: flint_and_steel
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing stone_pickaxe
  - Step 2: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: missing flint
  - Step 4: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### craft/hopper (L2)
- Goal: hopper
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/stone_pressure_plate (L2)
- Goal: stone_pressure_plate
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("stone_pressure_plate", 1) missing ingredients: stone x2

### craft/stone_button (L2)
- Goal: stone_button
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("stone_button", 1) missing ingredients: stone x1

### craft/grindstone (L2)
- Goal: grindstone
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting cobblestone requires wooden_pickaxe, not available
  - Step 5: craftRecipe("stone_slab", 4) missing ingredients: stone x3

### collect/amethyst_shard (L2)
- Goal: amethyst_shard
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "amethyst_shard" not produced by any step

### collect/tuff (L2)
- Goal: tuff
- Steps: 2 (min: 2, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/calcite (L2)
- Goal: calcite
- Steps: 7 (min: 2, efficiency: 0.29)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3

### craft/stone_bricks (L2)
- Goal: stone_bricks
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("stone_bricks", 4) missing ingredients: stone x4

### craft/diamond_hoe (L3)
- Goal: diamond_hoe
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_axe (L3)
- Goal: diamond_axe
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_shovel (L3)
- Goal: diamond_shovel
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/compass (L3)
- Goal: compass
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 9: collecting redstone_ore requires iron_pickaxe, not available

### craft/diamond_boots (L3)
- Goal: diamond_boots
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_helmet (L3)
- Goal: diamond_helmet
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/golden_pickaxe (L3)
- Goal: golden_pickaxe
- Steps: 6 (min: 6, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/golden_axe (L3)
- Goal: golden_axe
- Steps: 7 (min: 6, efficiency: 0.86)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/terracotta (L3)
- Goal: terracotta
- Steps: 2 (min: 2, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/golden_boots (L3)
- Goal: golden_boots
- Steps: 6 (min: 6, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/chest (L1)
- Goal: chest
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: craftRecipe("oak_planks", 8) missing ingredients: oak_log x2

### craft/ladder (L1)
- Goal: ladder
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_trapdoor (L2)
- Goal: iron_trapdoor
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/clock (L3)
- Goal: clock
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing iron_pickaxe
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 3: missing iron_pickaxe
  - Step 3: collecting redstone_ore requires iron_pickaxe, not available

### craft/iron_horse_armor (L3)
- Goal: iron_horse_armor
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 4 (min: 4, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

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
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/lever (L1)
- Goal: lever
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting cobblestone requires wooden_pickaxe, not available

### craft/painting (L1)
- Goal: painting
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing white_wool
  - Step 5: craftRecipe("painting", 1) missing ingredients: stick x8, white_wool x1

### collect/gravel (L1)
- Goal: gravel
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/pumpkin (L1)
- Goal: pumpkin
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stonecutter (L2)
- Goal: stonecutter
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: craftRecipe("stonecutter", 1) missing ingredients: stone x3

### craft/minecart (L2)
- Goal: minecart
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/golden_chestplate (L3)
- Goal: golden_chestplate
- Steps: 6 (min: 6, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/jukebox (L3)
- Goal: jukebox
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 3: craftRecipe("iron_ingot", 3) missing ingredients: iron_block x1

### craft/anvil (L3)
- Goal: anvil
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing iron_ingot x9
  - Step 5: craftRecipe("iron_block", 1) missing ingredients: iron_ingot x9
  - Step 6: missing iron_block x3
  - Step 6: craftRecipe("anvil", 1) missing ingredients: iron_block x3

### craft/note_block (L3)
- Goal: note_block
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: collecting redstone_ore requires iron_pickaxe, not available
