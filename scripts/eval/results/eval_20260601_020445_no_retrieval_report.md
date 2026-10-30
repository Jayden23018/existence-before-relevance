# Static Plan Evaluation Report

**Date**: 2026-05-31T18:43:48.196Z
**Model**: claude-sonnet-4-5-20250929
**Condition**: no_retrieval
**Tasks**: 47/47 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 11/13 | 11/13 | 11/13 | 0.55 |
| L2 | 7/18 | 7/18 | 7/18 | 0.49 |
| L3 | 7/16 | 7/16 | 7/16 | 0.49 |
| **Overall** | **25/47** | **25/47** | **25/47** | **0.5** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_pickaxe (L1)
- Goal: stone_pickaxe
- Steps: 7 (min: 3, efficiency: 0.43)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch
- Steps: 8 (min: 3, efficiency: 0.38)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/wooden_hoe (L1)
- Goal: wooden_hoe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/crafting_table (L1)
- Goal: crafting_table
- Steps: 3 (min: 1, efficiency: 0.33)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/coal (L1)
- Goal: coal
- Steps: 7 (min: 2, efficiency: 0.29)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/wood (L1)
- Goal: oak_log
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/cobblestone (L1)
- Goal: cobblestone
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/sand (L1)
- Goal: sand
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_pickaxe (L2)
- Goal: iron_pickaxe
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing cobblestone x8

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8

### collect/gold_ore (L2)
- Goal: raw_gold
- Steps: 10 (min: 4, efficiency: 0.4)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 11 (min: 4, efficiency: 0.36)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 11 (min: 4, efficiency: 0.36)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/furnace (L2)
- Goal: furnace
- Steps: 7 (min: 3, efficiency: 0.43)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/shears (L2)
- Goal: shears
- Steps: 10 (min: 4, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8

### craft/shield (L2)
- Goal: shield
- Steps: 10 (min: 4, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 7 (min: 3, efficiency: 0.43)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/lapis (L2)
- Goal: lapis_lazuli
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/copper (L2)
- Goal: raw_copper
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bow (L3)
- Goal: bow
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bucket (L3)
- Goal: bucket
- Steps: 9 (min: 4, efficiency: 0.44)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/compass (L3)
- Goal: compass
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: collecting redstone_ore requires iron_pickaxe, not available
  - Step 9: missing cobblestone x8

### craft/piston (L3)
- Goal: piston
- Steps: 14 (min: 5, efficiency: 0.36)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Step 10: missing iron_ingot x3

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 13 (min: 6, efficiency: 0.46)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/diamond (L3)
- Goal: diamond
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8

### collect/obsidian (L3)
- Goal: obsidian
- Steps: 13 (min: 6, efficiency: 0.46)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/chest (L1)
- Goal: chest
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/ladder (L1)
- Goal: ladder
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "ladder" not produced by any step

### craft/iron_trapdoor (L2)
- Goal: iron_trapdoor
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 11 (min: 5, efficiency: 0.45)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 9: missing stone x8

### craft/iron_bars (L2)
- Goal: iron_bars
- Steps: 10 (min: 5, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8

### craft/clock (L3)
- Goal: clock
- Steps: 13 (min: 6, efficiency: 0.46)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_horse_armor (L3)
- Goal: iron_horse_armor
- Steps: 1 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "iron_horse_armor" not produced by any step

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "gunpowder" not produced by any step

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 11 (min: 4, efficiency: 0.36)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 8: missing cobblestone x8
  - Goal item "ender_pearl" not produced by any step

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 12 (min: 6, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "blaze_rod" not produced by any step

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 19 (min: 5, efficiency: 0.26)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 16: missing flint
  - Step 17: missing diamond_pickaxe
  - Step 17: collecting obsidian requires diamond_pickaxe, not available
  - Goal item "bone" not produced by any step
