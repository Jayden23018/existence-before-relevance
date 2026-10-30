#!/usr/bin/env python3
"""
Audits Human-Observe live session logs (logs/session_*.log) to answer:
among SUCCESSFUL task trials, how often did PlanValidator's gap-repair fire,
and what kinds of gaps did it fire for.

Usage:
    python3 scripts/eval/analyze_gap_repair_success.py [glob ...]

Default glob: logs/session_202607{02,03}_*_no_ret.log
"""
import re
import sys
import glob
from collections import Counter
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
LOG_DIR = REPO_ROOT / "logs"

TASK_MARKER = re.compile(r'^Max received message from \w+ : (.+)$', re.MULTILINE)
RESULT_MARKER = re.compile(
    r'(✅|❌) Task "([^"]*)" (completed\.|failed\.|did not reach a terminal state\.|ended with unexpected status: [^\n]*\.)'
)
GAP_BLOCK = re.compile(
    r'⚠️ Plan validation found (\d+) gap\(s\):\n((?:  - Step \d+ "[^"]*" missing: .+\n)*)'
)
GAP_LINE = re.compile(r'  - Step \d+ "[^"]*" missing: (.+)')
REMAIN_AFTER_REPAIR = re.compile(r'⚠️ (\d+) gap\(s\) remain after repair')
CLEAN_PASS = re.compile(r'✅ Plan validation passed')


def default_files():
    files = sorted(LOG_DIR.glob("session_20260702_*_no_ret.log")) + \
            sorted(LOG_DIR.glob("session_20260703_*_no_ret.log"))
    return [str(f) for f in files]


def split_into_trials(text):
    """Split one log file into per-request segments using the chat-message marker."""
    markers = list(TASK_MARKER.finditer(text))
    trials = []
    for i, m in enumerate(markers):
        start = m.start()
        end = markers[i + 1].start() if i + 1 < len(markers) else len(text)
        request_text = m.group(1).strip()
        segment = text[start:end]
        trials.append((request_text, segment))
    return trials


def parse_segment(request_text, segment):
    results = RESULT_MARKER.findall(segment)
    if not results:
        return None  # not a real task trial (e.g. "Gave X to Max" system message)

    icon, task_name, outcome = results[-1]
    success = icon == '✅' and outcome == 'completed.'

    gap_events = []
    for gcount, gbody in GAP_BLOCK.findall(segment):
        missing = GAP_LINE.findall(gbody)
        gap_events.append({"declared_count": int(gcount), "missing": missing})

    remain_counts = [int(x) for x in REMAIN_AFTER_REPAIR.findall(segment)]
    clean_passes = len(CLEAN_PASS.findall(segment))

    return {
        "request": request_text,
        "task_name": task_name,
        "success": success,
        "outcome": outcome,
        "gap_events": gap_events,
        "remain_after_repair": remain_counts,
        "clean_passes": clean_passes,
    }


def classify_missing(display):
    # e.g. "item:crafting_table:1" -> ("item", "crafting_table")
    #      "station:crafting_table" -> ("station", "crafting_table")
    parts = display.split(":")
    kind = parts[0] if parts else "unknown"
    name = parts[1] if len(parts) > 1 else display
    return kind, name


def main():
    patterns = sys.argv[1:] if len(sys.argv) > 1 else None
    files = []
    if patterns:
        for p in patterns:
            files.extend(sorted(glob.glob(p)))
    else:
        files = default_files()

    if not files:
        print("No log files matched.")
        return

    all_trials = []
    for f in files:
        text = Path(f).read_text(errors="replace")
        for request_text, segment in split_into_trials(text):
            parsed = parse_segment(request_text, segment)
            if parsed is None:
                continue
            parsed["source_file"] = Path(f).name
            all_trials.append(parsed)

    total = len(all_trials)
    successes = [t for t in all_trials if t["success"]]
    failures = [t for t in all_trials if not t["success"]]

    print(f"=== Trial inventory ({len(files)} files) ===")
    print(f"Total task trials parsed: {total}")
    print(f"  Success: {len(successes)}")
    print(f"  Failure: {len(failures)} (excluded from analysis per instructions)\n")

    # --- Successful trials, one line each ---
    print("=== Successful trials ===")
    for t in successes:
        n_gap_events = len(t["gap_events"])
        n_clean = t["clean_passes"]
        trigger_note = f"{n_gap_events} gap-trigger(s)" if n_gap_events else "0 gap-triggers (clean)"
        print(f"[{t['source_file']}] \"{t['request']}\" -> task=\"{t['task_name']}\" | {trigger_note}")
        for i, ev in enumerate(t["gap_events"], 1):
            remain = t["remain_after_repair"][i - 1] if i - 1 < len(t["remain_after_repair"]) else 0
            repair_state = f"{remain} unresolved after repair" if remain else "fully repaired"
            missing_str = "; ".join(ev["missing"])
            print(f"    gap#{i}: declared={ev['declared_count']} ({repair_state}) missing=[{missing_str}]")

    # --- Aggregate stats ---
    n_success = len(successes)
    n_success_with_gap = sum(1 for t in successes if t["gap_events"])
    n_success_clean = n_success - n_success_with_gap
    total_gap_triggers = sum(len(t["gap_events"]) for t in successes)

    print("\n=== Aggregate (successful trials only) ===")
    print(f"Successful trials: {n_success}")
    print(f"  With >=1 gap-repair trigger: {n_success_with_gap} ({100*n_success_with_gap/n_success:.1f}%)" if n_success else "  N/A")
    print(f"  Clean (0 triggers): {n_success_clean} ({100*n_success_clean/n_success:.1f}%)" if n_success else "  N/A")
    print(f"  Total gap-trigger events across all successful trials: {total_gap_triggers}")
    print(f"  Avg triggers per successful trial: {total_gap_triggers/n_success:.2f}" if n_success else "  N/A")

    unresolved_events = sum(1 for t in successes for r in t["remain_after_repair"] if r > 0)
    print(f"  Gap-trigger events where repair left >=1 gap unresolved yet task still succeeded: {unresolved_events}")

    # --- Classify missing-item reasons ---
    kind_counter = Counter()
    name_counter = Counter()
    for t in successes:
        for ev in t["gap_events"]:
            for m in ev["missing"]:
                kind, name = classify_missing(m)
                kind_counter[kind] += 1
                name_counter[f"{kind}:{name}"] += 1

    print("\n=== Gap reason classification (by type) ===")
    for kind, count in kind_counter.most_common():
        print(f"  {kind}: {count}")

    print("\n=== Gap reason classification (by specific item/station) ===")
    for name, count in name_counter.most_common():
        print(f"  {name}: {count}")

    # --- Per task-name breakdown ---
    print("\n=== Per task-name breakdown (successful trials) ===")
    by_task = {}
    for t in successes:
        by_task.setdefault(t["task_name"], []).append(t)
    for name, trials in sorted(by_task.items()):
        n = len(trials)
        n_trig = sum(1 for t in trials if t["gap_events"])
        print(f"  {name}: {n} success trial(s), {n_trig} had gap-repair trigger")


if __name__ == "__main__":
    main()
