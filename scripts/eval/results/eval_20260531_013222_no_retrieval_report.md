# Static Plan Evaluation Report

**Date**: 2026-05-30T18:01:44.595Z
**Model**: qwen3-vl-8b-instruct
**Condition**: no_retrieval
**Tasks**: 40/40 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 6/11 | 6/11 | 6/11 | 0.69 |
| L2 | 0/15 | 0/15 | 0/15 | 0.82 |
| L3 | 1/14 | 1/14 | 2/14 | 0.91 |
| **Overall** | **7/40** | **7/40** | **8/40** | **0.82** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_pickaxe (L1)
- Goal: stone_pickaxe
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing plank x12

### craft/torch_batch (L1)
- Goal: torch
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing plank x16
  - Step 4: missing coal x4

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
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing they must be collected/processed first)
  - Goal item "coal" not produced by any step

### collect/wood (L1)
- Goal: oak_log
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/cobblestone (L1)
- Goal: cobblestone
- Steps: 1 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing would require crafting step
  - Step 1: missing but none requested)
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available

### collect/sand (L1)
- Goal: sand
- Steps: 1 (min: 1, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_pickaxe (L2)
- Goal: iron_pickaxe
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available
  - Step 2: missing stick x2
  - Step 4: missing iron_ore x3
  - Step 4: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available
  - Step 2: missing stick x2
  - Step 4: missing iron_ore x3

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3
  - Step 3: missing iron_ore x5

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing since this is a minimal plan and no pickaxe is assumed available yet
  - Step 1: missing we'll add crafting step below)
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Step 3: missing iron_ingot x4
  - Step 4: missing cobblestone x3
  - Step 4: missing stick x2
- Lenient issues:
  - Step 1: missing since this is a minimal plan and no pickaxe is assumed available yet
  - Step 1: missing we'll add crafting step below)
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x4
  - Step 4: missing cobblestone x3
  - Step 4: missing stick x2

### collect/gold_ore (L2)
- Goal: raw_gold
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Step 2: missing stick x2
  - Step 4: missing gold_ore x3
  - Step 4: smeltItem("gold_ore") should be smeltItem("raw_gold") — Minecraft 1.17+ drops raw materials
  - Step 5: missing stick x2
- Lenient issues:
  - Step 2: missing stick x2
  - Step 4: missing gold_ore x3
  - Step 5: missing stick x2

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Step 3: missing cobblestone x3
  - Step 3: missing stick x2
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore
  - Step 3: missing cobblestone x3
  - Step 3: missing stick x2

### craft/furnace (L2)
- Goal: furnace
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone

### craft/shears (L2)
- Goal: shears
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Goal item "shears" not produced by any step
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x3
  - Goal item "shears" not produced by any step

### craft/shield (L2)
- Goal: shield
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 2: missing plank x6
  - Step 3: missing plank x6

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting cobblestone requires wooden_pickaxe, not available
  - Step 2: missing stick x2
  - Step 4: missing log x2

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone x3

### collect/lapis (L2)
- Goal: lapis_lazuli
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "lapis_lazuli" not produced by any step

### collect/copper (L2)
- Goal: raw_copper
- Steps: 2 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing add those steps)

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x8
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ore x8

### craft/bow (L3)
- Goal: bow
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 5: missing string x3
  - Goal item "bow" not produced by any step

### craft/bucket (L3)
- Goal: bucket
- Steps: 3 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: missing glass_ingot x3
  - Goal item "bucket" not produced by any step

### craft/compass (L3)
- Goal: compass
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Step 3: missing we’re good)
  - Step 3: collecting redstone_ore requires iron_pickaxe, not available
  - Step 4: missing redstone_dust
- Lenient issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing we’re good)
  - Step 3: collecting redstone_ore requires iron_pickaxe, not available
  - Step 4: missing redstone_dust

### craft/piston (L3)
- Goal: piston
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: missing iron_ore x3
  - Step 4: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Goal item "piston" not produced by any step
- Lenient issues:
  - Step 3: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: missing iron_ore x3
  - Goal item "piston" not produced by any step

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Strict issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available
  - Step 2: smeltItem("gold_ore") should be smeltItem("raw_gold") — Minecraft 1.17+ drops raw materials
- Lenient issues:
  - Step 1: collecting gold_ore requires iron_pickaxe, not available

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: collecting cobblestone requires wooden_pickaxe, not available
  - Step 6: collecting diamond_ore requires iron_pickaxe, not available
  - Step 7: missing diamond x3

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 5: missing iron_ore x3
  - Step 5: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Step 7: missing diamond_ingot x2
- Lenient issues:
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Step 5: missing iron_ore x3
  - Step 7: missing diamond_ingot x2

### collect/diamond (L3)
- Goal: diamond
- Steps: 1 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing diamond_pickaxe
  - Step 1: collecting diamond_ore requires iron_pickaxe, not available
  - Goal item "diamond" not produced by any step

### collect/obsidian (L3)
- Goal: obsidian
- Steps: 2 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing so we must craft them first)

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 4: missing stone_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: missing iron_ore x6

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 2 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "iron_sword" not produced by any step

### combat/kill_creeper (L1)
- Goal: gunpowder
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "gunpowder" not produced by any step

### combat/kill_enderman (L2)
- Goal: ender_pearl
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials
  - Goal item "ender_pearl" not produced by any step
- Lenient issues:
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Goal item "ender_pearl" not produced by any step

### combat/kill_slime (L2)
- Goal: slime_ball
- Steps: 2 (min: 3, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Goal item "slime_ball" not produced by any step

### combat/kill_blaze (L3)
- Goal: blaze_rod
- Steps: 7 (min: 6, efficiency: 0.86)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2
  - Step 4: missing log x3
  - Goal item "blaze_rod" not produced by any step

### combat/kill_wither_skeleton (L3)
- Goal: bone
- Steps: 2 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS
