"""
Plancraft Oracle Batch Checker

接收 stdin 的 JSON 批量查询，一次性加载 RECIPES，对所有查询给出判定。
被 plancraft_crossval.mjs 调用。

Input (stdin): JSON array of {"target": str, "inventory": {str: int}}
Output (stdout): JSON array of "solvable" | "unsolvable" | "unknown"
"""

import json, sys
from collections import Counter
from plancraft.environment.planner import RECIPES

queries = json.load(sys.stdin)
results = []

for q in queries:
    target = q["target"]
    inv    = Counter(q["inventory"])
    if target not in RECIPES:
        results.append("unknown")
        continue
    ok = any(recipe.can_craft_from_inventory(inv) for recipe in RECIPES[target])
    results.append("solvable" if ok else "unsolvable")

print(json.dumps(results))
