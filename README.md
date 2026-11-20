# QuantLab

**Interactive, evidence-based training in the clinical research data pipeline**: auditing raw data, cleaning, missing data, regression diagnostics, collinearity, validation and reproducibility.

Live: https://quantlab-learn.vercel.app

Every number in QuantLab is computed in the browser from a synthetic cohort whose true data-generating model is known. Learners see the bias and confidence-interval coverage of each analytic choice directly, instead of reading claims about it.

## Curriculum

| # | Module | Labs |
|---|--------|------|
| 1 | Raw Data Foundations | Design-effect calculator · variable classification · **audit lab** on a 607-row messy EHR extract with 12 planted problem types · data-dictionary export |
| 2 | Cleaning & Preprocessing | Outlier rules (SD vs IQR vs MAD, masking) · transformations with Box–Cox and smearing · **dichotomization power/false-positive simulation** · design matrix and dummy-variable trap |
| 3 | Missing Data & Imputation | **Mechanism × method simulator** (8 methods, bias/coverage with Monte Carlo SE) · missingness map · Rubin's rules and number-of-imputations calculators · delta-adjusted tipping-point analysis |
| 4 | Regression Diagnostics | Separation and Firth · six-scenario residual-plot lab with a diagnosis challenge · **drag-a-point influence lab** (hat, studentized residuals, Cook's D, DFBETAS, Huber) · HC3 coverage simulation |
| 5 | Multicollinearity | Correlated-predictor simulator · VIF/GVIF/Belsley condition indices on the cohort · the centering myth · ridge bias–variance |
| 6 | Validation & Model Performance | Discrimination/calibration/decision-curve lab · overfitting simulator · **split vs CV vs bootstrap** against the truth · leakage demo · bootstrap CI coverage experiment · Riley sample-size calculator |
| 7 | Reproducibility & Reporting | Seed/RNG-version demo · project self-audit · **multiverse of 324 specifications** · methods-section critique against current guidelines |
| 8 | Capstone | Messy extract → cleaning → model → missing data → diagnostics → bootstrap validation → generated methods text, R script and reviewer report, with estimates compared to the truth |

Plus a 53-question assessment bank (practice and mock-exam modes, per-module mastery), a 69-term glossary and 83 references.

## Evidence and verification

- **Statistics engine** (`src/lib/stats`): OLS with hat values, internally/externally studentized residuals, Cook's distance, DFBETAS, DFFITS, HC0/HC1/HC3, studentized Breusch–Pagan; VIF, GVIF, condition indices with variance-decomposition proportions; logistic regression (IRLS, ridge, Firth); LOWESS; percentile and BCa bootstrap; Bayesian-normal, PMM and logistic imputation, chained equations, Rubin's rules with Barnard–Rubin df; Riley et al. sample-size criteria; seeded sfc32 RNG.
- **Tested against reference software**: `scripts/make_reference_fixtures.py` produces statsmodels/SciPy results; unit tests require agreement to ~1e-8 and check influence measures against brute-force leave-one-out refits. Sample-size results reproduce `pmsampsize`.
- **Simulation claims are tested**: e.g., complete-case regression is unbiased when missingness depends on a covariate but biased when it depends on the outcome; MI with the outcome recovers the truth; the recommended capstone choices recover the generating coefficients.
- **References**: `npm run verify:refs` checks every DOI against doi.org; titles were cross-checked against Crossref metadata.
- **Current standards**: TRIPOD+AI (2024), PROBAST+AI (2025), CONSORT 2025, SPIRIT 2025, TARGET (2025), TRIPOD-LLM (2025), CKD-EPI 2021 (race-free) eGFR, HC3 robust SEs, TARMOS missing-data reporting, modern R/Python idioms (renv, targets, Quarto, uv, `numpy.random.default_rng`, pandera).

## Development

Requires Node ≥ 20.19.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit + simulation tests (vitest)
npm run lint
npm run build        # type-check + production build (PWA, works offline)
npm run smoke        # every route at phone and desktop width; fails on console errors or overflow (needs Playwright)
npm run interact     # clicks every lab control, walks the capstone, takes the exam
npm run verify:refs  # DOI check
```

To regenerate the reference fixtures: `pip install numpy scipy statsmodels && python scripts/make_reference_fixtures.py`.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · React Router 7 · Zustand 5 · vite-plugin-pwa · Vitest. Charts are a small dependency-free SVG kit (`src/components/plot`) with a colour-vision-deficiency-validated palette in light and dark themes.

```
src/
├── lib/stats/        statistics engine + tests
├── data/             seeded synthetic cohort, messy extract, audit/cleaning rules
├── content/          curriculum, questions, glossary, references
├── modules/          one file per lesson; simulation engines next to their lessons
├── components/       UI kit, plot kit, learning components (citations, checks, labs)
└── pages/            home, module, lesson, assessment, glossary, references, about
```

Progress and answers are stored only in the browser's localStorage. All data are synthetic.
