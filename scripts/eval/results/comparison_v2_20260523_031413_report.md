# SAER v2 Ablation Study — Plan Quality Comparison

Generated: 2026-05-22T19:14:13.267Z

**Model**: qwen-max

## Task Completion Rate (Lenient TCR)
*Lenient: forgives raw_ore naming (e.g. smeltItem("iron_ore") instead of "raw_iron")*

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 1/4 | 0/4 | 0/4 | 1/12 |
| Random | 2/4 | 0/4 | 0/4 | 2/12 |
| SAER-cold (keyword only) | 1/4 | 0/4 | 0/4 | 1/12 |
| **SAER-warm (full, ours)** | 0/4 | 0/4 | 0/4 | 0/12 |

## Strict TCR (any issue = fail)

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 1/4 | 0/4 | 0/4 | 1/12 |
| Random | 2/4 | 0/4 | 0/4 | 2/12 |
| SAER-cold (keyword only) | 1/4 | 0/4 | 0/4 | 1/12 |
| **SAER-warm (full, ours)** | 0/4 | 0/4 | 0/4 | 0/12 |

## Plan Validity Rate (PVR)

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 2/4 | 0/4 | 0/4 | 2/12 |
| Random | 2/4 | 0/4 | 0/4 | 2/12 |
| SAER-cold (keyword only) | 1/4 | 0/4 | 0/4 | 1/12 |
| **SAER-warm (full, ours)** | 0/4 | 0/4 | 0/4 | 0/12 |

## Parse Success Rate
*Low parse rate for SAER conditions indicates few-shot examples confuse output format*

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 4/4 | 4/4 | 4/4 | 12/12 |
| Random | 4/4 | 4/4 | 4/4 | 12/12 |
| SAER-cold (keyword only) | 4/4 | 4/4 | 4/4 | 12/12 |
| **SAER-warm (full, ours)** | 4/4 | 4/4 | 4/4 | 12/12 |

## SAER Gap Scoring Contribution
*Delta = SAER-warm minus SAER-cold — isolates the value of gap scoring over keyword-only*

| Metric | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| Lenient TCR Δ | -25.0% | +0.0% | +0.0% | -8.3% |
| Strict TCR Δ | -25.0% | +0.0% | +0.0% | -8.3% |
| PVR Δ | -25.0% | +0.0% | +0.0% | -8.3% |

*Positive delta → gap scoring helped. Near-zero delta → keyword matching already sufficient.*

## Average Step Efficiency
*min_steps / actual_steps, capped at 1.0*

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 0.69 | 1 | 1 | 0.9 |
| Random | 0.61 | 1 | 1 | 0.87 |
| SAER-cold (keyword only) | 0.69 | 0.92 | 0.96 | 0.86 |
| **SAER-warm (full, ours)** | 0.76 | 0.89 | 1 | 0.88 |

## Per-Task Detail

### craft/chest (L1)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 3 | 0.67 |
| Random | OK | PASS | PASS | PASS | 3 | 0.67 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 3 | 0.67 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 3 | 0.67 |

**no_retrieval issues:**
- Step 3: missing planks x8

**saer_cold issues:**
- Step 3: missing oak_planks x8

**saer_warm issues:**
- Step 3: missing oak_planks x8

### craft/clock (L3)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 4 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 6 | 1 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 4 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 6 | 1 |

**no_retrieval issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting gold_ore requires iron_pickaxe, not available
- Step 3: missing stone_pickaxe
- Step 3: collecting redstone_ore requires stone_pickaxe, not available

**random_retrieval issues:**
- Step 2: missing cobblestone x8
- Step 3: missing stone_pickaxe
- Step 3: collecting gold_ore requires iron_pickaxe, not available
- Step 5: missing iron_pickaxe
- Step 5: collecting redstone_ore requires stone_pickaxe, not available

**saer_cold issues:**
- Step 1: missing iron_pickaxe
- Step 1: collecting redstone_ore requires stone_pickaxe, not available
- Step 2: missing iron_pickaxe
- Step 2: collecting gold_ore requires iron_pickaxe, not available

**saer_warm issues:**
- Step 2: missing cobblestone x8
- Step 3: missing iron_pickaxe
- Step 3: collecting gold_ore requires iron_pickaxe, not available
- Step 5: missing iron_pickaxe
- Step 5: collecting redstone_ore requires stone_pickaxe, not available

### craft/compass (L3)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 4 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 4 | 1 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 6 | 0.83 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 4 | 1 |

**no_retrieval issues:**
- Step 1: missing item:stone_pickaxe:1 (or better)
- Step 1: collecting iron_ore requires stone_pickaxe, not available
- Step 3: missing item:iron_pickaxe:1 (or better)
- Step 3: collecting redstone_ore requires stone_pickaxe, not available

**random_retrieval issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available
- Step 3: missing iron_pickaxe
- Step 3: collecting redstone_ore requires stone_pickaxe, not available

**saer_cold issues:**
- Step 2: missing oak_log x3
- Step 3: missing stone_pickaxe
- Step 3: collecting iron_ore requires stone_pickaxe, not available
- Step 5: missing iron_pickaxe
- Step 5: collecting redstone_ore requires stone_pickaxe, not available

**saer_warm issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available
- Step 3: missing iron_pickaxe
- Step 3: collecting redstone_ore requires stone_pickaxe, not available

### craft/golden_sword (L3)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 4 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 4 | 1 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 5 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 4 | 1 |

**no_retrieval issues:**
- Step 1: missing item:stone_pickaxe:1 (or better)
- Step 1: collecting gold_ore requires iron_pickaxe, not available
- Step 3: missing item:planks:2 (from logs)

**random_retrieval issues:**
- Step 2: missing iron_pickaxe
- Step 2: collecting gold_ore requires iron_pickaxe, not available

**saer_cold issues:**
- Step 2: missing wooden_pickaxe
- Step 2: collecting stone requires wooden_pickaxe, not available
- Step 3: collecting gold_ore requires iron_pickaxe, not available
- Step 5: missing stick

**saer_warm issues:**
- Step 2: missing iron_pickaxe
- Step 2: collecting gold_ore requires iron_pickaxe, not available

### craft/iron_boots (L2)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 3 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 4 | 1 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 6 | 0.83 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 5 | 1 |

**no_retrieval issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**random_retrieval issues:**
- Step 2: missing stone_pickaxe
- Step 2: collecting iron_ore requires stone_pickaxe, not available

**saer_cold issues:**
- Step 2: missing oak_planks x3

**saer_warm issues:**
- Step 2: missing wooden_pickaxe
- Step 2: collecting stone requires wooden_pickaxe, not available

### craft/iron_door (L2)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 3 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 3 | 1 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 4 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 7 | 0.71 |

**no_retrieval issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**random_retrieval issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**saer_cold issues:**
- Step 2: missing stone_pickaxe
- Step 2: collecting iron_ore requires stone_pickaxe, not available

**saer_warm issues:**
- Step 2: missing oak_log
- Step 4: missing cobblestone x8
- Step 5: missing stone_pickaxe
- Step 5: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_helmet (L2)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 3 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 3 | 1 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 5 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 5 | 1 |

**no_retrieval issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**random_retrieval issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**saer_cold issues:**
- Step 2: missing wooden_pickaxe
- Step 2: collecting stone requires wooden_pickaxe, not available

**saer_warm issues:**
- Step 2: missing wooden_pickaxe
- Step 2: collecting stone requires wooden_pickaxe, not available

### craft/iron_leggings (L2)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 3 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 4 | 1 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 6 | 0.83 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 6 | 0.83 |

**no_retrieval issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**random_retrieval issues:**
- Step 2: missing stone_pickaxe
- Step 2: collecting iron_ore requires stone_pickaxe, not available

**saer_cold issues:**
- Step 2: missing oak_planks x3

**saer_warm issues:**
- Step 2: missing oak_log x3

### craft/piston (L3)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 6 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 7 | 1 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 7 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 7 | 1 |

**no_retrieval issues:**
- Step 1: collecting cobblestone requires wooden_pickaxe, not available
- Step 2: missing stone_pickaxe
- Step 2: collecting iron_ore requires stone_pickaxe, not available
- Step 4: missing iron_pickaxe
- Step 4: collecting redstone_ore requires stone_pickaxe, not available
- Step 5: missing planks x2

**random_retrieval issues:**
- Step 2: missing wooden_pickaxe
- Step 2: collecting cobblestone requires wooden_pickaxe, not available
- Step 3: missing planks x3
- Step 3: missing stick x2
- Step 4: missing stone_pickaxe
- Step 4: collecting iron_ore requires stone_pickaxe, not available
- Step 6: missing iron_pickaxe
- Step 6: collecting redstone_ore requires stone_pickaxe, not available
- Step 7: missing stick

**saer_cold issues:**
- Step 1: collecting cobblestone requires wooden_pickaxe, not available
- Step 2: missing stone_pickaxe
- Step 2: collecting iron_ore requires stone_pickaxe, not available
- Step 4: missing iron_pickaxe
- Step 4: collecting redstone_ore requires stone_pickaxe, not available

**saer_warm issues:**
- Step 3: missing wooden_pickaxe
- Step 3: collecting cobblestone requires wooden_pickaxe, not available
- Step 4: missing stone_pickaxe
- Step 4: collecting iron_ore requires stone_pickaxe, not available
- Step 6: missing iron_pickaxe
- Step 6: collecting redstone_ore requires stone_pickaxe, not available

### craft/stone_shovel (L1)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 3 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 4 | 0.75 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 3 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 5 | 0.6 |

**no_retrieval issues:**
- Step 1: collecting cobblestone requires wooden_pickaxe, not available
- Step 2: missing planks x2

**random_retrieval issues:**
- Step 2: missing oak_log
- Step 3: missing wooden_pickaxe
- Step 3: collecting stone requires wooden_pickaxe, not available

**saer_cold issues:**
- Step 2: missing wooden_pickaxe
- Step 2: collecting stone requires wooden_pickaxe, not available

**saer_warm issues:**
- Step 2: missing oak_log
- Step 4: missing wooden_pickaxe
- Step 4: collecting cobblestone requires wooden_pickaxe, not available

### craft/torch_batch (L1)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | PASS | 5 | 0.6 |
| Random | OK | FAIL | FAIL | FAIL | 6 | 0.5 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 5 | 0.6 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 4 | 0.75 |

**no_retrieval issues:**
- Step 4: collecting coal_ore requires wooden_pickaxe, not available

**random_retrieval issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting coal_ore requires wooden_pickaxe, not available

**saer_cold issues:**
- Step 2: missing oak_log x2
- Step 4: missing wooden_pickaxe
- Step 4: collecting coal_ore requires wooden_pickaxe, not available

**saer_warm issues:**
- Step 2: missing oak_log x2
- Step 3: missing stone_pickaxe
- Step 3: collecting coal_ore requires wooden_pickaxe, not available

### craft/wooden_sword (L1)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | PASS | PASS | PASS | 4 | 0.5 |
| Random | OK | PASS | PASS | PASS | 4 | 0.5 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 4 | 0.5 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 2 | 1 |

**saer_warm issues:**
- Step 2: missing planks x2
- Step 2: missing stick
