"""
Generate reference values for QuantLab's statistics engine with statsmodels/SciPy.

Run:  python -m pip install numpy scipy statsmodels
      python scripts/make_reference_fixtures.py
Writes src/lib/stats/__tests__/reference.json. The unit tests compare the
TypeScript implementations against these values.
"""
import json
import pathlib

import numpy as np
import scipy.stats as st
import statsmodels.api as sm
from statsmodels.stats.diagnostic import het_breuschpagan
from statsmodels.stats.outliers_influence import OLSInfluence, variance_inflation_factor
from statsmodels.nonparametric.smoothers_lowess import lowess

rng = np.random.default_rng(20251120)
n = 60
x1 = rng.normal(50, 10, n)
x2 = 0.6 * x1 + rng.normal(0, 8, n)
x3 = rng.binomial(1, 0.4, n).astype(float)
y = 3 + 0.4 * x1 - 0.2 * x2 + 2.5 * x3 + rng.normal(0, 3 + 0.05 * x1, n)
y[7] += 25  # an outlier
x1[12] = 95  # a high-leverage point
X = np.column_stack([np.ones(n), x1, x2, x3])

ols = sm.OLS(y, X).fit()
infl = OLSInfluence(ols)
hc3 = ols.get_robustcov_results(cov_type="HC3")
bp = het_breuschpagan(ols.resid, X)  # Koenker (studentized) by default

vifs = [variance_inflation_factor(X, j) for j in range(1, 4)]

# Logistic regression
z = -1 + 0.05 * (x1 - 50) + 0.8 * x3
pr = 1 / (1 + np.exp(-z))
yb = rng.binomial(1, pr).astype(float)
logit = sm.Logit(yb, X).fit(disp=0)

# LOWESS
lw = lowess(y, x1, frac=2 / 3, it=3, delta=0.0, return_sorted=True)

out = {
    "data": {"x1": x1.tolist(), "x2": x2.tolist(), "x3": x3.tolist(), "y": y.tolist(), "yb": yb.tolist()},
    "ols": {
        "coef": ols.params.tolist(),
        "se": ols.bse.tolist(),
        "p": ols.pvalues.tolist(),
        "r2": ols.rsquared,
        "adjR2": ols.rsquared_adj,
        "f": ols.fvalue,
        "fP": ols.f_pvalue,
        "sigma": float(np.sqrt(ols.scale)),
        "ciLow": ols.conf_int()[:, 0].tolist(),
        "ciHigh": ols.conf_int()[:, 1].tolist(),
        "hat": infl.hat_matrix_diag.tolist(),
        "stdResid": infl.resid_studentized_internal.tolist(),
        "studResid": infl.resid_studentized_external.tolist(),
        "cooks": infl.cooks_distance[0].tolist(),
        "dfbetas": infl.dfbetas.tolist(),
        "dffits": infl.dffits[0].tolist(),
        "hc3se": hc3.bse.tolist(),
        "bp": {"stat": bp[0], "p": bp[1]},
    },
    "vif": vifs,
    "logit": {"coef": logit.params.tolist(), "se": logit.bse.tolist(), "deviance": float(-2 * logit.llf), "nullDeviance": float(-2 * logit.llnull)},
    "lowess": {"x": lw[:, 0].tolist(), "y": lw[:, 1].tolist()},
    "dist": {
        "normCdf": [[z0, st.norm.cdf(z0)] for z0 in [-8, -3.2, -1.96, -0.5, 0, 0.3, 1.644853627, 2.5, 6]],
        "normPpf": [[p0, st.norm.ppf(p0)] for p0 in [1e-10, 0.001, 0.025, 0.2, 0.5, 0.8, 0.975, 0.999999]],
        "tCdf": [[t0, df, st.t.cdf(t0, df)] for t0, df in [(-3, 2), (-1.2, 5), (0.7, 10), (2.1, 30), (4, 200), (1.5, 1)]],
        "tPpf": [[p0, df, st.t.ppf(p0, df)] for p0, df in [(0.975, 1), (0.975, 3), (0.975, 10), (0.995, 25), (0.025, 60), (0.9, 7.5)]],
        "chi2Sf": [[x0, df, st.chi2.sf(x0, df)] for x0, df in [(0.5, 1), (3.84, 1), (10, 4), (25, 12), (100, 80)]],
        "fSf": [[f0, d1, d2, st.f.sf(f0, d1, d2)] for f0, d1, d2 in [(1, 2, 10), (3.5, 4, 55), (0.2, 3, 3), (8, 1, 100)]],
        "fPpf": [[p0, d1, d2, st.f.ppf(p0, d1, d2)] for p0, d1, d2 in [(0.5, 2, 48), (0.5, 4, 56), (0.95, 3, 20)]],
    },
}

path = pathlib.Path(__file__).resolve().parents[1] / "src/lib/stats/__tests__/reference.json"
path.write_text(json.dumps(out, indent=1))
print("wrote", path)
