# SAER v2 Ablation Study — Plan Quality Comparison

Generated: 2026-05-23T03:49:32.819Z

**Model**: qwen3-vl-8b-instruct

## Task Completion Rate (Lenient TCR)
*Lenient: forgives raw_ore naming (e.g. smeltItem("iron_ore") instead of "raw_iron")*

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 2/4 | 0/4 | 1/4 | 3/12 |
| Random | 2/4 | 0/4 | 1/4 | 3/12 |
| SAER-cold (keyword only) | 2/4 | 2/4 | 1/4 | 5/12 |
| **SAER-warm (full, ours)** | 2/4 | 1/4 | 0/4 | 3/12 |

## Strict TCR (any issue = fail)

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 2/4 | 0/4 | 1/4 | 3/12 |
| Random | 2/4 | 0/4 | 1/4 | 3/12 |
| SAER-cold (keyword only) | 2/4 | 2/4 | 1/4 | 5/12 |
| **SAER-warm (full, ours)** | 2/4 | 1/4 | 0/4 | 3/12 |

## Plan Validity Rate (PVR)

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 2/4 | 2/4 | 1/4 | 5/12 |
| Random | 2/4 | 0/4 | 1/4 | 3/12 |
| SAER-cold (keyword only) | 2/4 | 2/4 | 2/4 | 6/12 |
| **SAER-warm (full, ours)** | 2/4 | 1/4 | 1/4 | 4/12 |

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
| Lenient TCR Δ | +0.0% | -25.0% | -25.0% | -16.7% |
| Strict TCR Δ | +0.0% | -25.0% | -25.0% | -16.7% |
| PVR Δ | +0.0% | -25.0% | -25.0% | -16.7% |

*Positive delta → gap scoring helped. Near-zero delta → keyword matching already sufficient.*

## Average Step Efficiency
*min_steps / actual_steps, capped at 1.0*

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 0.61 | 0.89 | 0.92 | 0.8 |
| Random | 0.63 | 0.87 | 0.96 | 0.82 |
| SAER-cold (keyword only) | 0.63 | 0.86 | 1 | 0.83 |
| **SAER-warm (full, ours)** | 0.59 | 0.92 | 0.92 | 0.81 |

## Per-Task Detail

### craft/chest (L1)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | PASS | PASS | PASS | 3 | 0.67 |
| Random | OK | PASS | PASS | PASS | 3 | 0.67 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 3 | 0.67 |
| **SAER-warm (full, ours)** | OK | PASS | PASS | PASS | 3 | 0.67 |

### craft/clock (L3)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | PASS | PASS | PASS | 4 | 1 |
| Random | OK | PASS | PASS | PASS | 3 | 1 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 2 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 6 | 1 |

**saer_warm issues:**
- Step 2: missing oak_log x3
- Step 4: missing stone_pickaxe
- Step 4: collecting gold_ore requires iron_pickaxe, not available
- Step 6: missing gold_ingot x3
- Goal item "clock" not produced by any step

### craft/compass (L3)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 3 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 6 | 0.83 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 4 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 3 | 1 |

**no_retrieval issues:**
- Step 1: missing None (assume iron_ore available or collected previously)
- Step 1: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
- Step 2: missing None (redstone can be collected with hand or any tool
- Step 2: missing no tool required)

**random_retrieval issues:**
- Step 2: missing oak_log
- Step 4: missing stone_pickaxe
- Step 4: collecting iron_ore requires stone_pickaxe, not available

**saer_cold issues:**
- Step 2: missing stone_pickaxe
- Step 2: collecting iron_ore requires stone_pickaxe, not available

**saer_warm issues:**
- Step 1: collecting redstone_ore requires stone_pickaxe, not available
- Step 2: missing stone_pickaxe
- Step 2: collecting iron_ore requires stone_pickaxe, not available

### craft/golden_sword (L3)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 9 | 0.67 |
| Random | OK | FAIL | FAIL | FAIL | 5 | 1 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | PASS | 5 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | PASS | 9 | 0.67 |

**no_retrieval issues:**
- Step 4: missing iron_pickaxe
- Step 4: collecting iron_ore requires stone_pickaxe, not available
- Step 5: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
- Step 8: smeltItem("gold_ore") should be smeltItem("raw_gold") — 1.17+ drops raw materials

**random_retrieval issues:**
- Step 2: missing wooden_pickaxe
- Step 2: collecting stone requires wooden_pickaxe, not available
- Step 3: collecting gold_ore requires iron_pickaxe, not available

**saer_cold issues:**
- Step 3: collecting gold_ore requires iron_pickaxe, not available

**saer_warm issues:**
- Step 7: collecting gold_ore requires iron_pickaxe, not available

### craft/iron_boots (L2)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | PASS | 6 | 0.83 |
| Random | OK | FAIL | FAIL | FAIL | 4 | 1 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 7 | 0.71 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 6 | 0.83 |

**no_retrieval issues:**
- Step 1: collecting iron_ore requires stone_pickaxe, not available
- Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

**random_retrieval issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

**saer_warm issues:**
- Step 2: missing oak_log x3
- Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_door (L2)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 7 | 0.71 |
| Random | OK | FAIL | FAIL | FAIL | 6 | 0.83 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 4 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 3 | 1 |

**no_retrieval issues:**
- Step 2: missing log x12
- Step 4: missing iron_ore x6
- Step 4: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

**random_retrieval issues:**
- Step 4: missing stone_pickaxe
- Step 4: collecting iron_ore requires stone_pickaxe, not available

**saer_cold issues:**
- Step 2: missing stone_pickaxe
- Step 2: collecting iron_ore requires stone_pickaxe, not available
- Step 4: missing iron_ingot x6

**saer_warm issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available
- Step 3: missing iron_ingot x6

### craft/iron_helmet (L2)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 2 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 6 | 0.83 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 7 | 0.71 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 6 | 0.83 |

**no_retrieval issues:**
- Step 1: missing None (assuming iron ore available)
- Step 1: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

**random_retrieval issues:**
- Step 4: missing iron_pickaxe
- Step 4: collecting iron_ore requires stone_pickaxe, not available

**saer_cold issues:**
- Step 4: missing item:wooden_pickaxe:1 (assumed available from Step 2 if not explicitly crafted)
- Step 4: collecting stone requires wooden_pickaxe, not available

**saer_warm issues:**
- Step 2: missing wooden_pickaxe

### craft/iron_leggings (L2)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | PASS | 3 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 6 | 0.83 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 5 | 1 |
| **SAER-warm (full, ours)** | OK | PASS | PASS | PASS | 5 | 1 |

**no_retrieval issues:**
- Step 1: collecting iron_ore requires stone_pickaxe, not available
- Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

**random_retrieval issues:**
- Step 2: missing oak_log
- Step 4: missing stone_pickaxe
- Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/piston (L3)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 7 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 6 | 1 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 7 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 6 | 1 |

**no_retrieval issues:**
- Step 3: missing stone_pickaxe
- Step 3: collecting iron_ore requires stone_pickaxe, not available
- Step 4: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

**random_retrieval issues:**
- Step 4: missing stone_pickaxe
- Step 4: collecting iron_ore requires stone_pickaxe, not available

**saer_cold issues:**
- Step 2: missing oak_log
- Step 4: missing stone_pickaxe
- Step 4: collecting iron_ore requires stone_pickaxe, not available

**saer_warm issues:**
- Step 3: missing wooden_pickaxe
- Step 3: collecting stone requires wooden_pickaxe, not available
- Step 4: missing stone_pickaxe
- Step 4: collecting iron_ore requires stone_pickaxe, not available
- Step 6: collecting stone requires wooden_pickaxe, not available

### craft/stone_shovel (L1)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 6 | 0.5 |
| Random | OK | FAIL | FAIL | FAIL | 4 | 0.75 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 4 | 0.75 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 5 | 0.6 |

**no_retrieval issues:**
- Step 1: missing None (stone can be collected with wooden pickaxe or better; assuming player has one)
- Step 1: collecting stone requires wooden_pickaxe, not available
- Step 2: missing item:stone:1 (already collected)
- Step 3: missing None (logs can be collected with hand or wooden pickaxe)

**random_retrieval issues:**
- Step 2: missing oak_log
- Step 4: missing stone

**saer_cold issues:**
- Step 2: missing oak_planks x4
- Step 3: missing wooden_pickaxe
- Step 3: collecting stone requires wooden_pickaxe, not available

**saer_warm issues:**
- Step 4: missing wooden_pickaxe
- Step 4: collecting stone requires wooden_pickaxe, not available

### craft/torch_batch (L1)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 4 | 0.75 |
| Random | OK | FAIL | FAIL | FAIL | 5 | 0.6 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 5 | 0.6 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 5 | 0.6 |

**no_retrieval issues:**
- Step 1: missing None (logs are easy to mine)
- Step 4: missing coal x4

**random_retrieval issues:**
- Step 4: missing item:stone_pickaxe:1 (assumed available or previously crafted)
- Step 4: collecting coal_ore requires wooden_pickaxe, not available

**saer_cold issues:**
- Step 4: missing stone_pickaxe
- Step 4: collecting coal_ore requires wooden_pickaxe, not available
- Step 5: missing coal x4

**saer_warm issues:**
- Step 2: missing oak_log x3
- Step 4: collecting coal_ore requires wooden_pickaxe, not available
- Step 5: missing coal

### craft/wooden_sword (L1)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | PASS | PASS | PASS | 4 | 0.5 |
| Random | OK | PASS | PASS | PASS | 4 | 0.5 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 4 | 0.5 |
| **SAER-warm (full, ours)** | OK | PASS | PASS | PASS | 4 | 0.5 |
