#!/usr/bin/env bash
# 人工观测 log 切分 + 关键报错高亮
# 用法: ./split_log.sh [raw_log] [out_dir]
#   [raw_log]  npm start/node main.js 2>&1 | tee 出来的原始文件
#              不传则自动用 human_obs/ 下最新的 raw_*.log
#   [out_dir]  切片输出目录, 默认同目录下 _split/
#
# 工作前提: 你在游戏内每测一个任务前, 在跑 npm start 的那个终端按回车后输入:
#     ============ TASK: cauldron ============
#     ============ TASK: iron_door ============
#     ============ TASK: iron_leggings ============
#   (大小写/空格随意, 只要包含 "TASK: <名字>" 即可)
#   这行会被 tee 一起写进 raw log, 本脚本据此切片。

set -euo pipefail

RAW="${1:-}"
if [[ -z "$RAW" ]]; then
    # 不传文件名 → 自动取 human_obs/ 下最新的 raw_*.log
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    # 找最新的 raw_*.log; 用 find+stat 按修改时间排序, 取最新一个。
    # 不能用 ls raw_*.log (bash 无匹配时保留字面量) 或 ls 无参 (列全目录)。
    RAW=$(find "$SCRIPT_DIR" -maxdepth 1 -name 'raw_*.log' -type f -exec stat -f '%m %N' {} \; 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2-)
    if [[ -z "$RAW" ]]; then
        echo "❌ 没找到任何 raw_*.log。你启动 bot 时必须用 tee:" >&2
        echo "   node main.js 2>&1 | tee scripts/eval/human_obs/raw_\$(date +%Y%m%d_%H%M).log" >&2
        exit 1
    fi
    echo "自动选用最新 raw log: $RAW"
fi
if [[ ! -f "$RAW" ]]; then
    echo "raw log 不存在: $RAW" >&2
    echo "(提示: 直接跑 ./split_log.sh 不带参数, 会自动找最新的 raw_*.log)" >&2
    exit 1
fi

OUT_DIR="${2:-$(dirname "$RAW")/_split}"
mkdir -p "$OUT_DIR"

# 1) 提取所有任务标记行 + 行号
MARK_FILE="$OUT_DIR/_marks.txt"
grep -n "TASK:" "$RAW" > "$MARK_FILE" || true
MARK_COUNT=$(wc -l < "$MARK_FILE" | tr -d ' ')

echo "=== 切分: $RAW ==="
echo "=== 找到 $MARK_COUNT 个任务标记 ==="
cat "$MARK_FILE"
echo ""

if [[ "$MARK_COUNT" -eq 0 ]]; then
    echo "⚠️  没找到任何 'TASK:' 标记。"
    echo "    你在游戏内下任务前, 必须在跑 npm start 的终端先打一行:"
    echo "      ============ TASK: cauldron ============"
    echo "  本脚本已把完整 raw log 复制到:"
    echo "    $OUT_DIR/full_raw.log"
    cp "$RAW" "$OUT_DIR/full_raw.log"
    exit 0
fi

# 2) 按标记切片: 每个标记到下一个标记(或文件尾)之间 = 一个任务的 log
#    macOS 自带 bsd awk 不支持 match() 捕获组, 用 sed 提取任务名 + awk 切片
#    先把每个 TASK: 行转成 ">TASKSTART name" 锚点
sed -E 's/.*TASK:[[:space:]]*([A-Za-z0-9_]+).*/__TASKSTART__ \1/' "$RAW" | \
awk -v out_dir="$OUT_DIR" '
{
    if ($0 ~ /^__TASKSTART__/) {
        task = $2
        if (outfile != "") close(outfile)
        outfile = out_dir "/" task ".log"
        next
    }
    if (outfile != "") {
        print $0 > outfile
    }
}
END { if (outfile != "") close(outfile) }
'

# 3) 把最后一段(最后一个标记到文件尾)单独留出来, 上面 awk 已处理
#    但若 raw log 尾部有未关闭任务, awk 已收入最后一个 .log, 无需额外动作

# 4) 每个 per-task 文件: 统计行数 + 高亮关键报错
echo "=== 各任务切片 + 关键报错 ==="
for f in "$OUT_DIR"/*.log; do
    [[ -f "$f" ]] || continue
    [[ "$(basename "$f")" == "full_raw.log" ]] && continue
    name=$(basename "$f" .log)
    lines=$(wc -l < "$f" | tr -d ' ')
    echo ""
    echo "--- $name ($lines 行) ---"
    # 高亮 4 类关键行 (用 grep -E, 找不到也返回 0)
    {
        echo "[关键报错/成功行]:"
        grep -nE "Insufficient resources|executed but item not found after sync|missing tool|Craft .* failed|Successfully crafted|Done crafting|Step [0-9]+|Craft 1x|Smelt 1x" "$f" 2>/dev/null || echo "  (未命中任何关键模式 — 可能 log 没接到这步)"
    } || true
done

echo ""
echo "=== 切片输出目录: $OUT_DIR ==="
ls -la "$OUT_DIR"
