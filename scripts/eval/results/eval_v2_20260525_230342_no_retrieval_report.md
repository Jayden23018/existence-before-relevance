# Static Plan Evaluation v2 Report

**Date**: 2026-05-25T15:47:43.712Z
**Model**: qwen3-vl-8b-instruct
**Condition**: no_retrieval
**Tasks**: 12/12 parsed successfully

## Summary

| Level | Parse OK | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|----------|-----------|------------|-----|---------------|
| L1 | 4/4 | 2/4 | 2/4 | 2/4 | 0.63 |
| L2 | 4/4 | 0/4 | 0/4 | 0/4 | 0.96 |
| L3 | 4/4 | 1/4 | 1/4 | 2/4 | 0.93 |
| **Overall** | **12/12** | **3/12** | **3/12** | **4/12** | **0.84** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword | Parse: OK
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch | Parse: OK
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing coal x4
  - Step 4: collecting coal_ore requires wooden_pickaxe, not available
  - Step 5: collecting coal_ore requires wooden_pickaxe, not available

### craft/chest (L1)
- Goal: chest | Parse: OK
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_shovel (L1)
- Goal: stone_shovel | Parse: OK
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing stone

### craft/iron_helmet (L2)
- Goal: iron_helmet | Parse: OK
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing None (assuming player has access to iron ore blocks)
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

### craft/iron_boots (L2)
- Goal: iron_boots | Parse: OK
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing None (assuming player can mine without tool or has appropriate pickaxe)
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
  - Step 3: missing None (logs can be gathered without tool
  - Step 3: missing or with axe if needed)
  - Step 4: missing None (planks craft directly from logs)

### craft/iron_leggings (L2)
- Goal: iron_leggings | Parse: OK
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 3: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
  - Step 4: missing iron_ingot x6

### craft/iron_door (L2)
- Goal: iron_door | Parse: OK
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing cobblestone x3
  - Step 1: missing stick x2
  - Step 3: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

### craft/compass (L3)
- Goal: compass | Parse: OK
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/golden_sword (L3)
- Goal: golden_sword | Parse: OK
- Steps: 6 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing item:stone_pickaxe:1 (or better)
  - Step 4: collecting gold_ore requires iron_pickaxe, not available
  - Step 5: smeltItem("gold_ore") should be smeltItem("raw_gold") — 1.17+ drops raw materials

### craft/clock (L3)
- Goal: clock | Parse: OK
- Steps: 10 (min: 7, efficiency: 0.7)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Issues (strict):
  - Step 4: collecting redstone_ore requires iron_pickaxe, not available
  - Step 6: collecting iron_ore requires stone_pickaxe, not available
  - Step 7: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

### craft/piston (L3)
- Goal: piston | Parse: OK
- Steps: 6 (min: 7, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
  - Step 6: missing iron_ingot x3
