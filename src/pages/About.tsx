import { P } from '@/components/learning';
import { Callout, Button } from '@/components/ui';
import { useApp } from '@/store';
import { TRUE_LOG_LOS } from '@/data/cohort';

export default function About() {
  const resetAll = useApp((s) => s.resetAll);
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">About & methods</h1>
      <h2 className="mt-6 mb-2 text-lg font-semibold">Data</h2>
      <P>
        All datasets are synthetic, generated in the browser from fixed seeds. The core cohort has 560 patients (≈600 admissions) at three sites.
        Covariates are generated with realistic dependencies (age → BMI → diabetes → hypertension → blood pressure; age, sex, diabetes → creatinine →
        hemoglobin). eGFR uses the race-free CKD-EPI 2021 creatinine equation. Length of stay follows a log-linear model with known coefficients
        (e.g., diabetes: {TRUE_LOG_LOS.diabetes} on the log scale, residual SD {TRUE_LOG_LOS.sigma}); 30-day readmission follows a known logistic model.
        The messy extract adds 12 documented classes of data problems to that cohort.
      </P>
      <h2 className="mt-6 mb-2 text-lg font-semibold">Computation</h2>
      <P>
        Statistics are computed by a TypeScript engine in the app: OLS with hat values, internally and externally studentized residuals, Cook&apos;s distance,
        DFBETAS, DFFITS, HC0/HC1/HC3 sandwich covariance and the studentized Breusch–Pagan test; VIF, GVIF and Belsley condition indices; logistic regression by
        IRLS (with optional ridge or Firth penalty); LOWESS; bootstrap percentile and BCa intervals; Bayesian-normal and predictive-mean-matching imputation,
        chained equations and Rubin&apos;s rules with Barnard–Rubin degrees of freedom; and the Riley et al. sample-size criteria. Unit tests compare results with
        statsmodels and SciPy to at least 8 significant digits and check influence measures against brute-force leave-one-out refits.
      </P>
      <P>
        Simulations report Monte Carlo standard errors where relevant. Run sizes are kept small enough to finish in about a second on a phone, so estimates
        carry visible simulation noise. Re-run with another seed to see it.
      </P>
      <h2 className="mt-6 mb-2 text-lg font-semibold">Scope</h2>
      <P>
        QuantLab teaches methods; it is not analysis software for real patient data, and the models are illustrations, not clinical tools. Use R, Stata, SAS or Python for
        your own analyses; each lesson gives current code idioms.
      </P>
      <Callout kind="info" title="Your data in this app">
        Progress and answers are stored only in this browser (localStorage). Nothing is sent anywhere. The app works offline once loaded.
      </Callout>
      <Button variant="outline" className="mt-4" onClick={() => { if (confirm('Reset all progress and answers?')) resetAll(); }}>
        Reset all progress
      </Button>
    </div>
  );
}
