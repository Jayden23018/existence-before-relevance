#!/bin/bash
# Gemma 4 实验调度脚本
# 用法: bash run_gemma4_all.sh 12b | 26b | 31b | all
# 12b 用 1 seed 摸底；26b/31b 用 3 seeds

LOG=/path/to/saer/scripts/eval/results/gemma4_all_run.log
EVAL="node scripts/eval/static_plan_eval.js"
RETRIES=3
TARGET=${1:-all}

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a $LOG; }

wait_model() {
    local model=$1
    log "等待 $model 下载完成..."
    while ! ollama list | grep -q "^${model}"; do
        sleep 30
    done
    log "✅ $model 已就绪"
}

run_model() {
    local profile=$1
    local label=$2
    local model=$3
    local seeds=$4

    wait_model "$model"
    log "════════ 开始 $label (seeds=$seeds) ════════"

    log "[$label] no_retrieval 开始"
    $EVAL --mode no_retrieval --profile $profile --seeds $seeds --retries $RETRIES >> $LOG 2>&1
    log "[$label] no_retrieval 完成"

    log "[$label] saer_full 开始"
    $EVAL --mode saer_full --profile $profile --seeds $seeds --retries $RETRIES >> $LOG 2>&1
    log "[$label] saer_full 完成"

    log "════════ $label 全部完成 ════════"
}

log "=== 启动目标: $TARGET ==="

case $TARGET in
    12b) run_model "gemma4_12b_eval" "Gemma4-12B-MLX" "gemma4:12b-mlx" 1 ;;
    26b) run_model "gemma4_e4b_eval" "Gemma4-26B-MLX" "gemma4:26b-mlx" 3 ;;
    31b) run_model "gemma4_31b_eval" "Gemma4-31B-MLX" "gemma4:31b-mlx" 3 ;;
    all)
        run_model "gemma4_12b_eval" "Gemma4-12B-MLX" "gemma4:12b-mlx" 1
        run_model "gemma4_e4b_eval" "Gemma4-26B-MLX" "gemma4:26b-mlx" 3
        run_model "gemma4_31b_eval" "Gemma4-31B-MLX" "gemma4:31b-mlx" 3
        ;;
    *) log "用法: $0 12b | 26b | 31b | all"; exit 1 ;;
esac

log "=== $TARGET 实验完成，关闭 Ollama ==="
pkill -x ollama && log "✅ Ollama 已关闭" || log "⚠️ Ollama 未找到"
