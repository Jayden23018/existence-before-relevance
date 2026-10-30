# Static Plan Evaluation v2 Report

**Date**: 2026-05-23T02:43:35.223Z
**Model**: qwen3-vl-8b-instruct
**Condition**: no_retrieval
**Tasks**: 12/12 parsed successfully

## Summary

| Level | Parse OK | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|----------|-----------|------------|-----|---------------|
| L1 | 4/4 | 2/4 | 2/4 | 2/4 | 0.61 |
| L2 | 4/4 | 0/4 | 0/4 | 2/4 | 0.89 |
| L3 | 4/4 | 1/4 | 1/4 | 1/4 | 0.92 |
| **Overall** | **12/12** | **3/12** | **3/12** | **5/12** | **0.8** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword | Parse: OK
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch | Parse: OK
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing None (logs are easy to mine)
  - Step 4: missing coal x4

### craft/chest (L1)
- Goal: chest | Parse: OK
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_shovel (L1)
- Goal: stone_shovel | Parse: OK
- Steps: 6 (min: 3, efficiency: 0.5)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing None (stone can be collected with wooden pickaxe or better; assuming player has one)
  - Step 1: collecting stone requires wooden_pickaxe, not available
  - Step 2: missing item:stone:1 (already collected)
  - Step 3: missing None (logs can be collected with hand or wooden pickaxe)

### craft/iron_helmet (L2)
- Goal: iron_helmet | Parse: OK
- Steps: 2 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing None (assuming iron ore available)
  - Step 1: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

### craft/iron_boots (L2)
- Goal: iron_boots | Parse: OK
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Issues (strict):
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

### craft/iron_leggings (L2)
- Goal: iron_leggings | Parse: OK
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Issues (strict):
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

### craft/iron_door (L2)
- Goal: iron_door | Parse: OK
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing log x12
  - Step 4: missing iron_ore x6
  - Step 4: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

### craft/compass (L3)
- Goal: compass | Parse: OK
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing None (assume iron_ore available or collected previously)
  - Step 1: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
  - Step 2: missing None (redstone can be collected with hand or any tool
  - Step 2: missing no tool required)

### craft/golden_sword (L3)
- Goal: golden_sword | Parse: OK
- Steps: 9 (min: 6, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing iron_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 5: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
  - Step 8: smeltItem("gold_ore") should be smeltItem("raw_gold") — 1.17+ drops raw materials

### craft/clock (L3)
- Goal: clock | Parse: OK
- Steps: 4 (min: 7, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/piston (L3)
- Goal: piston | Parse: OK
- Steps: 7 (min: 7, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 3: missing stone_pickaxe
  - Step 3: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
