# Static Plan Evaluation v2 Report

**Date**: 2026-05-23T06:31:27.224Z
**Model**: qwen3-vl-8b-instruct
**Condition**: saer_cold
**Tasks**: 12/12 parsed successfully

## Summary

| Level | Parse OK | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|----------|-----------|------------|-----|---------------|
| L1 | 4/4 | 1/4 | 1/4 | 2/4 | 0.59 |
| L2 | 4/4 | 1/4 | 1/4 | 1/4 | 0.92 |
| L3 | 4/4 | 1/4 | 1/4 | 3/4 | 1 |
| **Overall** | **12/12** | **3/12** | **3/12** | **6/12** | **0.84** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword | Parse: OK
- Steps: 4 (min: 2, efficiency: 0.5)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/torch_batch (L1)
- Goal: torch | Parse: OK
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Issues (strict):
  - Step 4: collecting coal_ore requires wooden_pickaxe, not available

### craft/chest (L1)
- Goal: chest | Parse: OK
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 3: missing oak_plank x6

### craft/stone_shovel (L1)
- Goal: stone_shovel | Parse: OK
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing None (stone can be collected with wooden_pickaxe or better; no tool needed if using default inventory)
  - Step 4: collecting stone requires wooden_pickaxe, not available

### craft/iron_helmet (L2)
- Goal: iron_helmet | Parse: OK
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing raw_iron x8

### craft/iron_boots (L2)
- Goal: iron_boots | Parse: OK
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing None (assume access:trees)
  - Step 2: missing oak_log x3
  - Step 3: missing item:wooden_pickaxe:1 (assumed available from Step 2)
  - Step 3: collecting stone requires wooden_pickaxe, not available

### craft/iron_leggings (L2)
- Goal: iron_leggings | Parse: OK
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_door (L2)
- Goal: iron_door | Parse: OK
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing None (but furnace required later; stone_pickaxe recommended)
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 2: missing raw_iron x6

### craft/compass (L3)
- Goal: compass | Parse: OK
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Issues (strict):
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/golden_sword (L3)
- Goal: golden_sword | Parse: OK
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: PASS
- Issues (strict):
  - Step 2: collecting gold_ore requires iron_pickaxe, not available
  - Step 3: smeltItem("gold_ore") should be smeltItem("raw_gold") — 1.17+ drops raw materials

### craft/clock (L3)
- Goal: clock | Parse: OK
- Steps: 1 (min: 7, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/piston (L3)
- Goal: piston | Parse: OK
- Steps: 5 (min: 7, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing oak_log x6
  - Step 3: missing stone_pickaxe
  - Step 3: collecting iron_ore requires stone_pickaxe, not available
