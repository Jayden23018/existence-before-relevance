# Code and Data — Existence Before Relevance (NEmo Workshop, NeurIPS 2026)

This archive contains the full source, benchmark, and raw per-task results for the
paper. Every confirmatory number — the main cross-model table, the ablation, and the
appendix tables derived from them — can be recomputed offline from the JSON files
included here, with no API keys and no Minecraft server.

Two exploratory appendix tables are outside that guarantee, and the paper says so in
both places: the 35-task weight-ablation table and the 42-task retrieval-baseline table
predate this benchmark, their task lists and runs are not in this archive, and the SBERT
condition in the latter is no longer reproducible at the same model revision. They can
be cross-checked against each other but not recomputed from anything shipped here. No
claim in the body rests on either.

## 1. Contents

```
src/                              bot + enhancer source (JavaScript, ES modules)
  models/enhancers/
    saer_scorer.js                the method: 4-dimension example scorer
    fewshot_learning.js           prompt construction, calls the scorer
    recipe_resolver.js            crafting/smelting graph + tool tiers from mcData
    bm25_retriever.js             BM25 baseline used in the ablation
    plan_validator.js             post-generation plan validation (PVR metric)
    implicit_enhancer_v2.js       request pipeline entry point
    task_manager.js               bounded step executor (live evaluation only)
    precondition_parser.js        shared parsing utilities
    block_name_resolver.js        version-specific block-name resolution
data/training/                    demonstration bank retrieved over
                                  (paper's pool = 25 + 21 + 9 = 55 examples)
  crafting_examples.json          25 examples (6 L1 / 11 L2 / 8 L3)
                                  ** pinned to the evaluation-time revision **
  crafting_examples.CORRECTED-2026-07-22.json
                                  later corrected bank, not loaded by default — see
                                  PROVENANCE.md.  The three overlap scripts read the
                                  bank path from $CRAFTING_BANK, so both revisions of
                                  the structural-overlap audit are reproducible.
  collecting_examples.json        21 examples (5 L1 / 11 L2 / 5 L3)
  combat_examples.json            9 examples  (4 L1 / 2 L2 / 3 L3)
  build_examples.json             10 examples (not used by any benchmark task)
  DATA_SPEC.md                    schema documentation
PROVENANCE.md                     which bank revision produced the reported results
scripts/eval/
  eval_tasks.json                 the 60-task held-out benchmark (L1/L2/L3 x 20)
  static_plan_eval.js             main evaluation harness (all 7 conditions)
  mcnemar_table.mjs               ** authoritative re-scorer for every paper number **
  check_paper_tables.py           internal-consistency checker for the longer
                                  companion write-up; not used by this submission
  rescore_majority_vote.mjs       per-task majority vote over 3 seeds; takes a JSON
                                  groups file as its one argument (section 5)
  rescore_mcnemar.mjs             paired McNemar for one (model, condA, condB)
  rescore_combat.mjs              combat probe, both rounds; --recorded reproduces
                                  the run-time verdicts the main paper quotes
  fisher_stratified.py            stratified tests
  subfrontier_analysis.mjs        capacity de-aliasing panel (appendix).  Note: it
                                  scores from the run-time verdicts, not the
                                  re-scorer -- see the appendix's scoring caveat
  intent_accuracy.mjs             runs the deployed intent classifier over the frozen
                                  task list (appendix, oracle-category disclosure).
                                  Needs an API key; the 180 recorded trials it
                                  produced ship under results/intent_accuracy/ and
                                  are checkable offline
  jaccard_overlap_*.mjs           train/test overlap audit
  live_eval_harness.js            live Minecraft evaluation (limitation section)
  results/
    canonical/                    no_retrieval / random / BM25 baselines
    fixed_mcdata/                 SAER conditions after the resolver fix
    combat_holdout_r4/            5-task combat probe
    intent_accuracy/              180 per-trial routing records (3 seeds x 60 tasks):
                                  ground-truth category, predicted label, the
                                  demonstration file each resolves to, confidence
tests/                            plain-node runner (no framework); see section 4
profiles/                         per-model evaluation configs
docs/paper/neurips_ws/            the submitted paper and its own checkers
  MCAI_neurips_ws.tex/.pdf        the submission (body + appendices)
  check_replication_panel.py      re-derives every cell of the replication panel
                                  from the re-scorer and fails on any mismatch
  check_appendix_tables.py        re-derives the appendix tables the same way
  holm_check.py                   Bonferroni vs Holm-Bonferroni on the test family
live_env/                         the live runs' execution environment, shipped for
                                  inspection and NOT installed -- see section 5
  minecraft-protocol/             vendored fork of minecraft-protocol 1.57.0.  Exactly
                                  one file differs from upstream: src/client/chat.js,
                                  where Buffer.concat is given an array rather than
                                  spread arguments and unsigned entries are filtered
                                  out.  Upstream BSD-3-Clause LICENSE retained.
  patches/                        the five patch-package patches used by the live runs
main.js, settings.js              bot entry point and runtime configuration
package.json, package-lock.json   pinned dependency versions
keys.json.example                 API-key template (only needed to re-run generation)
LICENSE                           MIT.  src/ derives from the MINDcraft framework cited
                                  in the paper and carries its upstream copyright.
                                  live_env/minecraft-protocol/ carries its own
                                  BSD-3-Clause notice from PrismarineJS.
evidence/knowledge_reuse/         cross-agent context-reuse study (the cross-agent
                                  context-reuse appendix)
  paired_trials.csv               30 target-matched (normal, explicit, implicit) triplets
  trial_by_trial.csv              all 90 trials, one row per trial, 47 columns
  paired_statistics.json          published means, sign tests, bootstrap intervals
  reproduce_paired_stats.py       ** offline re-check of every cross-agent number **
  metrics_definition.md           definitions of coverage, excess visits, post-discovery
  integrity_audit.json            18 pre-registered validity checks over the 90 trials
  experiment_manifest.json        conditions, scenarios, cells, Minecraft version
  model_interaction_log.jsonl     every model call, verbatim prompt and response
  execution_log.jsonl             per-trial execution trace
  reset_audit.csv                 per-trial world/inventory/health reset verification
  terminal_logs/                  raw run consoles, one per (model, condition)
  raw_results/                    unmodified harness output the CSVs are derived from
evidence/allocation/              prior 120-trial work-allocation study (supplement only;
                                  no main-paper claim rests on it)
  aggregate.csv                   per model x condition x domain success/coverage/overlap
  trial_by_trial.csv              all 120 trials, one row per trial
  paired_statistics.json          per-model and pooled McNemar / sign tests
  integrity_audit.json            validity checks over the 120 trials
  reset_audit.csv                 per-trial world/inventory reset verification
  supplement_trial_rows.tex       the 120-row table typeset in the supplement
  metrics_definition.md           coverage, overlap, duplicate-effort definitions
  model_communication_log.md      verbatim model calls
  physical_execution_log.md       per-trial physical action trace
  raw_results/                    the six run-time harness outputs the CSVs above are
                                  derived from, one per (model, condition)
```

## 2. Verifying the paper's numbers (offline, ~10 seconds)

The scripts print the primary metric as **TCR**; the paper calls the same quantity
the **Strict Plan Pass Rate (SPR)**.

```
npm install
pip install numpy scipy plancraft
node scripts/eval/mcnemar_table.mjs --rescore
python3 docs/paper/neurips_ws/check_replication_panel.py
python3 docs/paper/neurips_ws/check_appendix_tables.py
python3 docs/paper/neurips_ws/holm_check.py
python3 evidence/knowledge_reuse/reproduce_paired_stats.py
```

**Python dependencies.** Only `check_appendix_tables.py` needs any: it shells out to the
Plancraft cross-validation probe, which imports `plancraft` (the external recipe oracle
the paper cross-validates against) and `numpy`/`scipy` for the stratified test. Without
them that probe returns an empty table and the checker reports `could not parse the
stratified crossval table -- format changed?`, which is a missing dependency and not a
data problem. The other three checkers and `mcnemar_table.mjs` are pure standard
library / pure Node and need nothing beyond `npm install`.

Expected output of the four checkers, in order:

```
ALL CONSISTENT (8 panel runs, 4 paired comparisons)
ALL CONSISTENT (71 assertions over 7 tables)
assertions passed: Bonferroni 9/13, Holm 11/13
35/35 checks passed
```

`mcnemar_table.mjs --rescore` is the single authority for every count, percentage,
b/c pair, exact-binomial p-value, and confidence interval in the paper. It reads the
per-seed JSON under `scripts/eval/results/`, recomputes the per-task majority vote
(>=2 of 3 seeds), and prints one line per test together with the arithmetic identity
`TCR_saer == TCR_no_ret + b - c` for each. It also prints the 13-test Bonferroni
family and the tests deliberately kept outside it.

Two of the three checkers under `docs/paper/neurips_ws/` parse the submitted `.tex`
directly and re-derive its cells rather than merely checking them for internal
coherence: `check_replication_panel.py` and `check_appendix_tables.py` each shell out
to the re-scorer and fail on any disagreement with the typeset number, so a hand-copied
table cell that has drifted away from its run fails the check instead of compiling
silently.

`holm_check.py` is weaker and should not be read as the same kind of guarantee. It
neither reads the `.tex` nor calls the re-scorer: its thirteen (b, c) pairs are
literals transcribed into the file from `mcnemar_table.mjs --rescore`, and what it
verifies is that the Bonferroni and Holm verdicts follow from those literals. It would
not notice if the re-scorer began producing different counts. The literals can be
checked by eye against the re-scorer's own family block, which prints the same thirteen
tests; they agree as shipped.

All commands in this section assume the archive root as the working directory; several
scripts resolve `scripts/eval/results/` relative to `$PWD`.

The Plancraft cross-validation table has its own entry point, named in that table's
caption in the paper. Both scripts run standalone:

```
node scripts/eval/plancraft_crossval.mjs             # agreement rate and Cohen's kappa
node scripts/eval/plancraft_crossval_stratified.mjs  # the per-condition false-positive table
```

These two write their results to `scripts/eval/results/plancraft_crossval.json` and
`plancraft_crossval_stratified.json`, which are not in the shipped archive and appear
when you run them; `check_appendix_tables.py` invokes both, so the blessed section-2
path creates them too. They are the only files any documented command adds. Nothing in
the archive is overwritten or deleted, `npm install` rewrites `package-lock.json` as npm
always does, and if you want a byte-exact before/after comparison, take a checksum
manifest of the extracted tree first.

**A note on the companion manuscript.** A longer version of this work, under a different
title and covering the same runs, is under review at another venue; several manifests and
`scripts/eval/check_paper_tables.py` still refer to it and to its page budget. This is
disclosed here because the workshop's policy permits concurrent submission, and because a
reviewer will otherwise meet those references without explanation. Nothing in the
submitted paper depends on that manuscript, and `check_paper_tables.py` is its checker,
not this submission's — it exits with `FileNotFoundError` here, by design.

The structural-overlap audit in the supplement is reported under both revisions of the
demonstration bank. The shipped default reproduces the evaluation-time column; export
`CRAFTING_BANK=data/training/crafting_examples.CORRECTED-2026-07-22.json` to reproduce
the corrected-bank column that the main paper's §4.1 quotes:

```
node scripts/eval/jaccard_overlap_holdout_vs_demos.mjs
node scripts/eval/jaccard_overlap_symmetric.mjs
node scripts/eval/overlap_tercile_stratify.mjs
```

The gathering-task overlap check (§4.1, Appendix N; 0/11 goal items are a
demonstration's final product, combat positive control 5/5) is one more offline
script:

```
node scripts/eval/collect_overlap_check.mjs
```

The three supplementary analyses of scorer and demonstration quality reproduce
with two further scripts. Both are offline and take a few seconds:

```
node scripts/eval/measure_consumption_leniency.mjs            # replenishment load
node scripts/eval/measure_consumption_leniency.mjs --mcnemar  # consumption-corrected tests
node scripts/eval/measure_consumption_leniency.mjs --mcnemar --replication  # Gemma4 panel, debited
node scripts/eval/measure_consumption_leniency.mjs --demos    # demonstration-bank audit
node scripts/eval/measure_consumption_leniency.mjs --quantity # oak_planks fingerprint
node scripts/eval/retriever_defect_exposure.mjs               # SAER vs BM25 defect exposure
```

`measure_consumption_leniency.mjs` self-tests its detector in both directions before
reporting and exits non-zero if either direction fails, or if it finds no result files
(which means it was run from the wrong working directory). `--demos` and
`retriever_defect_exposure.mjs` read the *evaluation-time* crafting bank pinned in this
release -- the pool the reported runs retrieved over -- and print which bank they used;
both honour the same `CRAFTING_BANK` override as the overlap scripts above. Reading the
corrected bank instead lowers the demonstration-defect counts and is not what the
supplement reports.

The collaboration stage's implementation ships alongside its data:

```
src/team/shared_memory.js                     world facts, capabilities, reservations,
                                              supply requests, work ledger (1259 lines)
src/models/enhancers/collaborative_planner.js cost comparison and plan rewriting
src/plugins/TestingExtension/test_runner.js   the harness that ran both live studies
src/plugins/TestingExtension/test_tasks.js    the scenario definitions it loads
```

Only the world-fact path (`recordWorldFact` / `queryWorldFacts`) is on the measured
route of the knowledge-reuse study; the other subsystems are present so the system
description in the supplement can be checked against the code, not because any
reported number exercises them. Neither live study re-runs from this archive: both
need a Minecraft server, and the fork and patches under `live_env/` ship for
inspection rather than wired into `package.json` (see section 5).

The 120-trial work-allocation study under `evidence/allocation/` ships its raw
per-trial data, aggregates and paired statistics, but has no offline re-check
script of its own; its numbers can be re-derived from `trial_by_trial.csv` and
`aggregate.csv`. It supports a supplement-only appendix and no main-paper claim.

`reproduce_paired_stats.py` recomputes the cross-agent context-reuse appendix from the
per-trial logs: both paired contrasts (mean difference, win/loss counts, exact
two-sided sign test, bootstrap interval), the per-model decomposition, and every
cell of the pooled condition table. Deterministic quantities are asserted against
the published values; the bootstrap interval is re-resampled with a fixed seed and
checked within 0.2 s. Expected output: `35/35 checks passed`.

Note on the `*_majority_vote.json` files inside each run directory: these were
written at run time, i.e. before two scoring fixes described in the supplement, and
therefore do **not** all agree with the paper. They are kept unmodified so the
pre-fix/post-fix evidence chain stays auditable. The authority is the re-scorer
above, never those files.

## 3. Re-running the evaluation (requires API keys)

Read `PROVENANCE.md` first. `data/training/crafting_examples.json` is pinned to
the revision in use when the reported runs were made, so generation starts from
the same few-shot contexts; the later corrected bank ships alongside it under a
distinct name and is not loaded.

```
cp keys.json.example keys.json     # fill in the providers you want
node scripts/eval/static_plan_eval.js --mode saer_cold --seeds 3 --retries 3
node scripts/eval/static_plan_eval.js --mode no_retrieval --seeds 3 --retries 3
```

`--mode` accepts `no_retrieval`, `random_retrieval`, `bm25_retrieval`, `saer_cold`,
`saer_warm`, `saer_full`, `sbert_retrieval`. Optional filters: `--level L2`,
`--slug craft/iron_pickaxe`. Model selection is per profile in `profiles/`.

Generation is stochastic and provider-hosted; re-running will not reproduce the JSON
byte-for-byte. The offline path in section 2 is the one that reproduces the reported
statistics exactly.

## 4. Running the tests

```
for f in tests/*.test.js; do echo "== $f"; node "$f"; done
```

Plain-node runner with `process.exit` codes; there is no test framework dependency.
All seven files run against this archive as shipped and pass — 524 assertions across
the retriever, resolver, validator, executor, request pipeline and intent router
(18 + 149 + 130 + 66 + 61 + 67 + 33). One further assertion in
`intent_routing.test.js` guards the schema of `cooking_examples.json`; since that file
is excluded (section 5), it reports `SKIP` with a reason rather than passing, giving
33 here against 34 in the full repository.

## 5. Known deviations and exclusions

- `data/training/cooking_examples.json` (38 MB, 3975 entries) is **excluded**. It uses
  an unrelated `{instruction, input, output}` schema, is incompatible with the
  retrieval scorer, and no benchmark task exercises the COOK intent. Nothing in the
  paper depends on it.
- Run transcripts (`*.log`) from the static evaluation are excluded; the
  machine-readable per-seed JSON they
  narrate is included in full.
- Absolute filesystem paths were rewritten for anonymity — to `/path/to/...` in shell
  scripts and in seven superseded `comparison_*.json` artifacts, and to `REPO_ROOT`
  under `evidence/`: in the nine terminal logs and nine raw result files of
  `knowledge_reuse/`, in three files derived from them
  (`knowledge_reuse/execution_log.jsonl`, `reset_audit.csv`, `trial_by_trial.csv`),
  and in the allocation study's `trial_by_trial.csv` and six raw result files. Only
  those path strings were changed; no measurement, verdict or timestamp was altered.
- **Consequence for the SHA-256 manifests.** `evidence/*/experiment_manifest.json`
  records the hashes of the *original* files, taken at run time before that
  rewriting, so no file it lists still hashes to the recorded value: the 18
  knowledge-reuse files differ, and each of the six allocation raw results is
  exactly 548 bytes shorter than its recorded size for the same reason. The
  manifests are kept unmodified as the run-time provenance record. To verify the
  archive itself, use `evidence/CHECKSUMS_AS_SHIPPED.txt`, which covers all 71 files
  under `evidence/`:

  ```
  shasum -a 256 -c evidence/CHECKSUMS_AS_SHIPPED.txt
  ```

  The six run-time source JSONs referenced by the allocation manifest ship under
  `evidence/allocation/raw_results/` (path-sanitised as above). The five harness
  implementation files referenced by the knowledge-reuse manifest are not part of
  this release; those entries are provenance records, not verifiable artifacts here.
- The 18 full-screen screen recordings are **excluded** (video, too large to ship).
  `evidence/knowledge_reuse/recording_manifest.csv` describes them and
  `contact_sheets/` provides three sampled frames from each, which is what the
  supplement's contact-sheet figure is built from.
- Eleven unrelated character-demo profiles inherited from the upstream framework
  were removed; they carried absolute skin-file paths belonging to the upstream
  author and no evaluation uses them. All 35 model-configuration profiles remain.
- The local RCON password in `scripts/eval/livebot_manifest.json` was replaced with a
  placeholder; it addressed a loopback test server only (`127.0.0.1`).
- `keys.json` is not included (only the template). The repository never tracked it.
- **The live-evaluation path is not reproducible from this archive alone**, even
  though its two missing components now ship. `live_env/` contains the vendored
  `minecraft-protocol` fork and the five `patch-package` patches the live runs used.
  They are **not** wired into `package.json`, for two measured reasons:
  - The patches are pinned to `mineflayer` 4.26.0/4.27.0 while this archive locks
    4.37.1. Placing them where `postinstall` finds them makes `npm install` fail with
    `Failed to apply patch file mineflayer+4.27.0.patch`. (Three of the five do apply:
    `mineflayer@4.26.0`, `mineflayer-pvp@1.3.2`, `prismarine-viewer@1.33.0`. Of the
    other two, one targets `@google/generative-ai`, which this archive does not depend
    on.)
  - Restoring `"minecraft-protocol": "file:minecraft-protocol"` installs the fork at
    1.57.0 at top level, but `mineflayer` 4.37.1 resolves its own nested
    `minecraft-protocol` 1.66.2 and uses that; no file in `src/` or `scripts/` imports
    `minecraft-protocol` directly. The fork would be installed and never executed.

  So `npm install` resolves the stock transitive dependency and `postinstall` reports
  `No patch files found`, exactly as before. `live_env/` ships the artefacts the live
  runs actually used — for inspection and for reconstructing that environment
  deliberately — not as a working live setup. Reproducing the live path additionally
  requires a local Minecraft 1.20.4 server and provider credentials. Everything in
  sections 2 and 4 is unaffected — none of it touches `mineflayer`. As stated in the
  paper, live pass rates are execution-framework-bound and are reported as a
  limitation, not as supporting evidence for the method.
- The live-execution appendix's numbers come from `scripts/eval/results/live_eval_log_run5_planB.jsonl`
  and `live_eval_results_run5_planB.jsonl`. The other run and pilot logs in that
  directory are superseded development runs, kept so the debugging chain behind the
  bundled-step fix stays auditable; no reported number rests on them.
- Several shipped scripts are not part of any reported result and do not run
  standalone. None of them is on the path of section 2 or 4. **The list below is
  illustrative, not exhaustive**: the archive also ships development and queue-running
  utilities under `scripts/eval/` that are named in neither this README nor the paper.
  Treat `mcnemar_table.mjs --rescore` and the four checkers in section 2 as the only
  authorities for a reported number; no other script in the archive is one, whatever it
  prints.
  - `scripts/eval/static_eval.js` — the superseded 12-task comparison. It loads
    `max.json`, which does ship, and then exits because it calls a model: `Fatal error:
    API key "QWEN_API_KEY" not found`. No reported number comes from it.
  - `scripts/eval/fisher_stratified.py` — a filter that reads JSON from stdin.
  - `scripts/eval/static_live_correlation.mjs` — its default input filename
    (`results/live_eval_results.jsonl`) is not what the shipped log is called, so a bare
    invocation exits with `Live results not found`. It does run against the shipped log:
    `node scripts/eval/static_live_correlation.mjs --live scripts/eval/results/live_eval_results_run5_planB.jsonl`.
  - `scripts/eval/rescore_majority_vote.mjs`, `extract_raw_plans.js`,
    `merge_static_eval.js` — these require an argument and throw or print a usage
    line if invoked bare. `rescore_majority_vote.mjs` takes a JSON file mapping a
    label to that run's three seed files:

    ```
    echo '{"qwen-max/saer_cold":[
      "scripts/eval/results/fixed_mcdata/eval_20260621_001120_saer_cold_s1.json",
      "scripts/eval/results/fixed_mcdata/eval_20260621_001120_saer_cold_s2.json",
      "scripts/eval/results/fixed_mcdata/eval_20260621_001120_saer_cold_s3.json"]}' > groups.json
    node scripts/eval/rescore_majority_vote.mjs groups.json
    ```

    It reports old-vs-corrected TCR (SPR in the paper) and the per-task flips (49/60 for the run above,
    agreeing with `mcnemar_table.mjs --rescore`). `mcnemar_table.mjs --rescore` is
    the entry point that needs no arguments and is the one section 2 uses.
