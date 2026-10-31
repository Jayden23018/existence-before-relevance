#!/usr/bin/env python3
"""Assert the Gemma4 replication panel in MCAI_neurips_ws.tex matches the scorer.

The appendices are a separate document, so both tex files are read.  The panel's two saer_cold rows were added by hand from the output of
`node scripts/eval/mcnemar_table.mjs --rescore`.  Hand-copied table cells are
exactly the thing that silently drifts, and LaTeX will happily compile a wrong
number, so this re-derives every cell from the script and fails if the paper
disagrees.

Run from the repo root:
    python3 docs/paper/neurips_ws/check_replication_panel.py
"""
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
TEX = REPO / "docs/paper/neurips_ws/MCAI_neurips_ws.tex"
APPENDIX_TEX = REPO / "docs/paper/neurips_ws/MCAI_neurips_ws_appendix.tex"
LABEL = {"gemma4-26b": "Gemma4-26B", "gemma4-31b": "Gemma4-31B"}
# Table 1 carries the two comparable arms only; the warm-start saer_full arm
# moved to Appendix G, where it is guarded by its p-values further down.
TEX_COND = {
    "no_ret": r"no\\_ret",
    "saer_cold": r"saer\\_cold",
}


def scorer_output() -> str:
    r = subprocess.run(
        ["node", "scripts/eval/mcnemar_table.mjs", "--rescore"],
        cwd=REPO, capture_output=True, text=True,
    )
    if r.returncode != 0:
        sys.exit(f"mcnemar_table.mjs failed:\n{r.stdout}\n{r.stderr}")
    return r.stdout


def main() -> int:
    out = scorer_output()
    tex = TEX.read_text() + APPENDIX_TEX.read_text()
    fails = []

    runs = {
        (m[1], m[2]): dict(tcr=int(m[3]), pvr=int(m[4]), gap=int(m[5]),
                           L1=int(m[6]), L2=int(m[7]), L3=int(m[8]))
        for m in re.finditer(
            r"(gemma4-\d+b)/(\S+)\s+TCR\s+(\d+)/60\s+PVR\s+(\d+)/60\s+"
            r"Gap \+(\d+)\s+L1=(\d+) L2=(\d+) L3=(\d+)", out)
    }
    pairs = {
        (m[1], m[2]): dict(nr=int(m[3]), tcr=int(m[4]), b=int(m[5]), c=int(m[6]),
                           p=float(m[7]))
        for m in re.finditer(
            r"replication: (gemma4-\d+b) (saer_\w+) vs no_ret\s+"
            r"(\d+)/60 -> (\d+)/60\s+b=(\d+) c=(\d+)\s+p=([\d.]+)", out)
    }
    if not runs or not pairs:
        sys.exit("could not parse mcnemar_table.mjs output -- did its format change?")

    for (model, cond), r in runs.items():
        if cond not in TEX_COND:
            continue
        # Internal arithmetic the paper's own caption promises.
        if r["L1"] + r["L2"] + r["L3"] != r["tcr"]:
            fails.append(f"{model}/{cond}: L1+L2+L3 != TCR")
        if r["pvr"] - r["tcr"] != r["gap"]:
            fails.append(f"{model}/{cond}: Gap != PVR-TCR")
        # Table 1 columns: credit SPR (x%) | debited SPR (y%) | PVR | Gap | L1 | L2 | L3.
        # The debited cell is guarded by check_appendix_tables.py.
        row = (rf'{LABEL[model]}[^&\n]*&\s*{TEX_COND[cond]}\s*'
               rf'&\s*{r["tcr"]} \({round(100 * r["tcr"] / 60)}\\%\)\s*&\s*\d+ \(\d+\\%\)\s*'
               rf'&\s*{r["pvr"]}\s*&\s*\+{r["gap"]}\s*&\s*{r["L1"]}\s*&\s*{r["L2"]}\s*&\s*{r["L3"]}\s*&')
        if not re.search(row, tex):
            fails.append(f"Table 1 has no row matching computed {model}/{cond}: {r}")

    for (model, cond), p in pairs.items():
        # Appendix O states the scorer asserts this; assert it here too.
        if p["nr"] + p["b"] - p["c"] != p["tcr"]:
            fails.append(f"{model}/{cond}: TCR_no_ret + b - c != TCR_saer")

    for model, cond in (("gemma4-26b", "saer_cold"), ("gemma4-31b", "saer_cold")):
        p = pairs[(model, cond)]
        # Must be anchored to the model name: b=7,c=0 also occurs in the
        # unrelated SAER-vs-BM25 sentence of 5.3, and an unanchored search
        # passes on that coincidence even when Appendix G is wrong.
        anchored = (rf'\$b{{=}}{p["b"]}\$, \$c{{=}}{p["c"]}\$, '
                    rf'\$p{{=}}[^$]+\$\)\s*for\s*{LABEL[model]}')
        if not re.search(anchored, tex):
            fails.append(f"Appendix G does not quote b={p['b']}, c={p['c']} for {LABEL[model]}")

    # The warm-start arm is no longer a Table 2 row, so its numbers are only as
    # safe as Appendix G's sentence.  Guard that sentence explicitly, or moving a
    # row out of a table becomes a way to drop it from every check.
    warm = re.search(r"warm-start.*?\$p\{=\}([\d.]+)\$ and "
                     r"\$b\{=\}\d+\$, \$c\{=\}\d+\$, \$p\{=\}([\d.]+)\$",
                     tex, re.S)
    if not warm:
        fails.append("Appendix G no longer states the warm-start (saer_full) p-values")
    else:
        for quoted, model in zip(warm.groups(), ("gemma4-26b", "gemma4-31b")):
            # Compare at the precision the paper quotes (0.0625 and 0.219).
            places = len(quoted.split(".")[1])
            computed = f"{pairs[(model, 'saer_full')]['p']:.{places}f}"
            if quoted != computed:
                fails.append(f"Appendix G quotes warm-start p={quoted} for {model}, "
                             f"scorer says {computed}")

    # Retracted in favour of "primary-study minimum": 41/60 is the min over the
    # five primary models, not a capacity-predicted floor (a 4B-active model
    # ceilings above it).  Guard the wording so it cannot creep back.
    if "frontier floor" in tex:
        fails.append('retracted phrase "frontier floor" is present again')

    for f in fails:
        print(f"FAIL  {f}")
    if fails:
        return 1
    print(f"ALL CONSISTENT ({len(runs)} panel runs, {len(pairs)} paired comparisons)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
