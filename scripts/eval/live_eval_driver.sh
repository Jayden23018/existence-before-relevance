#!/usr/bin/env bash
#
# live_eval_driver.sh — crash-resilient + per-task-isolated wrapper.
#
# TWO problems this solves:
#  1. harness crashes mid-run (cleanKill edge cases, bot disconnect, OOM).
#  2. bot process STATE DEGRADATION over a long session — observed in deepseek
#     full run: no_retrieval success dropped 65%→0% as the bot accumulated 26+
#     trials (window/pathfinder/memory pollution). saer_cold (run after no_ret)
#     was 0/105 purely from running in a degraded bot. --resume skips done trials
#     but reuses the SAME degraded bot, so it can't fix this.
#
# Fix: run each TASK in its OWN harness process (fresh bot). 2 conditions × 3 seeds
# = 6 trials/bot, well under the ~26-trial degradation threshold. Within a process
# the harness interleaves conditions per seed so degradation hits both evenly.
# Driver loops tasks, retrying each task's batch until all its trials are present.
#
# Usage:
#   bash scripts/eval/live_eval_driver.sh <model> <tasks_csv> <conditions_csv> <seeds> [run_tag]
# run_tag defaults to run5_planB (matches live_eval_harness.js's own default) — pass
# a fresh tag (e.g. run7_vanilla_fixb) to write to a separate results file instead
# of appending to the canonical run5_planB.jsonl.
# Env: HTTPS_PROXY for OpenRouter models.
# Only ever ADDS to live_eval_results_<run_tag>.jsonl.

set -u
MODEL="${1:?usage: $0 <model> <tasks_csv> <conditions_csv> <seeds> [run_tag]}"
TASKS="${2:?}"
CONDS="${3:?}"
SEEDS="${4:?}"
RUN_TAG="${5:-run5_planB}"
MAX_ATTEMPTS_PER_TASK=8
# Must match RESULTS_PATH in live_eval_harness.js.
RESULTS="scripts/eval/results/live_eval_results_${RUN_TAG}.jsonl"
cd "$(dirname "$0")/../.."

COUNTJS="$(mktemp)"
cat > "$COUNTJS" <<JS
const fs = require('fs');
const [task, condsCsv, seedsStr, model] = [process.argv[2], process.argv[3], process.argv[4], process.argv[5]];
const conds = condsCsv.split(','); const seeds = parseInt(seedsStr, 10);
const total = conds.length * seeds;
const done = new Set();
try { for (const l of fs.readFileSync('${RESULTS}', 'utf8').trim().split('\n').filter(Boolean)) { const t = JSON.parse(l); if (t.model === model && t.task === task) done.add(t.condition + '|' + t.seed); } } catch (e) {}
console.log(done.size + '/' + total);
JS

IFS=',' read -ra TASK_ARR <<< "$TASKS"
echo "[driver] model=$MODEL, ${#TASK_ARR[@]} tasks, conds=$CONDS, seeds=$SEEDS"

for task in "${TASK_ARR[@]}"; do
    echo "[driver] === TASK: $task ($(date '+%H:%M:%S')) ==="
    for attempt in $(seq 1 "$MAX_ATTEMPTS_PER_TASK"); do
        PROGRESS="$(node "$COUNTJS" "$task" "$CONDS" "$SEEDS" "$MODEL" 2>/dev/null || echo '0/1')"
        done_n="${PROGRESS%/*}"; total_n="${PROGRESS#*/}"
        echo "[driver]   $task attempt $attempt/$MAX_ATTEMPTS_PER_TASK — $PROGRESS"
        if [ "$done_n" -ge "$total_n" ] 2>/dev/null; then
            echo "[driver]   $task DONE ($PROGRESS)"; break
        fi
        # Fresh harness process per attempt = fresh bot (defeats state degradation)
        node scripts/eval/live_eval_harness.js \
            --model "$MODEL" --tasks "$task" --conditions "$CONDS" \
            --seeds "$SEEDS" --timeout 300000 --resume --run-tag "$RUN_TAG" > /tmp/live_eval_driver_last.log 2>&1
        rc=$?
        echo "[driver]   harness exited rc=$rc"
        sleep 6
    done
done
rm -f "$COUNTJS"
echo "[driver] ALL TASKS COMPLETE ($(date '+%H:%M:%S'))"
