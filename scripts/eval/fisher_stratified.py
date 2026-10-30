"""
Stratified FPR test — condition x {FP, non-FP} contingency table.
Reads JSON {"conditions": [...], "table": [[fp, nonfp], ...]} from stdin.
Runs a chi-square test on the full R x 2 table (Freeman-Halton exact via
scipy.stats.fisher_exact only supports 2x2, so for >2 conditions we use
chi2_contingency; for exactly 2 conditions we use exact Fisher).
Outputs JSON {test, statistic, p_value, dof, expected_min}.
"""
import json, sys
import numpy as np
from scipy.stats import chi2_contingency, fisher_exact

data = json.load(sys.stdin)
conditions = data["conditions"]
table = np.array(data["table"], dtype=float)

result = {"conditions": conditions, "table": data["table"]}

if len(conditions) == 2:
    # exact Fisher 2x2
    odds, p = fisher_exact(table)
    result["test"] = "fisher_exact_2x2"
    result["odds_ratio"] = odds
    result["p_value"] = p
else:
    chi2, p, dof, expected = chi2_contingency(table)
    result["test"] = "chi2_contingency"
    result["statistic"] = chi2
    result["p_value"] = p
    result["dof"] = dof
    result["expected_min"] = float(expected.min())
    # flag if chi-square assumptions are shaky (expected count < 5 anywhere)
    result["low_expected_warning"] = bool(expected.min() < 5)

print(json.dumps(result))
