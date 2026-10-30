# Static Plan Evaluation Report

**Date**: 2026-06-01T09:22:45.555Z
**Model**: qwen-max
**Condition**: saer_cold
**Tasks**: 60/60 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 15/20 | 15/20 | 17/20 | 0.7 |
| L2 | 0/20 | 0/20 | 14/20 | 0.84 |
| L3 | 1/20 | 1/20 | 15/20 | 0.89 |
| **Overall** | **16/60** | **16/60** | **46/60** | **0.81** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_pickaxe (L1)
- Goal: stone_pickaxe
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing cobblestone x3
  - Step 3: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 2 (min: 2, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch
- Steps: 3 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

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
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_pickaxe (L2)
- Goal: iron_pickaxe
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### collect/deepslate_coal (L2)
- Goal: coal
- Steps: 3 (min: 1, efficiency: 0.33)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/furnace (L2)
- Goal: furnace
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing cobblestone x8
  - Step 3: craftRecipe("furnace", 1) missing ingredients: cobblestone x8

### craft/shears (L2)
- Goal: shears
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/shield (L2)
- Goal: shield
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing cobblestone x2
  - Step 6: craftRecipe("stone_sword", 1) missing ingredients: cobblestone x2

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 3 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing cobblestone x3
  - Step 3: craftRecipe("stone_axe", 1) missing ingredients: cobblestone x3

### collect/deepslate_copper (L2)
- Goal: raw_copper
- Steps: 2 (min: 1, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/stone_bricks (L2)
- Goal: stone_bricks
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing cobblestone x4

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/bow (L3)
- Goal: bow
- Steps: 3 (min: 3, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bucket (L3)
- Goal: bucket
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/compass (L3)
- Goal: compass
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3
  - Step 5: collecting redstone_ore requires iron_pickaxe, not available

### craft/piston (L3)
- Goal: piston
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3
  - Step 3: craftRecipe("iron_pickaxe", 1) missing ingredients: iron_ingot x3
  - Step 5: missing cobblestone x4
  - Step 5: craftRecipe("piston", 1) missing ingredients: cobblestone x4

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing iron_pickaxe
  - Step 2: collecting diamond_ore requires iron_pickaxe, not available

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### collect/deepslate_diamond (L3)
- Goal: diamond
- Steps: 4 (min: 1, efficiency: 0.25)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 1: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing oak_planks x6
  - Step 2: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 6: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/chest (L1)
- Goal: chest
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/ladder (L1)
- Goal: ladder
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_trapdoor (L2)
- Goal: iron_trapdoor
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/clock (L3)
- Goal: clock
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3
  - Step 3: collecting gold_ore requires iron_pickaxe, not available
  - Step 3: collecting redstone_ore requires iron_pickaxe, not available

### craft/iron_horse_armor (L3)
- Goal: iron_horse_armor
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("stone_sword", 1) missing ingredients: cobblestone x2

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3
  - Step 6: missing enderman

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 8 (min: 6, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3
  - Step 3: craftRecipe("flint_and_steel", 1) missing ingredients: flint x1

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3
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
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/lever (L1)
- Goal: lever
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing wooden_pickaxe
  - Step 3: collecting cobblestone requires wooden_pickaxe, not available

### craft/painting (L1)
- Goal: painting
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: craftRecipe("white_wool", 2) missing ingredients: white_dye x2, black_wool x2
  - Step 6: missing white_wool x8
  - Step 6: craftRecipe("painting", 1) missing ingredients: stick x8

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
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing cobblestone x3
  - Step 3: craftRecipe("stonecutter", 1) missing ingredients: iron_ingot x1

### craft/minecart (L2)
- Goal: minecart
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/golden_chestplate (L3)
- Goal: golden_chestplate
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: craftRecipe("crafting_table", 1) missing ingredients: oak_planks x4
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/jukebox (L3)
- Goal: jukebox
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing iron_pickaxe
  - Step 3: collecting diamond_ore requires iron_pickaxe, not available

### craft/anvil (L3)
- Goal: anvil
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 2: craftRecipe("stone_pickaxe", 1) missing ingredients: cobblestone x3

### craft/note_block (L3)
- Goal: note_block
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing iron_pickaxe
  - Step 3: collecting redstone_ore requires iron_pickaxe, not available
  - Step 4: missing raw_redstone
  - Step 4: smeltItem("raw_redstone", 1) needs 1 but only 0 available
