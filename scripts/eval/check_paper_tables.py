#!/usr/bin/env python3
"""Internal-consistency check for the paper's two main tables.

Parses tab:main out of docs/paper/MCAI_revised.tex and the per-model McNemar
panel out of docs/paper/MCAI_revised_supplementary.tex (tab:mcnemar_appendix
-- the per-model table was moved to the supplement on 2026-07-27 for the
companion manuscript's page budget), and asserts the relations that must hold no matter
which run produced the numbers:

  Gap        == PVR - TCR
  L1+L2+L3   == TCR
  TCR_saer   == TCR_no_ret + b - c          (McNemar identity)
  Delta_pp   == round(100*TCR_saer/60) - round(100*TCR_no_ret/60)
               (the paper's convention: difference of the two rounded
                percentages, not the rounded difference)
  printed %  == round(100*count/60)

This is a *self*-consistency check, not a provenance check -- for
provenance run `node scripts/eval/mcnemar_table.mjs --rescore` and compare
its per-run lines against tab:main.

Usage: python3 scripts/eval/check_paper_tables.py [main.tex] [supplement.tex]
"""
import re
import sys

TEX = sys.argv[1] if len(sys.argv) > 1 else 'docs/paper/MCAI_revised.tex'
SUPP = (sys.argv[2] if len(sys.argv) > 2
        else 'docs/paper/MCAI_revised_supplementary.tex')
N = 60

# Qwen3-8B  & saer\_cold & 26/60~(43\%) & 48/60~(80\%) & +22 & 12/20 & 11/20 & 3/20
ROW = re.compile(
    r'^([A-Za-z0-9.\-~ ]+?)(?:\$\^[^$]*\$)?\s*&\s*'
    r'(no\\_ret|saer\\_cold|saer\\_full)(?:\$\^[^$]*\$)?\s*&\s*'
    r'(?:\\textbf\{)?(\d+)/60~\((\d+)\\%\)\}?\s*&\s*'
    r'(?:\\textbf\{)?(\d+)/60~\((\d+)\\%\)\}?\s*&\s*'
    r'\+(\d+)\s*&\s*'
    r'(\d+)/20\s*&\s*(\d+)/20\s*&\s*(\d+)/20')
DELTA = re.compile(r'\\textbf\{\+(\d+)pp\}|(?<!\\textbf\{)\+(\d+)pp\s*\(\$p')
# \quad Qwen3-8B  & 15 & 3 & 18 & 0.0075~$\star$ \\
MCROW = re.compile(r'^(?:\\quad\s+)?([A-Za-z0-9.\-~ ]+?)\s*&\s*'
                   r'(\d+)\s*&\s*(\d+)\s*&')


def norm(name):
    return re.sub(r'[~\\ ]+', '', name).strip().lower()


def main():
    src = open(TEX).read()
    main_tbl = src[src.index('\\label{tab:main}'):]
    main_tbl = main_tbl[:main_tbl.index('\\end{tabular}')]

    # per-model panel = first block of tab:mcnemar_appendix, up to its \midrule
    supp = open(SUPP).read()
    mc_tbl = supp[supp.index('\\label{tab:mcnemar_appendix}'):]
    mc_tbl = mc_tbl[mc_tbl.index('\\textit{Per-model'):]
    mc_tbl = mc_tbl[:mc_tbl.index('\\midrule')]

    fails, checks = [], 0
    rows = {}          # (model, cond) -> dict
    deltas = {}        # model -> pp   (from the SAER row)

    for raw in main_tbl.split(r'\\'):
        line = ' '.join(raw.split())
        # drop leading rules / spanning cells so the model name starts the row
        line = re.sub(r'^(\\[a-zA-Z]+(\{[^{}]*\})*\s*)+', '', line)
        m = ROW.match(line)
        if not m:
            continue
        (model, cond, tcr, tcr_pct, pvr, pvr_pct, gap, l1, l2, l3) = m.groups()
        tcr, tcr_pct, pvr, pvr_pct, gap, l1, l2, l3 = map(
            int, (tcr, tcr_pct, pvr, pvr_pct, gap, l1, l2, l3))
        key = (norm(model), cond)
        rows[key] = dict(tcr=tcr, pvr=pvr, gap=gap, lvl=(l1, l2, l3))
        checks += 4
        if gap != pvr - tcr:
            fails.append(f'{key}: Gap {gap} != PVR-TCR {pvr - tcr}')
        if l1 + l2 + l3 != tcr:
            fails.append(f'{key}: L1+L2+L3 {l1+l2+l3} != TCR {tcr}')
        if tcr_pct != round(100 * tcr / N):
            fails.append(f'{key}: TCR% {tcr_pct} != {round(100*tcr/N)}')
        if pvr_pct != round(100 * pvr / N):
            fails.append(f'{key}: PVR% {pvr_pct} != {round(100*pvr/N)}')
        if cond != 'no\\_ret':
            d = DELTA.search(line)
            if d:
                deltas[norm(model)] = int(d.group(1) or d.group(2))

    for model, pp in deltas.items():
        saer = rows.get((model, 'saer\\_cold')) or rows.get((model, 'saer\\_full'))
        base = rows.get((model, 'no\\_ret'))
        if not (saer and base):
            fails.append(f'{model}: missing paired row')
            continue
        checks += 1
        want = round(100 * saer['tcr'] / N) - round(100 * base['tcr'] / N)
        if pp != want:
            fails.append(f'{model}: Delta {pp}pp != {want}pp')

    for line in mc_tbl.split('\n'):
        m = MCROW.match(line.strip())
        if not m or 'midrule' in line:
            continue
        model, b, c = norm(m.group(1)), int(m.group(2)), int(m.group(3))
        saer, base = rows.get((model, 'saer\\_cold')), rows.get((model, 'no\\_ret'))
        if not (saer and base):
            fails.append(f'mcnemar row {model!r}: no matching tab:main rows')
            continue
        checks += 1
        if saer['tcr'] != base['tcr'] + b - c:
            fails.append(f'{model}: {base["tcr"]}+{b}-{c} = '
                         f'{base["tcr"]+b-c} != saer {saer["tcr"]}')

    print(f'{len(rows)} table rows, {len(deltas)} deltas, {checks} assertions')
    for f in fails:
        print('  FAIL', f)
    print('ALL CONSISTENT' if not fails else f'{len(fails)} INCONSISTENCIES')
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main())
