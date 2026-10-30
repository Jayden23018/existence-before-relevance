# Static Plan Evaluation Report

**Date**: 2026-06-20T18:13:08.600Z
**Model**: gpt-4o-2024-11-20
**Condition**: saer_cold
**Tasks**: 60/60 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 16/20 | 16/20 | 16/20 | 0.59 |
| L2 | 9/20 | 9/20 | 10/20 | 0.57 |
| L3 | 7/20 | 7/20 | 10/20 | 0.71 |
| **Overall** | **32/60** | **32/60** | **36/60** | **0.62** |

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
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/pointed_dripstone (L2)
- Goal: pointed_dripstone
- Steps: 6 (min: 2, efficiency: 0.33)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3

### craft/flint_and_steel (L2)
- Goal: flint_and_steel
- Steps: 9 (min: 4, efficiency: 0.44)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3
  - Step 9: missing flint
  - Step 9: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### craft/hopper (L2)
- Goal: hopper
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/stone_pressure_plate (L2)
- Goal: stone_pressure_plate
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_button (L2)
- Goal: stone_button
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/grindstone (L2)
- Goal: grindstone
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting cobblestone requires wooden_pickaxe, not available

### collect/amethyst_shard (L2)
- Goal: amethyst_shard
- Steps: 10 (min: 2, efficiency: 0.2)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3
  - Goal item "amethyst_shard" not produced by any step

### collect/tuff (L2)
- Goal: tuff
- Steps: 7 (min: 2, efficiency: 0.29)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3

### collect/calcite (L2)
- Goal: calcite
- Steps: 8 (min: 2, efficiency: 0.25)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x3

### craft/stone_bricks (L2)
- Goal: stone_bricks
- Steps: 4 (min: 4, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_hoe (L3)
- Goal: diamond_hoe
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: collecting diamond_ore requires iron_pickaxe, not available

### craft/diamond_axe (L3)
- Goal: diamond_axe
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing iron_pickaxe
  - Step 4: collecting diamond_ore requires iron_pickaxe, not available

### craft/diamond_shovel (L3)
- Goal: diamond_shovel
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/compass (L3)
- Goal: compass
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing redstone_dust

### craft/diamond_boots (L3)
- Goal: diamond_boots
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing iron_pickaxe
  - Step 3: collecting diamond_ore requires iron_pickaxe, not available

### craft/diamond_helmet (L3)
- Goal: diamond_helmet
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing iron_pickaxe
  - Step 4: collecting diamond_ore requires iron_pickaxe, not available

### craft/golden_pickaxe (L3)
- Goal: golden_pickaxe
- Steps: 8 (min: 6, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 6: collecting gold_ore requires iron_pickaxe, not available

### craft/golden_axe (L3)
- Goal: golden_axe
- Steps: 8 (min: 6, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 6: collecting gold_ore requires iron_pickaxe, not available

### collect/terracotta (L3)
- Goal: terracotta
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "terracotta" not produced by any step

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/golden_boots (L3)
- Goal: golden_boots
- Steps: 7 (min: 6, efficiency: 0.86)
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
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 7: missing stone x8
  - Step 8: missing stone x3

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 7: missing stone x3

### craft/clock (L3)
- Goal: clock
- Steps: 12 (min: 6, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3

### craft/iron_horse_armor (L3)
- Goal: iron_horse_armor
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 10 (min: 3, efficiency: 0.3)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing stone x2

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 13 (min: 4, efficiency: 0.31)
- Strict: PASS | Lenient: PASS | PVR: PASS

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 10 (min: 3, efficiency: 0.3)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 14 (min: 6, efficiency: 0.43)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing stone x3
  - Step 10: missing diamond_pickaxe
  - Step 10: collecting obsidian requires diamond_pickaxe, not available
  - Step 11: missing flint
  - Step 11: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 13 (min: 5, efficiency: 0.38)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting stone requires wooden_pickaxe, not available
  - Step 9: missing diamond_pickaxe
  - Step 9: collecting obsidian requires diamond_pickaxe, not available
  - Step 10: missing gravel
  - Step 10: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

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
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting stone requires wooden_pickaxe, not available

### craft/painting (L1)
- Goal: painting
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing shears
  - Step 5: craftRecipe("painting", 1) missing ingredients: white_wool x1

### collect/gravel (L1)
- Goal: gravel
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/pumpkin (L1)
- Goal: pumpkin
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing access:plains OR access:forest
  - Step 2: missing access:plains OR access:forest

### craft/stonecutter (L2)
- Goal: stonecutter
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 5: collecting iron_ore requires stone_pickaxe, not available

### craft/minecart (L2)
- Goal: minecart
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/golden_chestplate (L3)
- Goal: golden_chestplate
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/jukebox (L3)
- Goal: jukebox
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing iron_pickaxe
  - Step 3: collecting diamond_ore requires iron_pickaxe, not available

### craft/anvil (L3)
- Goal: anvil
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/note_block (L3)
- Goal: note_block
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing stick x2
