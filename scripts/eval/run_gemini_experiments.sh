#!/bin/bash
# Gemma4 via Google AI Studio (Gemini API) 实验脚本
# 用法: bash run_gemini_experiments.sh [26b|31b|all]
# 无需 Ollama，直接调用 Gemini API，代理走 127.0.0.1:7897

export HTTPS_PROXY=http://127.0.0.1:7897
export https_proxy=http://127.0.0.1:7897

LOG=/path/to/saer/scripts/eval/results/gemini_run.log
EVAL="node scripts/eval/static_plan_eval.js"
RETRIES=3
SEEDS=3
TARGET=${1:-all}
TASK_DELAY=3000   # 3s extra delay between tasks (rate limit buffer)

mkdir -p scripts/eval/results

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

run_model() {
    local profile=$1
    local label=$2

    log "════════ 开始 $label (seeds=$SEEDS) ════════"

    log "[$label] no_retrieval 开始"
    $EVAL --mode no_retrieval --profile "$profile" --seeds $SEEDS --retries $RETRIES --task-delay $TASK_DELAY 2>&1 | tee -a "$LOG"
    log "[$label] no_retrieval 完成"

    # 冷却 30s 避免触发 rate limit
    log "冷却 30s..."
    sleep 30

    log "[$label] saer_full 开始"
    $EVAL --mode saer_full --profile "$profile" --seeds $SEEDS --retries $RETRIES --task-delay $TASK_DELAY 2>&1 | tee -a "$LOG"
    log "[$label] saer_full 完成"

    log "════════ $label 全部完成 ════════"

    # 两个模型之间多冷却 60s
    sleep 60
}

log "=== Gemini 实验启动，目标: $TARGET ==="
log "代理: $HTTPS_PROXY"

case $TARGET in
    26b) run_model "gemma4_26b_gemini" "Gemma4-26B (Gemini API)" ;;
    31b) run_model "gemma4_31b_gemini" "Gemma4-31B (Gemini API)" ;;
    all)
        run_model "gemma4_26b_gemini" "Gemma4-26B (Gemini API)"
        run_model "gemma4_31b_gemini" "Gemma4-31B (Gemini API)"
        ;;
    *) echo "用法: $0 [26b|31b|all]"; exit 1 ;;
esac

log "=== 全部 Gemini 实验完成 ==="
