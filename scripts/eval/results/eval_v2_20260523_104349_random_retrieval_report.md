# Static Plan Evaluation v2 Report

**Date**: 2026-05-23T02:53:56.993Z
**Model**: qwen3-vl-8b-instruct
**Condition**: random_retrieval
**Tasks**: 12/12 parsed successfully

## Summary

| Level | Parse OK | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|----------|-----------|------------|-----|---------------|
| L1 | 4/4 | 2/4 | 2/4 | 2/4 | 0.63 |
| L2 | 4/4 | 0/4 | 0/4 | 0/4 | 0.87 |
| L3 | 4/4 | 1/4 | 1/4 | 1/4 | 0.96 |
| **Overall** | **12/12** | **3/12** | **3/12** | **3/12** | **0.82** |

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
  - Step 4: missing item:stone_pickaxe:1 (assumed available or previously crafted)
  - Step 4: collecting coal_ore requires wooden_pickaxe, not available

### craft/chest (L1)
- Goal: chest | Parse: OK
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/stone_shovel (L1)
- Goal: stone_shovel | Parse: OK
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing oak_log
  - Step 4: missing stone

### craft/iron_helmet (L2)
- Goal: iron_helmet | Parse: OK
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing iron_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_boots (L2)
- Goal: iron_boots | Parse: OK
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_leggings (L2)
- Goal: iron_leggings | Parse: OK
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing oak_log
  - Step 4: missing stone_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_door (L2)
- Goal: iron_door | Parse: OK
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing stone_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/compass (L3)
- Goal: compass | Parse: OK
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing oak_log
  - Step 4: missing stone_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/golden_sword (L3)
- Goal: golden_sword | Parse: OK
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing wooden_pickaxe
  - Step 2: collecting stone requires wooden_pickaxe, not available
  - Step 3: collecting gold_ore requires iron_pickaxe, not available

### craft/clock (L3)
- Goal: clock | Parse: OK
- Steps: 3 (min: 7, efficiency: 1)
- Strict: PASS | Lenient: PASS | PVR: PASS

### craft/piston (L3)
- Goal: piston | Parse: OK
- Steps: 6 (min: 7, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 4: missing stone_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
