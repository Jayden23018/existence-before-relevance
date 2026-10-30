# Static Plan Evaluation v2 Report

**Date**: 2026-05-25T15:04:23.624Z
**Model**: qwen3-vl-8b-instruct
**Condition**: no_retrieval
**Tasks**: 12/12 parsed successfully

## Summary

| Level | Parse OK | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|----------|-----------|------------|-----|---------------|
| L1 | 4/4 | 0/4 | 0/4 | 0/4 | 0.52 |
| L2 | 4/4 | 0/4 | 0/4 | 2/4 | 0.86 |
| L3 | 4/4 | 0/4 | 0/4 | 0/4 | 0.86 |
| **Overall** | **12/12** | **0/12** | **0/12** | **2/12** | **0.74** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword | Parse: OK
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing wood x2

### craft/torch_batch (L1)
- Goal: torch | Parse: OK
- Steps: 7 (min: 3, efficiency: 0.43)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: collecting coal_ore requires wooden_pickaxe, not available
  - Step 5: missing iron_ingot x3
  - Step 6: missing iron_ore x3
  - Step 6: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

### craft/chest (L1)
- Goal: chest | Parse: OK
- Steps: 5 (min: 2, efficiency: 0.4)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing None (assume player has no tools yet)
  - Step 2: missing wooden_pickaxe

### craft/stone_shovel (L1)
- Goal: stone_shovel | Parse: OK
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing stone

### craft/iron_helmet (L2)
- Goal: iron_helmet | Parse: OK
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Issues (strict):
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

### craft/iron_boots (L2)
- Goal: iron_boots | Parse: OK
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing None (assume player can mine without tool; if not
  - Step 1: missing add pickaxe step — but no tool required for iron_ore collection according to mining rules)
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
  - Step 3: missing None (logs can be collected without tool; if not
  - Step 3: missing use wooden pickaxe — but no tool needed per pattern)

### craft/iron_leggings (L2)
- Goal: iron_leggings | Parse: OK
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing iron_ingot x3
  - Step 3: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

### craft/iron_door (L2)
- Goal: iron_door | Parse: OK
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Issues (strict):
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

### craft/compass (L3)
- Goal: compass | Parse: OK
- Steps: 9 (min: 5, efficiency: 0.56)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: collecting cobblestone requires wooden_pickaxe, not available
  - Step 5: missing stick x2
  - Step 6: collecting iron_ore requires stone_pickaxe, not available
  - Step 7: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
  - Step 8: collecting redstone_ore requires iron_pickaxe, not available
  - Step 9: missing iron_ingot
  - Step 9: missing redstone_dust

### craft/golden_sword (L3)
- Goal: golden_sword | Parse: OK
- Steps: 7 (min: 6, efficiency: 0.86)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2
  - Step 2: collecting gold_ore requires iron_pickaxe, not available
  - Step 3: smeltItem("gold_ore") should be smeltItem("raw_gold") — 1.17+ drops raw materials
  - Step 4: missing None (logs can be collected without tools)

### craft/clock (L3)
- Goal: clock | Parse: OK
- Steps: 5 (min: 7, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Goal item "clock" not produced by any step

### craft/piston (L3)
- Goal: piston | Parse: OK
- Steps: 6 (min: 7, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
  - Goal item "piston" not produced by any step
