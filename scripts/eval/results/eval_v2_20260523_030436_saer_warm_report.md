# Static Plan Evaluation v2 Report

**Date**: 2026-05-22T19:13:55.557Z
**Model**: qwen-max
**Condition**: saer_warm
**Tasks**: 12/12 parsed successfully

## Summary

| Level | Parse OK | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|----------|-----------|------------|-----|---------------|
| L1 | 4/4 | 0/4 | 0/4 | 0/4 | 0.76 |
| L2 | 4/4 | 0/4 | 0/4 | 0/4 | 0.89 |
| L3 | 4/4 | 0/4 | 0/4 | 0/4 | 1 |
| **Overall** | **12/12** | **0/12** | **0/12** | **0/12** | **0.88** |

## Per-Task Results

### craft/wooden_sword (L1)
- Goal: wooden_sword | Parse: OK
- Steps: 2 (min: 2, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing planks x2
  - Step 2: missing stick

### craft/torch_batch (L1)
- Goal: torch | Parse: OK
- Steps: 4 (min: 3, efficiency: 0.75)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing oak_log x2
  - Step 3: missing stone_pickaxe
  - Step 3: collecting coal_ore requires wooden_pickaxe, not available

### craft/chest (L1)
- Goal: chest | Parse: OK
- Steps: 3 (min: 2, efficiency: 0.67)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 3: missing oak_planks x8

### craft/stone_shovel (L1)
- Goal: stone_shovel | Parse: OK
- Steps: 5 (min: 3, efficiency: 0.6)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing oak_log
  - Step 4: missing wooden_pickaxe
  - Step 4: collecting cobblestone requires wooden_pickaxe, not available

### craft/iron_helmet (L2)
- Goal: iron_helmet | Parse: OK
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing wooden_pickaxe
  - Step 2: collecting stone requires wooden_pickaxe, not available

### craft/iron_boots (L2)
- Goal: iron_boots | Parse: OK
- Steps: 5 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing wooden_pickaxe
  - Step 2: collecting stone requires wooden_pickaxe, not available

### craft/iron_leggings (L2)
- Goal: iron_leggings | Parse: OK
- Steps: 6 (min: 5, efficiency: 0.83)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing oak_log x3

### craft/iron_door (L2)
- Goal: iron_door | Parse: OK
- Steps: 7 (min: 5, efficiency: 0.71)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing oak_log
  - Step 4: missing cobblestone x8
  - Step 5: missing stone_pickaxe
  - Step 5: collecting iron_ore requires stone_pickaxe, not available

### craft/compass (L3)
- Goal: compass | Parse: OK
- Steps: 4 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_pickaxe
  - Step 3: collecting redstone_ore requires stone_pickaxe, not available

### craft/golden_sword (L3)
- Goal: golden_sword | Parse: OK
- Steps: 4 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing iron_pickaxe
  - Step 2: collecting gold_ore requires iron_pickaxe, not available

### craft/clock (L3)
- Goal: clock | Parse: OK
- Steps: 6 (min: 7, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 2: missing cobblestone x8
  - Step 3: missing iron_pickaxe
  - Step 3: collecting gold_ore requires iron_pickaxe, not available
  - Step 5: missing iron_pickaxe
  - Step 5: collecting redstone_ore requires stone_pickaxe, not available

### craft/piston (L3)
- Goal: piston | Parse: OK
- Steps: 7 (min: 7, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Issues (strict):
  - Step 3: missing wooden_pickaxe
  - Step 3: collecting cobblestone requires wooden_pickaxe, not available
  - Step 4: missing stone_pickaxe
  - Step 4: collecting iron_ore requires stone_pickaxe, not available
  - Step 6: missing iron_pickaxe
  - Step 6: collecting redstone_ore requires stone_pickaxe, not available
