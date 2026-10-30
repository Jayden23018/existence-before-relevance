# SAER v2 Ablation Study — Plan Quality Comparison

Generated: 2026-05-26T08:29:51.257Z

**Model**: qwen3-vl-8b-instruct

## Task Completion Rate (Lenient TCR)
*Lenient: forgives raw_ore naming (e.g. smeltItem("iron_ore") instead of "raw_iron")*

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 2/4 | 0/4 | 1/4 | 3/12 |
| Random | 1/4 | 0/4 | 0/4 | 1/12 |
| SAER-cold (keyword only) | 2/4 | 4/4 | 1/4 | 7/12 |
| **SAER-warm (full, ours)** | 2/4 | 4/4 | 2/4 | 8/12 |

## Strict TCR (any issue = fail)

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 2/4 | 0/4 | 1/4 | 3/12 |
| Random | 1/4 | 0/4 | 0/4 | 1/12 |
| SAER-cold (keyword only) | 2/4 | 4/4 | 1/4 | 7/12 |
| **SAER-warm (full, ours)** | 2/4 | 4/4 | 1/4 | 7/12 |

## Plan Validity Rate (PVR)

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 2/4 | 0/4 | 2/4 | 4/12 |
| Random | 1/4 | 0/4 | 0/4 | 1/12 |
| SAER-cold (keyword only) | 2/4 | 4/4 | 1/4 | 7/12 |
| **SAER-warm (full, ours)** | 2/4 | 4/4 | 2/4 | 8/12 |

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
| Lenient TCR Δ | +0.0% | +0.0% | +25.0% | +8.3% |
| Strict TCR Δ | +0.0% | +0.0% | +0.0% | +0.0% |
| PVR Δ | +0.0% | +0.0% | +25.0% | +8.3% |

*Positive delta → gap scoring helped. Near-zero delta → keyword matching already sufficient.*

## Average Step Efficiency
*min_steps / actual_steps, capped at 1.0*

| Method | L1 | L2 | L3 | Overall |
|--------|----|----|-----|---------|
| No Retrieval | 0.63 | 0.96 | 0.93 | 0.84 |
| Random | 0.63 | 0.87 | 0.96 | 0.82 |
| SAER-cold (keyword only) | 0.63 | 0.96 | 1 | 0.86 |
| **SAER-warm (full, ours)** | 0.59 | 0.93 | 1 | 0.84 |

## Per-Task Detail

### craft/chest (L1)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | PASS | PASS | PASS | 3 | 0.67 |
| Random | OK | FAIL | FAIL | FAIL | 3 | 0.67 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 3 | 0.67 |
| **SAER-warm (full, ours)** | OK | PASS | PASS | PASS | 3 | 0.67 |

**random_retrieval issues:**
- Step 3: missing oak_planks x8

### craft/clock (L3)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | PASS | 10 | 0.7 |
| Random | OK | FAIL | FAIL | FAIL | 4 | 1 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 3 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 2 | 1 |

**no_retrieval issues:**
- Step 4: collecting redstone_ore requires iron_pickaxe, not available
- Step 6: collecting iron_ore requires stone_pickaxe, not available
- Step 7: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

**random_retrieval issues:**
- Step 2: missing stone_pickaxe
- Step 2: collecting iron_ore requires stone_pickaxe, not available
- Goal item "clock" not produced by any step

**saer_warm issues:**
- Step 1: missing None (wooden_pickaxe sufficient)

### craft/compass (L3)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | PASS | PASS | PASS | 5 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 6 | 0.83 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 5 | 1 |
| **SAER-warm (full, ours)** | OK | PASS | PASS | PASS | 3 | 1 |

**random_retrieval issues:**
- Step 3: missing wooden_pickaxe
- Step 3: collecting iron_ore requires stone_pickaxe, not available
- Step 5: missing wooden_pickaxe

**saer_cold issues:**
- Step 5: missing raw_redstone

### craft/golden_sword (L3)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 6 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 6 | 1 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 6 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | PASS | PASS | 5 | 1 |

**no_retrieval issues:**
- Step 4: missing item:stone_pickaxe:1 (or better)
- Step 4: collecting gold_ore requires iron_pickaxe, not available
- Step 5: smeltItem("gold_ore") should be smeltItem("raw_gold") — 1.17+ drops raw materials

**random_retrieval issues:**
- Step 2: missing oak_log
- Step 4: missing stone_pickaxe
- Step 4: collecting gold_ore requires iron_pickaxe, not available

**saer_cold issues:**
- Step 2: missing oak_planks x12
- Step 4: collecting gold_ore requires iron_pickaxe, not available

**saer_warm issues:**
- Step 4: smeltItem("gold_ore") should be smeltItem("raw_gold") — 1.17+ drops raw materials

### craft/iron_boots (L2)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 6 | 0.83 |
| Random | OK | FAIL | FAIL | FAIL | 3 | 1 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 5 | 1 |
| **SAER-warm (full, ours)** | OK | PASS | PASS | PASS | 5 | 1 |

**no_retrieval issues:**
- Step 1: missing None (assuming player can mine without tool or has appropriate pickaxe)
- Step 1: collecting iron_ore requires stone_pickaxe, not available
- Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
- Step 3: missing None (logs can be gathered without tool
- Step 3: missing or with axe if needed)
- Step 4: missing None (planks craft directly from logs)

**random_retrieval issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_door (L2)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 4 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 6 | 0.83 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 5 | 1 |
| **SAER-warm (full, ours)** | OK | PASS | PASS | PASS | 7 | 0.71 |

**no_retrieval issues:**
- Step 1: missing cobblestone x3
- Step 1: missing stick x2
- Step 3: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

**random_retrieval issues:**
- Step 4: missing stone_pickaxe
- Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/iron_helmet (L2)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 3 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 3 | 1 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 5 | 1 |
| **SAER-warm (full, ours)** | OK | PASS | PASS | PASS | 5 | 1 |

**no_retrieval issues:**
- Step 1: missing None (assuming player has access to iron ore blocks)
- Step 1: collecting iron_ore requires stone_pickaxe, not available
- Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

**random_retrieval issues:**
- Step 1: missing stone_pickaxe
- Step 1: collecting iron_ore requires stone_pickaxe, not available
- Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials

### craft/iron_leggings (L2)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 4 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 8 | 0.63 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 6 | 0.83 |
| **SAER-warm (full, ours)** | OK | PASS | PASS | PASS | 5 | 1 |

**no_retrieval issues:**
- Step 3: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
- Step 4: missing iron_ingot x6

**random_retrieval issues:**
- Step 1: collecting stone requires wooden_pickaxe, not available
- Step 4: missing oak_planks x4
- Step 5: missing iron_ingot x3

### craft/piston (L3)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 6 | 1 |
| Random | OK | FAIL | FAIL | FAIL | 3 | 1 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 5 | 1 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 5 | 1 |

**no_retrieval issues:**
- Step 1: collecting iron_ore requires stone_pickaxe, not available
- Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
- Step 6: missing iron_ingot x3

**random_retrieval issues:**
- Step 2: missing stone_pickaxe
- Step 2: collecting iron_ore requires stone_pickaxe, not available
- Step 2: smeltItem("iron_ore") should be smeltItem("raw_iron") — 1.17+ drops raw materials
- Step 3: missing iron_ingot x6

**saer_cold issues:**
- Step 3: missing stone_pickaxe
- Step 3: collecting iron_ore requires stone_pickaxe, not available

**saer_warm issues:**
- Step 4: missing stone_pickaxe
- Step 4: collecting iron_ore requires stone_pickaxe, not available

### craft/stone_shovel (L1)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 4 | 0.75 |
| Random | OK | FAIL | FAIL | FAIL | 4 | 0.75 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 5 | 0.6 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 5 | 0.6 |

**no_retrieval issues:**
- Step 4: missing stone

**random_retrieval issues:**
- Step 1: missing None (logs are accessible without tools)
- Step 4: missing stone

**saer_cold issues:**
- Step 1: missing None (logs are accessible without tool)
- Step 4: missing wooden_pickaxe
- Step 4: collecting stone requires wooden_pickaxe, not available

**saer_warm issues:**
- Step 4: missing wooden_pickaxe
- Step 4: collecting stone requires wooden_pickaxe, not available

### craft/torch_batch (L1)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | FAIL | FAIL | FAIL | 5 | 0.6 |
| Random | OK | FAIL | FAIL | FAIL | 5 | 0.6 |
| SAER-cold (keyword only) | OK | FAIL | FAIL | FAIL | 4 | 0.75 |
| **SAER-warm (full, ours)** | OK | FAIL | FAIL | FAIL | 5 | 0.6 |

**no_retrieval issues:**
- Step 4: missing coal x4
- Step 4: collecting coal_ore requires wooden_pickaxe, not available
- Step 5: collecting coal_ore requires wooden_pickaxe, not available

**random_retrieval issues:**
- Step 2: missing oak_log
- Step 4: missing None (coal drops directly from coal blocks)
- Step 4: collecting coal_ore requires wooden_pickaxe, not available

**saer_cold issues:**
- Step 4: missing coal x4

**saer_warm issues:**
- Step 4: missing we’ll proceed with coal collection assuming access)

### craft/wooden_sword (L1)

| Condition | Parse | Strict | Lenient | PVR | Steps | Efficiency |
|-----------|-------|--------|---------|-----|-------|------------|
| No Retrieval | OK | PASS | PASS | PASS | 4 | 0.5 |
| Random | OK | PASS | PASS | PASS | 4 | 0.5 |
| SAER-cold (keyword only) | OK | PASS | PASS | PASS | 4 | 0.5 |
| **SAER-warm (full, ours)** | OK | PASS | PASS | PASS | 4 | 0.5 |
