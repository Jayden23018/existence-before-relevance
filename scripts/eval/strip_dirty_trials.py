#!/usr/bin/env python3
"""
strip_dirty_trials.py — 从 live_eval_results.jsonl 删除指定任务的所有记录。
用于重跑脏数据任务前清空其旧条目，避免 driver 计数到旧失败条目而跳过重跑。

Usage:
  python3 scripts/eval/strip_dirty_trials.py --tasks "craft/wooden_sword,craft/ladder"
  python3 scripts/eval/strip_dirty_trials.py --tasks "craft/iron_bars" --dry-run
"""
import json, argparse, shutil, os
from datetime import datetime

parser = argparse.ArgumentParser()
parser.add_argument('--tasks', required=True, help='逗号分隔的task slug列表')
parser.add_argument('--dry-run', action='store_true', help='只打印不实际删除')
args = parser.parse_args()

TARGET_TASKS = set(t.strip() for t in args.tasks.split(','))
JSONL = 'scripts/eval/results/live_eval_results.jsonl'

kept, removed = [], []
with open(JSONL) as f:
    for line in f:
        if not line.strip(): continue
        r = json.loads(line)
        if r['task'] in TARGET_TASKS:
            removed.append(r)
        else:
            kept.append(r)

print(f"Tasks to strip: {sorted(TARGET_TASKS)}")
print(f"Removing: {len(removed)} records | Keeping: {len(kept)} records")
for t in sorted(TARGET_TASKS):
    n = sum(1 for r in removed if r['task']==t)
    print(f"  {t}: {n} records removed")

if args.dry_run:
    print("\n[DRY RUN] No changes written.")
else:
    backup = JSONL + f'.bak.strip_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    shutil.copy(JSONL, backup)
    print(f"\nBackup: {backup}")
    with open(JSONL, 'w') as f:
        for r in kept:
            f.write(json.dumps(r) + '\n')
    print(f"Done. {len(removed)} records removed from {JSONL}")
