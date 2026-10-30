# Static Plan Evaluation Report

**Date**: 2026-06-01T07:16:46.786Z
**Model**: qwen-max
**Condition**: no_retrieval
**Tasks**: 1/1 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L3 | 0/1 | 0/1 | 0/1 | 1 |
| **Overall** | **0/1** | **0/1** | **0/1** | **1** |

## Per-Task Results

### craft/iron_block (L3)
- Goal: iron_block
- Steps: 4 (min: 4, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 1: missing stone_pickaxe
  - Step 1: collecting iron_ore requires stone_pickaxe, not available
  - Step 4: missing iron_ingot x9
