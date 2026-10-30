# Static Plan Evaluation Report

**Date**: 2026-05-31T07:01:09.726Z
**Model**: qwen-max
**Condition**: no_retrieval
**Tasks**: 1/1 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L2 | 0/1 | 0/1 | 0/1 | 1 |
| **Overall** | **0/1** | **0/1** | **0/1** | **1** |

## Per-Task Results

### craft/iron_door (L2)
- Goal: iron_door
- Steps: 3 (min: 5, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 3: missing iron_ingot x6
