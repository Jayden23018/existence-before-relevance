#!/usr/bin/env python3
"""Re-derive the hand-copied appendix tables from their scripts and diff the tex.

Covers the tables whose cells were transcribed by hand:
  tab:fpr             <- plancraft_crossval{,_stratified}.mjs   (per-condition FPR)
  tab:strata          <- mcnemar_table.mjs --rescore --strata   (CRAFT / non-CRAFT)
  tab:nocombat        <- mcnemar_table.mjs --rescore --strata   (55-task denominator)
  tab:failmodes       <- failure_mode_counts.mjs                (unattributed column)
  tab:debit_permodel  <- measure_consumption_leniency.mjs --mcnemar [--replication]
  tab:main, tab:ablation debited columns <- the same two runs

LaTeX compiles a wrong number as happily as a right one, so every cell that a
human typed needs a machine that can disagree with them.

Run from the repo root:
    python3 docs/paper/neurips_ws/check_appendix_tables.py
"""
import os
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
TEX = REPO / "docs/paper/neurips_ws/MCAI_neurips_ws.tex"
APPENDIX_TEX = REPO / "docs/paper/neurips_ws/MCAI_neurips_ws_appendix.tex"

# Paper label -> run-id stem used by the scripts.
MODELS = {
    "qwen3-8b": "Qwen3-8B",
    "gpt-4o": "GPT-4o",
    "claude": r"Claude S.\ 4.5",
    "qwen-max": "Qwen2.5-Max",
    "deepseek": "DeepSeek-V3",
}


# Table 1 spells Claude with a tie; the appendix tables use a thin space.
MAIN_LABELS = {**MODELS, "claude": "Claude S.~4.5",
               "gemma4-26b": r"Gemma4-26B$^{\ddagger}$", "gemma4-31b": "Gemma4-31B"}


def pct(n: int) -> int:
    # n/60 as a percentage never lands on .5, so round() cannot bank-round here.
    return round(100 * n / 60)


def p_matches(shown: str, p: float) -> bool:
    """True if the p-value as printed in the tex is p rounded to its shown digits."""
    if "<" in shown:
        return p < float(shown.replace("<", "").replace("{", "").replace("}", ""))
    decimals = len(shown.split(".")[1]) if "." in shown else 0
    return abs(float(shown) - p) <= 0.5 * 10 ** -decimals + 1e-12


def run(*argv: str) -> str:
    # NO_CHANGELOG stops plancraft_crossval*.mjs appending a line to docs/change_log.md
    # on every verification run (09-30: 18+ spurious lines before this guard).
    r = subprocess.run(argv, cwd=REPO, capture_output=True, text=True,
                       env={**os.environ, "NO_CHANGELOG": "1"})
    if r.returncode != 0:
        sys.exit(f"{' '.join(argv)} failed:\n{r.stdout}\n{r.stderr}")
    return r.stdout


def main() -> int:
    tex = TEX.read_text() + APPENDIX_TEX.read_text()
    fails: list[str] = []
    checked = 0

    def want(pattern: str, what: str) -> None:
        nonlocal checked
        checked += 1
        if not re.search(pattern, tex):
            fails.append(what)

    # ---- tab:fpr -----------------------------------------------------------
    strat = run("node", "scripts/eval/plancraft_crossval_stratified.mjs")
    rows = re.findall(
        r"^(no_retrieval|random_retrieval|bm25_retrieval|saer_cold)\s+"
        r"(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)\s+([\d.]+)$",
        strat, re.M)
    if len(rows) != 4:
        sys.exit("could not parse the stratified crossval table -- format changed?")
    tex_cond = {"no_retrieval": r"no\\_retrieval", "random_retrieval": "random",
                "bm25_retrieval": "bm25", "saer_cold": r"saer\\_cold"}
    for cond, total, agree, fp, fn, fpr, agr in rows:
        n = f"{int(total):,}" if int(total) >= 1000 else total
        want(rf"\\texttt{{{tex_cond[cond]}}}\s*&\s*{n}\s*&\s*{agr}\\%\s*&\s*{fp}\s*"
             rf"&\s*{fpr}\\%\s*&\s*{fn}\s*\\\\",
             f"tab:fpr row for {cond} ({n} checks, FPR {fpr}%, FP {fp}, FN {fn})")

    agg = run("node", "scripts/eval/plancraft_crossval.mjs")
    m = re.search(r"craftRecipe steps evaluated\s*:\s*(\d+)", agg)
    a = re.search(r"Agreement rate\s*:\s*([\d.]+)%\s*\((\d+)/(\d+)\)", agg)
    k = re.search(r"Cohen's .\s*:\s*([\d.]+)", agg)
    if not (m and a and k):
        sys.exit("could not parse the aggregate crossval output -- format changed?")
    total = f"{int(m[1]):,}"
    want(rf"{re.escape(total)} *\n?\\texttt{{craftRecipe}} invocations",
         f"§4.3 no longer states {total} craftRecipe invocations")
    want(rf"\\textbf{{{a[1]}\\%}} \({int(a[2]):,}/{int(a[3]):,}",
         f"Appendix A agreement {a[1]}% ({a[2]}/{a[3]})")

    # Every occurrence must agree, not just one: the agreement rate and kappa are
    # each quoted in more than one section, and a one-site edit that only half
    # the paper follows is exactly the drift this script exists to catch.
    # Each site must match at least once: a pattern that stops matching after a
    # rewrite (or a line re-wrap) would otherwise pass silently while counting.
    for site, computed in ((r"\\kappa\{=\}([\d.]+)", k[1][:5]),
                           (rf"agrees\s+on\s+([\d.]+)\\%\s+of\s+{re.escape(total)}\s+craft", a[1]),
                           (r"The\s+([\d.]+)\\%\s+should\s+accordingly", a[1])):
        found = re.findall(site, tex)
        checked += 1
        if not found:
            fails.append(f"no match for agreement/kappa site {site!r} -- sentence rewritten or number drifted")
        for got in found:
            if got != computed:
                fails.append(f"tex quotes {got} where the scorer says {computed}")

    # ---- tab:strata and tab:nocombat --------------------------------------
    sd = run("node", "scripts/eval/mcnemar_table.mjs", "--rescore", "--strata")

    for m_ in re.finditer(
            r"^  (\S+): (saer_cold vs no_ret|saer_cold vs bm25)\s+all b=(\d+) c=(\d+) "
            r"p=(\S+) \| CRAFT b=(\d+) c=(\d+) p=(\S+) \| non-CRAFT b=(\d+) c=(\d+) p=(\S+)$",
            sd, re.M):
        model = MODELS[m_[1]]
        want(rf"~~{re.escape(model)}\s*&\s*{m_[3]}/{m_[4]}\s*&[^&]*&\s*"
             rf"{m_[6]}/{m_[7]}\s*&[^&]*&\s*{m_[9]}/{m_[10]}\s*&",
             f"tab:strata row {m_[1]} {m_[2]}: {m_[3]}/{m_[4]} | "
             f"{m_[6]}/{m_[7]} | {m_[9]}/{m_[10]}")

    for m_ in re.finditer(
            r"^  (\S+): saer_cold vs no_ret\s+(\d+)/55 -> (\d+)/55\s+b=(\d+) c=(\d+)",
            sd, re.M):
        model = MODELS[m_[1]]
        want(rf"~~{re.escape(model)}\s*&\s*{m_[2]}\$\\to\${m_[3]}\s*&\s*{m_[4]}/{m_[5]}\s*&",
             f"tab:nocombat row {m_[1]}: {m_[2]}->{m_[3]} b={m_[4]} c={m_[5]}")

    # ---- tab:failmodes unattributed column --------------------------------
    fm = run("node", "scripts/eval/failure_mode_counts.mjs")
    body = [l.split() for l in fm.splitlines() if l.startswith(("Qwen", "GPT", "Claude", "DeepSeek"))]
    if len(body) != 10:
        sys.exit(f"expected 10 failure-mode rows, parsed {len(body)}")
    # columns: model.. cond TCR fail ing prec tool smelt naming nogoal unparsed
    #          prereq goal-only unattributed  (model label may hold spaces)
    for cells in body:
        nums = [c for c in cells if re.fullmatch(r"\d+|\d+/60", c)]
        fail, ing, prec, tool, smelt, naming, nogoal = nums[1:8]
        unattrib = nums[-1]
        want(rf"&\s*{fail}\s*&\s*{prec}\s*&\s*{ing}\s*&\s*{tool}\s*&\s*{smelt}\s*"
             rf"&\s*{naming}\s*&\s*{nogoal}\s*&\s*{unattrib}\s*\\\\",
             f"tab:failmodes row fail={fail} .. unattrib={unattrib}")

    # ---- tab:debit_permodel, and the debited columns of Tables 1 and 2 -----
    pair_re = re.compile(
        r"^(\S+)/(\S+) vs (\S+)/(\S+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(\S+)$", re.M)
    debited = []  # (model, armA, armB, A, B, b, c, p)
    for flags in ((), ("--replication",)):
        db = run("node", "scripts/eval/measure_consumption_leniency.mjs", "--mcnemar", *flags)
        rows_ = [(m_[1], m_[2], m_[4], int(m_[5]), int(m_[6]), int(m_[7]), int(m_[8]), float(m_[9]))
                 for m_ in pair_re.finditer(db)]
        if len(rows_) != (2 if flags else 9):
            sys.exit(f"expected {2 if flags else 9} debited pairs {flags}, parsed {len(rows_)}")
        debited += rows_
    for model, arm_a, arm_b, a_, b_, bb, cc, pv in debited:
        want(rf"{b_}\$\\to\${a_}\s*&\s*{bb}/{cc}\s*&",
             f"tab:debit_permodel row {model}/{arm_a} vs {arm_b}: {b_}->{a_} b={bb} c={cc}")

    # Table 1: each model's no_ret / saer_cold rows carry credit (x%) then debited (y%).
    for model, arm_a, arm_b, a_, b_, bb, cc, pv in debited:
        if (arm_a, arm_b) != ("saer_cold", "no_ret"):
            continue
        lab = re.escape(MAIN_LABELS[model])
        for cond, n in ((r"no\\_ret", b_), (r"saer\\_cold", a_)):
            want(rf"{lab}\s*&\s*{cond}\s*&\s*\d+ \(\d+\\%\)\s*&\s*{n} \({pct(n)}\\%\)\s*&",
                 f"Table 1 debited SPR for {model}/{cond}: {n} ({pct(n)}%)")
        delta = pct(a_) - pct(b_)
        sign = "+" if delta > 0 else ("$-$" if delta < 0 else "")
        # Anchored to the row's last cell, so group 1 is the DEBITED cell's bold only.
        m_ = re.search(rf"{lab}\s*&\s*saer\\_cold[^\n]*&\s*(\\textbf\{{)?"
                       rf"{re.escape(sign)}{abs(delta)}\}}? \(\$p\{{([=<])\}}([\d.]+)\$\)\s*\\\\", tex)
        checked += 1
        if not m_ or not p_matches(("<" if m_[2] == "<" else "") + m_[3], pv):
            fails.append(f"Table 1 debited delta for {model}: expected {sign}{abs(delta)} with p={pv:.3g}")
        elif (pv < 0.0038) != bool(m_[1]):
            fails.append(f"Table 1 debited bold marker for {model} disagrees with p={pv:.3g} vs 0.0038")

    # Table 2: debited SPR, delta and b/c (p) on the three arms and two pairwise rows.
    tab2 = tex[tex.index("\\label{tab:ablation}"):tex.index("\\end{tabular}", tex.index("\\label{tab:ablation}"))]
    arm_label = {"random": "random", "bm25": "BM25", "saer_cold": r"saer\\_cold"}
    for model, arm_a, arm_b, a_, b_, bb, cc, pv in debited:
        if model != "qwen-max":
            continue
        delta = pct(a_) - pct(b_)
        dtex = (r"\$\+\$" if delta > 0 else r"\$-\$") + str(abs(delta))
        if arm_b == "no_ret":
            pat = rf"^{arm_label[arm_a]}\s*&[^\n]*&\s*{a_}\s*&\s*{dtex}\s*&\s*{bb}/{cc} \(([^)]*)\)\s*\\\\"
        else:
            first = r"BM25 vs\.\\ random" if arm_a == "bm25" else r"SAER vs\.\\ BM25"
            pat = rf"^{first}[^\n]*&\s*{dtex}\s*&\s*{bb}/{cc} \(([^)]*)\)\s*\\\\"
        m_ = re.search(pat, tab2, re.M)
        checked += 1
        shown = m_[1].replace("$", "").replace("{", "").replace("}", "") if m_ else ""
        if not m_ or not p_matches(shown, pv):
            fails.append(f"Table 2 debited row {arm_a} vs {arm_b}: expected {a_}, delta {delta}, "
                         f"{bb}/{cc}, p={pv:.3g}")

    for f in fails:
        print(f"FAIL  {f}")
    if fails:
        print(f"\n{len(fails)}/{checked} assertions failed")
        return 1
    print(f"ALL CONSISTENT ({checked} assertions over 7 tables)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
