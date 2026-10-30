# Static Plan Evaluation Report

**Date**: 2026-06-24T08:34:38.019Z
**Model**: qwen3-vl-8b-instruct
**Condition**: saer_cold
**Tasks**: 1/1 completed

## Summary

| Level | Strict TCR | Lenient TCR | PVR | Avg Efficiency |
|-------|-----------|------------|-----|---------------|
| L3 | 0/1 | 0/1 | 0/1 | 1 |
| **Overall** | **0/1** | **0/1** | **0/1** | **1** |

## Per-Task Results

### craft/note_block (L3)
- Goal: note_block
- Steps: 5 (min: 6, efficiency: 1)
- Strict: FAIL | Lenient: FAIL | PVR: FAIL
- Strict issues:
  - Step 3: collecting redstone_ore requires iron_pickaxe, not available
  - Step 5: missing redstone_dust
