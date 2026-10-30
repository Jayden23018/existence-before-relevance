# Demonstration-Bank Provenance

Read this before re-running the generation pipeline. It does **not** affect
offline verification of the paper's numbers, which is the normal path — see
README §3.

## Summary

The demonstration bank received correctness edits *after* the evaluation runs
completed. This archive ships the **evaluation-time** revision of
`data/training/crafting_examples.json`, so that re-running generation starts
from the same few-shot contexts the reported results were produced with. The
later, corrected revision is included alongside it as
`crafting_examples.CORRECTED-2026-07-22.json` and is **not** loaded by any
script.

| File | Revision shipped | SHA-256 (first 16) |
|---|---|---|
| `data/training/crafting_examples.json` | evaluation-time (2026-06-04) | `0da3b85fd6758352` |
| `data/training/crafting_examples.CORRECTED-2026-07-22.json` | corrected, not used | `7f4faf8ba4ebd1e0` |

## How the evaluation-time revision was identified

The per-seed result files record `prompt_length` for every task. Each
candidate revision of the bank was used to reconstruct each task's few-shot
context offline (cold start, empty inventory, top-*k*=3, with the mcData-backed
resolver attached, i.e. the `saer_cold` configuration), and the reconstructed
lengths were compared against the recorded ones for
`eval_20260621_001120_saer_cold_s1.json`:

| Bank revision | Exact `prompt_length` matches |
|---|---|
| 2026-06-04 (shipped here) | **52 / 60** — all 44 craft tasks |
| 2026-07-10 | 25 / 60 |
| 2026-07-22 (corrected) | 24 / 60 |

The 2026-06-04 revision reproduces every craft task byte-exactly, which is what
identifies it as the revision in use when the runs were made (2026-06-04 to
2026-06-21).

## Known residual: collecting and combat

The 8 tasks that do not match under the shipped bank are 6 `collect` and 2
`combat` tasks. `collecting_examples.json`, `combat_examples.json` and
`build_examples.json` were never under version control, so **their
evaluation-time state is not recoverable** and this archive ships their current
state. We could pin the crafting bank and we did; we cannot pin the other
three, and we state that rather than imply a completeness we do not have. The
affected tasks are:

```
collect/sugar_cane   collect/dirt      collect/pointed_dripstone
collect/tuff         collect/calcite   collect/terracotta
combat/kill_enderman combat/kill_wither_skeleton
```

## What the corrected revision changes

Two demonstrations differ between the shipped and corrected banks:

- `crafting/gold_shovel` — the evaluation-time version mines `gold_ore` with no
  pickaxe in inventory, which is not executable in Minecraft 1.20.4 (gold ore
  requires an iron pickaxe). The corrected version inserts the full
  wooden → stone → iron pickaxe prerequisite chain, taking the demonstration
  from 3 steps to 7.
- `crafting/wooden_pickaxe` — one precondition string, `planks:3` →
  `oak_planks:3`.

Re-running the pipeline against the corrected bank changes the few-shot context
for **38 of the 44 craft tasks** (7 L1, 14 L2, 17 L3) and will not reproduce the
reported generations. The corrections are genuine improvements, which is why
they are shipped; they are kept out of the default path because the reported
results predate them.

## Selecting a revision for the overlap audit

The three structural-overlap scripts
(`scripts/eval/jaccard_overlap_holdout_vs_demos.mjs`,
`jaccard_overlap_symmetric.mjs`, `overlap_tercile_stratify.mjs`) read the
crafting bank from `$CRAFTING_BANK`, defaulting to the evaluation-time
revision shipped as `crafting_examples.json`. The supplement reports that
audit under both revisions; to reproduce the corrected-bank column:

```
CRAFTING_BANK=data/training/crafting_examples.CORRECTED-2026-07-22.json \
  node scripts/eval/overlap_tercile_stratify.mjs
```

The corrected revision yields uniformly *higher* overlap (the repaired
gold-shovel chain and the canonical `oak_planks` naming both enlarge the
demonstration-side ingredient sets), so it is the conservative choice for a
contamination bound and is what the main paper's §4.1 quotes.

## What is unaffected

Every number in the paper and the supplement is rescored offline from the
stored per-seed generations by `scripts/eval/mcnemar_table.mjs --rescore`,
which does not consult the demonstration bank. Bank provenance therefore
matters for re-running generation, not for verifying the reported results.
