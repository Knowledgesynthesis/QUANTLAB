import { useMemo, useState } from 'react';
import { Rng, invertSPD, crossprod, crossprodVec, matVec, mean, sd } from '@/lib/stats';
import { Plot, Line, VRule, HRule } from '@/components/plot/Plot';
import { Callout, Code, DataTable, Legend, SliderField, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { fmt } from '@/lib/utils';

function ridge(X: number[][], y: number[], lambda: number) {
  const A = crossprod(X);
  for (let j = 0; j < A.length; j++) A[j][j] += lambda;
  return matVec(invertSPD(A), crossprodVec(X, y));
}

function makeData(rng: Rng, n: number) {
  const X = Array.from({ length: n }, () => {
    const a = rng.normal();
    return [a, 0.95 * a + Math.sqrt(1 - 0.95 ** 2) * rng.normal()];
  });
  const y = X.map(([a, b]) => 1 * a + 0.5 * b + rng.normal(0, 1.5));
  const my = mean(y);
  const mx = [0, 1].map((j) => mean(X.map((r) => r[j])));
  return { X: X.map((r) => r.map((v, j) => v - mx[j])), y: y.map((v) => v - my) };
}

export default function Remedies() {
  const [logLambda, setLogLambda] = useState(1);
  const lambda = 10 ** logLambda;
  const path = useMemo(() => {
    const { X, y } = makeData(new Rng('ridge-path'), 60);
    return Array.from({ length: 61 }, (_, k) => {
      const ll = -2 + k * 0.08;
      const b = ridge(X, y, 10 ** ll);
      return { ll, b1: b[0], b2: b[1] };
    });
  }, []);
  const sampling = useMemo(() => {
    const rng = new Rng('ridge-sampling');
    const ols: number[] = [], rdg: number[] = [];
    for (let r = 0; r < 300; r++) {
      const { X, y } = makeData(rng, 60);
      ols.push(ridge(X, y, 0)[0]);
      rdg.push(ridge(X, y, lambda)[0]);
    }
    const mse = (v: number[]) => mean(v.map((b) => (b - 1) ** 2));
    return { olsMean: mean(ols), olsSD: sd(ols), olsMSE: mse(ols), rMean: mean(rdg), rSD: sd(rdg), rMSE: mse(rdg) };
  }, [lambda]);

  return (
    <div>
      <P>The right response to collinearity depends on what the model is for.</P>
      <DataTable
        head={['Goal', 'Collinearity matters?', 'Reasonable responses', 'Avoid']}
        rows={[
          ['Causal effect of an exposure', 'Only as imprecision', 'Choose the adjustment set from causal reasoning (a DAG); keep confounders even if collinear; accept wide CIs or get more data', 'Dropping a confounder because its VIF is high: trades imprecision for bias'],
          ['Prediction', 'Rarely', 'Keep predictors; consider penalization (ridge, elastic net) at development; validate', 'Interpreting individual coefficients; LASSO picks among correlated predictors arbitrarily'],
          ['Describing associations', 'Yes, for individual coefficients', 'Pick one measure per construct (eGFR or creatinine); combine into a score; report joint tests', 'Claiming "independent effects" for collinear variables'],
          ['Interaction / polynomial terms', 'No', 'Centre for interpretability (lesson 3)', '"Fixing" VIFs that do not matter'],
        ]}
      />
      <Callout kind="mistake" title="Dropping a confounder to reduce VIF">
        If age confounds the exposure–outcome relationship, removing age because it correlates with the exposure biases the estimate. A wider confidence interval is the
        honest price of adjustment <Cite ids="obrien2007,hernan2016" />.
      </Callout>
      <Lab title="Ridge regression: bias for variance" description="x₁ and x₂ correlated at 0.95; true β₁ = 1, β₂ = 0.5; n = 60.">
        <SliderField label="Penalty λ (log₁₀ scale)" value={logLambda} onChange={setLogLambda} min={-2} max={2.8} step={0.1} format={(v) => `λ = ${fmt(10 ** v, 2)}`} />
        <Plot height={240} xDomain={[-2, 2.8]} yDomain={[-0.5, 2]} xLabel="log₁₀ λ" yLabel="Coefficient" ariaLabel="Ridge coefficient path for two correlated predictors">
          <HRule y={1} color="var(--series-1)" dash="2 4" />
          <HRule y={0.5} color="var(--series-2)" dash="2 4" />
          <Line points={path.map((p) => ({ x: p.ll, y: p.b1 }))} color="var(--series-1)" />
          <Line points={path.map((p) => ({ x: p.ll, y: p.b2 }))} color="var(--series-2)" />
          <VRule x={logLambda} />
        </Plot>
        <Legend items={[{ color: 'var(--series-1)', label: 'β̂₁ (truth 1, dotted)', shape: 'line' }, { color: 'var(--series-2)', label: 'β̂₂ (truth 0.5, dotted)', shape: 'line' }]} />
        <DataTable
          caption="Across 300 simulated datasets, for β̂₁"
          head={['Estimator', 'Mean (bias)', 'SD', 'Mean squared error']}
          align={['l', 'r', 'r', 'r']}
          rows={[
            ['OLS (λ = 0)', `${fmt(sampling.olsMean, 3)} (${fmt(sampling.olsMean - 1, 3)})`, fmt(sampling.olsSD, 3), fmt(sampling.olsMSE, 3)],
            [`Ridge (λ = ${fmt(lambda, 2)})`, `${fmt(sampling.rMean, 3)} (${fmt(sampling.rMean - 1, 3)})`, fmt(sampling.rSD, 3), fmt(sampling.rMSE, 3)],
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Variance reduction" value={`${fmt((1 - (sampling.rSD / sampling.olsSD) ** 2) * 100, 0)}%`} />
          <Stat label="MSE vs OLS" value={`${fmt((sampling.rMSE / sampling.olsMSE) * 100, 0)}%`} tone={sampling.rMSE < sampling.olsMSE ? 'good' : 'warning'} />
        </div>
        <p className="text-sm text-muted-foreground">
          Ridge shrinks both coefficients toward each other and toward zero. Moderate λ lowers mean squared error (useful for prediction) at the cost of bias, which is why
          ridge coefficients and their naive CIs are not used for causal inference. Penalization does not rescue a small development sample <Cite ids="riley2021" />.
        </p>
      </Lab>
      <Code
        r={`library(glmnet)\nx <- model.matrix(readmit_30d ~ ., dat)[, -1]\ncv <- cv.glmnet(x, dat$readmit_30d, family = "binomial", alpha = 0)   # ridge; alpha = 0.5 elastic net\ncoef(cv, s = "lambda.min")\n# For a joint test of collinear terms in a causal/descriptive model:\nanova(lm(y ~ age + sex, dat), lm(y ~ age + sex + creatinine + egfr, dat))`}
        py={`from sklearn.linear_model import LogisticRegressionCV\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nmodel = make_pipeline(StandardScaler(),\n    LogisticRegressionCV(Cs=20, penalty="elasticnet", solver="saga", l1_ratios=[0, .5], max_iter=5000))\nmodel.fit(X, y)`}
      />
      <Takeaways
        items={[
          'Causal question: keep the confounders; collinearity only widens intervals.',
          'Prediction: collinearity rarely matters; penalization can help, validation is essential.',
          'Description: choose one variable per construct or report joint tests.',
          'Ridge trades a little bias for a lot of variance; LASSO choices among correlated predictors are unstable.',
        ]}
      />
      <CheckYourself ids={['mc-confounder', 'mc-lasso']} />
    </div>
  );
}
