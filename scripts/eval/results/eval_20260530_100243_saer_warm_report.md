# Static Plan Evaluation Report

**Date**: 2026-05-30T02:54:05.067Z
**Model**: qwen3-vl-8b-instruct
**Condition**: saer_warm
**Tasks**: 19/35 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L1 | 1/10 | 1/10 | 1/10 | 0.07 |
| L2 | 6/13 | 6/13 | 6/13 | 0.29 |
| L3 | 10/12 | 11/12 | 11/12 | 0.75 |
| **Overall** | **17/35** | **18/35** | **18/35** | **0.38** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_pickaxe (L1)
- Goal: stone_pickaxe
- Steps: 0 (min: 3, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/wooden_axe (L1)
- Goal: wooden_axe
- Steps: 0 (min: 2, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/torch_batch (L1)
- Goal: torch
- Steps: 0 (min: 3, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/wooden_hoe (L1)
- Goal: wooden_hoe
- Steps: 0 (min: 2, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/crafting_table (L1)
- Goal: crafting_table
- Steps: 0 (min: 1, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### collect/coal (L1)
- Goal: coal
- Steps: 0 (min: 2, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### collect/wood (L1)
- Goal: oak_log
- Steps: 0 (min: 1, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### collect/cobblestone (L1)
- Goal: cobblestone
- Steps: 0 (min: 2, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### collect/sand (L1)
- Goal: sand
- Steps: 0 (min: 1, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/iron_pickaxe (L2)
- Goal: iron_pickaxe
- Steps: 0 (min: 5, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/iron_helmet (L2)
- Goal: iron_helmet
- Steps: 0 (min: 5, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/iron_boots (L2)
- Goal: iron_boots
- Steps: 0 (min: 5, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### collect/gold_ore (L2)
- Goal: raw_gold
- Steps: 0 (min: 4, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/iron_axe (L2)
- Goal: iron_axe
- Steps: 0 (min: 4, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/iron_shovel (L2)
- Goal: iron_shovel
- Steps: 0 (min: 4, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/furnace (L2)
- Goal: furnace
- Steps: 0 (min: 3, efficiency: 0)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Plan generation failed (API error)

### craft/shears (L2)
- Goal: shears
- Steps: 6 (min: 4, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/shield (L2)
- Goal: shield
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_sword (L2)
- Goal: stone_sword
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_axe (L2)
- Goal: stone_axe
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/lapis (L2)
- Goal: lapis_lazuli
- Steps: 8 (min: 4, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/copper (L2)
- Goal: raw_copper
- Steps: 7 (min: 4, efficiency: 0.57)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_chestplate (L3)
- Goal: iron_chestplate
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bow (L3)
- Goal: bow
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/bucket (L3)
- Goal: bucket
- Steps: 5 (min: 4, efficiency: 0.8)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/compass (L3)
- Goal: compass
- Steps: 3 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/piston (L3)
- Goal: piston
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 6: missing cobblestone x4

### craft/golden_sword (L3)
- Goal: golden_sword
- Steps: 11 (min: 6, efficiency: 0.55)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_pickaxe (L3)
- Goal: diamond_pickaxe
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/diamond_sword (L3)
- Goal: diamond_sword
- Steps: 8 (min: 5, efficiency: 0.63)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/diamond (L3)
- Goal: diamond
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: PASS | Lenient: PASS | PVR: PASS

### collect/obsidian (L3)
- Goal: obsidian
- Steps: 12 (min: 6, efficiency: 0.5)
- Strict: FAIL | Lenient: PASS | PVR: PASS
- Strict issues:
  - Step 7: smeltItem("iron_ore") should be smeltItem("raw_iron") — Minecraft 1.17+ drops raw materials

### craft/iron_leggings (L3)
- Goal: iron_leggings
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_sword (L3)
- Goal: iron_sword
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: PASS | Lenient: PASS | PVR: PASS
