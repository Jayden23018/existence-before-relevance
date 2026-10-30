# SAER Ablation Study — Plan Quality Comparison

Generated: 2026-05-22T17:46:29.363Z

## Task Completion Rate (TCR)

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 2/4 | 0/4 | 0/4 | 2/12 |
| Random | 2/4 | 1/4 | 1/4 | 4/12 |
| **SAER (ours)** | 2/4 | 0/4 | 0/4 | 2/12 |

## Strict TCR (any issue = fail)

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 2/4 | 0/4 | 0/4 | 2/12 |
| Random | 2/4 | 1/4 | 1/4 | 4/12 |
| **SAER (ours)** | 2/4 | 0/4 | 0/4 | 2/12 |

## Plan Validity Rate (PVR)

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 2/4 | 0/4 | 0/4 | 2/12 |
| Random | 2/4 | 1/4 | 1/4 | 4/12 |
| **SAER (ours)** | 2/4 | 0/4 | 0/4 | 2/12 |

## Average Step Efficiency

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 0.53 | 1 | 1 | 0.84 |
| Random | 0.59 | 0.85 | 0.56 | 0.66 |
| **SAER (ours)** | 0.55 | 0.43 | 0.64 | 0.54 |

## Per-Task Detail

### collect/gold_ore (L2)

| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |
|-----------|--------|---------|-----|-------|------------|--------|
| No Retrieval | FAIL | FAIL | FAIL | 3 | 1 | 2 |
| Random | PASS | PASS | PASS | 10 | 0.4 | 0 |
| **SAER (ours)** | FAIL | FAIL | FAIL | 0 | 0 | 1 |

**no_retrieval strict issues:**
- Step 1: missing iron_ingot x3
- Step 1: missing stick x2

**saer_full strict issues:**
- Plan parsing failed

### craft/bow (L3)

| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |
|-----------|--------|---------|-----|-------|------------|--------|
| No Retrieval | FAIL | FAIL | FAIL | 3 | 1 | 1 |
| Random | PASS | PASS | PASS | 5 | 0.6 | 0 |
| **SAER (ours)** | FAIL | FAIL | FAIL | 0 | 0 | 1 |

**no_retrieval strict issues:**
- Step 1: missing planks x6

**saer_full strict issues:**
- Plan parsing failed

### craft/bucket (L3)

| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |
|-----------|--------|---------|-----|-------|------------|--------|
| No Retrieval | FAIL | FAIL | FAIL | 3 | 1 | 2 |
| Random | FAIL | FAIL | FAIL | 5 | 0.8 | 2 |
| **SAER (ours)** | FAIL | FAIL | FAIL | 3 | 1 | 2 |

**no_retrieval strict issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**random_retrieval strict issues:**
- Step 2: missing wooden_pickaxe
- Step 2: collecting cobblestone requires wooden_pickaxe, not available

**saer_full strict issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/compass (L3)

| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |
|-----------|--------|---------|-----|-------|------------|--------|
| No Retrieval | FAIL | FAIL | FAIL | 4 | 1 | 5 |
| Random | FAIL | FAIL | FAIL | 0 | 0 | 1 |
| **SAER (ours)** | FAIL | FAIL | FAIL | 6 | 0.83 | 4 |

**no_retrieval strict issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available
- Step 2: missing iron_pickaxe
- Step 2: collecting redstone_ore requires stone_pickaxe, not available
- Step 3: missing raw_iron x4

**random_retrieval strict issues:**
- Plan parsing failed

**saer_full strict issues:**
- Step 3: missing stone_pickaxe
- Step 3: collecting iron_ore requires stone_pickaxe, not available
- Step 5: missing iron_pickaxe
- Step 5: collecting redstone_ore requires stone_pickaxe, not available

### craft/iron_boots (L2)

| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |
|-----------|--------|---------|-----|-------|------------|--------|
| No Retrieval | FAIL | FAIL | FAIL | 3 | 1 | 2 |
| Random | FAIL | FAIL | FAIL | 5 | 1 | 2 |
| **SAER (ours)** | FAIL | FAIL | FAIL | 0 | 0 | 1 |

**no_retrieval strict issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**random_retrieval strict issues:**
- Step 2: missing wooden_pickaxe
- Step 2: collecting cobblestone requires wooden_pickaxe, not available

**saer_full strict issues:**
- Plan parsing failed

### craft/iron_chestplate (L3)

| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |
|-----------|--------|---------|-----|-------|------------|--------|
| No Retrieval | FAIL | FAIL | FAIL | 3 | 1 | 2 |
| Random | FAIL | FAIL | FAIL | 6 | 0.83 | 2 |
| **SAER (ours)** | FAIL | FAIL | FAIL | 7 | 0.71 | 1 |

**no_retrieval strict issues:**
- Step 1: missing item:stone_pickaxe:1 (or better)
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**random_retrieval strict issues:**
- Step 2: missing planks x3
- Step 2: missing stick x2

**saer_full strict issues:**
- Step 2: missing oak_log

### craft/iron_helmet (L2)

| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |
|-----------|--------|---------|-----|-------|------------|--------|
| No Retrieval | FAIL | FAIL | FAIL | 3 | 1 | 2 |
| Random | FAIL | FAIL | FAIL | 3 | 1 | 2 |
| **SAER (ours)** | FAIL | FAIL | FAIL | 7 | 0.71 | 3 |

**no_retrieval strict issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**random_retrieval strict issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**saer_full strict issues:**
- Step 2: missing oak_log
- Step 5: missing stone_pickaxe
- Step 5: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_pickaxe (L2)

| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |
|-----------|--------|---------|-----|-------|------------|--------|
| No Retrieval | FAIL | FAIL | FAIL | 4 | 1 | 3 |
| Random | FAIL | FAIL | FAIL | 4 | 1 | 2 |
| **SAER (ours)** | FAIL | FAIL | FAIL | 4 | 1 | 2 |

**no_retrieval strict issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available
- Step 3: missing planks x2

**random_retrieval strict issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**saer_full strict issues:**
- Step 2: missing stone_pickaxe
- Step 2: collecting iron_ore requires stone_pickaxe, not available

### craft/stone_pickaxe (L1)

| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |
|-----------|--------|---------|-----|-------|------------|--------|
| No Retrieval | FAIL | FAIL | FAIL | 5 | 0.6 | 2 |
| Random | FAIL | FAIL | FAIL | 5 | 0.6 | 3 |
| **SAER (ours)** | FAIL | FAIL | FAIL | 5 | 0.6 | 2 |

**no_retrieval strict issues:**
- Step 1: missing item:wooden_pickaxe:1 (or better)
- Step 1: collecting cobblestone requires wooden_pickaxe, not available

**random_retrieval strict issues:**
- Step 2: missing oak_log x2
- Step 4: missing wooden_pickaxe
- Step 4: collecting cobblestone requires wooden_pickaxe, not available

**saer_full strict issues:**
- Step 1: missing wooden_pickaxe
- Step 1: collecting cobblestone requires wooden_pickaxe, not available

### craft/torch_batch (L1)

| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |
|-----------|--------|---------|-----|-------|------------|--------|
| No Retrieval | FAIL | FAIL | FAIL | 6 | 0.5 | 3 |
| Random | FAIL | FAIL | FAIL | 4 | 0.75 | 3 |
| **SAER (ours)** | FAIL | FAIL | FAIL | 5 | 0.6 | 2 |

**no_retrieval strict issues:**
- Step 4: missing stone_pickaxe
- Step 4: collecting coal_ore requires wooden_pickaxe, not available
- Step 5: missing raw_coal x4

**random_retrieval strict issues:**
- Step 2: missing oak_planks x8
- Step 3: missing stone_pickaxe
- Step 3: collecting coal_ore requires wooden_pickaxe, not available

**saer_full strict issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting coal_ore requires wooden_pickaxe, not available

### craft/wooden_axe (L1)

| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |
|-----------|--------|---------|-----|-------|------------|--------|
| No Retrieval | PASS | PASS | PASS | 4 | 0.5 | 0 |
| Random | PASS | PASS | PASS | 4 | 0.5 | 0 |
| **SAER (ours)** | PASS | PASS | PASS | 4 | 0.5 | 0 |

### craft/wooden_sword (L1)

| Condition | Strict | Lenient | PVR | Steps | Efficiency | Issues |
|-----------|--------|---------|-----|-------|------------|--------|
| No Retrieval | PASS | PASS | PASS | 4 | 0.5 | 0 |
| Random | PASS | PASS | PASS | 4 | 0.5 | 0 |
| **SAER (ours)** | PASS | PASS | PASS | 4 | 0.5 | 0 |
