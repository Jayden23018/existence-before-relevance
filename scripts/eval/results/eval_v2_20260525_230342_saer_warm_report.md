# Static Plan Evaluation v2 Report

**Date**: 2026-05-25T15:44:16.847Z
**Model**: qwen3-vl-8b-instruct
**Condition**: saer_warm
**Tasks**: 12/12 parsed successfully

## Summary

| Level | Parse OK | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|----------|-----------|------------|-----|---------------|
| L1 | 4/4 | 2/4 | 2/4 | 2/4 | 0.59 |
| L2 | 4/4 | 4/4 | 4/4 | 4/4 | 0.93 |
| L3 | 4/4 | 1/4 | 2/4 | 2/4 | 1 |
| **Overall** | **12/12** | **7/12** | **8/12** | **8/12** | **0.84** |

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
  - Step 4: missing we’ll proceed with coal collection assuming access)

### craft/chest (L1)
- Goal: chest | Parse: OK
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_shovel (L1)
- Goal: stone_shovel | Parse: OK
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting stone requires wooden_pickaxe, not available

### craft/iron_helmet (L2)
- Goal: iron_helmet | Parse: OK
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_boots (L2)
- Goal: iron_boots | Parse: OK
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_leggings (L2)
- Goal: iron_leggings | Parse: OK
- Steps: 5 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/iron_door (L2)
- Goal: iron_door | Parse: OK
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/compass (L3)
- Goal: compass | Parse: OK
- Steps: 3 (min: 5, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/golden_sword (L3)
- Goal: golden_sword | Parse: OK
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: PASS | PVR: PASS
- Issues (strict):
  - Step 4: smeltItem("gold_ore") should be smeltItem("raw_gold") — 1.17+ drops raw materials

### craft/clock (L3)
- Goal: clock | Parse: OK
- Steps: 2 (min: 7, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing None (wooden_pickaxe sufficient)

### craft/piston (L3)
- Goal: piston | Parse: OK
- Steps: 5 (min: 7, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing stone_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
