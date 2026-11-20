import { useState } from 'react';
import { Play } from 'lucide-react';
import { Rng, correlation, fitOLS, foldAssignments, mean } from '@/lib/stats';
import { Plot, Dots, VRule } from '@/components/plot/Plot';
import { Button, Callout, DataTable, Legend, SliderField, Stat, Code } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { defer, fmt } from '@/lib/utils';

function topK(cols: number[][], y: number[], idx: number[], k: number) {
  const yy = idx.map((i) => y[i]);
  return cols
    .map((c, j) => [Math.abs(correlation(idx.map((i) => c[i]), yy)), j] as const)
    .sort((a, b) => b[0] - a[0])
    .slice(0, k)
    .map(([, j]) => j);
}

function cvR2(cols: number[][], y: number[], k: number, folds: number[], selectInside: boolean): number {
  const n = y.length;
  const all = y.map((_, i) => i);
  const globalSel = selectInside ? null : topK(cols, y, all, k);
  const pred = new Array<number>(n);
  for (let f = 0; f < 5; f++) {
    const tr = all.filter((i) => folds[i] !== f), te = all.filter((i) => folds[i] === f);
    const sel = globalSel ?? topK(cols, y, tr, k);
    const fit = fitOLS(tr.map((i) => [1, ...sel.map((j) => cols[j][i])]), tr.map((i) => y[i]), ['i', ...sel.map(String)]);
    te.forEach((i) => { pred[i] = fit.coef.reduce((s, b, q) => s + b * (q === 0 ? 1 : cols[sel[fit.keptColumns[q] - 1]][i]), 0); });
  }
  const ybar = mean(y);
  const sse = y.reduce((s, v, i) => s + (v - pred[i]) ** 2, 0);
  const sst = y.reduce((s, v) => s + (v - ybar) ** 2, 0);
  return 1 - sse / sst;
}

export default function Leakage() {
  const [p, setP] = useState(1000);
  const [k, setK] = useState(10);
  const [res, setRes] = useState<{ wrong: number[]; right: number[] } | null>(null);
  const [running, setRunning] = useState(false);
  const run = async () => {
    setRunning(true);
    const out = await defer(() => {
      const rng = new Rng(`leak-${p}-${k}`);
      const wrong: number[] = [], right: number[] = [];
      for (let r = 0; r < 20; r++) {
        const n = 60;
        const y = Array.from({ length: n }, () => rng.normal());
        const cols = Array.from({ length: p }, () => Array.from({ length: n }, () => rng.normal()));
        const folds = foldAssignments(n, 5, rng);
        wrong.push(cvR2(cols, y, k, folds, false));
        right.push(cvR2(cols, y, k, folds, true));
      }
      return { wrong, right };
    });
    setRes(out);
    setRunning(false);
  };

  return (
    <div>
      <P>
        Leakage is information from the test data reaching model development. It produces impressive validation numbers for models that do not work, and is a leading
        cause of irreproducible machine-learning results in medicine <Cite ids="kapoor2023" />. The classic example, from Hastie, Tibshirani and Friedman, is screening
        predictors on the full dataset and only then cross-validating <Cite ids="hastie2009" />.
      </P>
      <Lab title="Leakage demo" description="60 patients. The outcome and every candidate predictor are independent random noise: the true R² of any model is 0.">
        <div className="grid gap-5 sm:grid-cols-2">
          <SliderField label="Candidate predictors (all noise)" value={p} onChange={setP} min={50} max={2000} step={50} />
          <SliderField label="Predictors kept after screening" value={k} onChange={setK} min={1} max={20} />
        </div>
        <Button onClick={run} disabled={running}><Play className="h-4 w-4" /> {running ? 'Running 20 datasets…' : 'Run 20 datasets'}</Button>
        {res && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Wrong: screen on all data, then 5-fold CV" value={`R² ${fmt(mean(res.wrong), 2)}`} tone="critical" sub="looks predictive" />
              <Stat label="Right: screen inside each training fold" value={`R² ${fmt(mean(res.right), 2)}`} tone="good" sub="≈ 0 or below: no signal" />
            </div>
            <Plot height={150} xDomain={[-1, 1]} yDomain={[-0.5, 1.5]} yTicks={[]} xLabel="Cross-validated R²" ariaLabel="Cross-validated R-squared for the wrong and right procedures">
              <VRule x={0} color="var(--good)" dash="" width={2} />
              <Dots points={res.wrong.map((v, i) => ({ x: Math.max(-1, v), y: 1 + ((i % 5) - 2) * 0.08, color: 'var(--critical)' }))} r={4} />
              <Dots points={res.right.map((v, i) => ({ x: Math.max(-1, v), y: 0 + ((i % 5) - 2) * 0.08, color: 'var(--series-1)' }))} r={4} />
            </Plot>
            <Legend items={[{ color: 'var(--critical)', label: 'Selection outside the folds (top row)' }, { color: 'var(--series-1)', label: 'Selection inside the folds (bottom row)' }]} />
          </>
        )}
      </Lab>
      <h2 className="mt-8 mb-3 text-lg font-semibold">Common sources of leakage in clinical data</h2>
      <DataTable
        head={['Leak', 'Fix']}
        rows={[
          ['Variable selection, tuning or feature engineering on all data', 'Put them in a pipeline that is refitted inside every fold; use nested CV for tuning'],
          ['Imputation or scaling on all data', 'Fit imputation and scaling on training folds only'],
          ['The same patient in training and test folds (repeated admissions)', 'Split by patient (grouped k-fold), not by row'],
          ['Predictors recorded after the prediction time (e.g., discharge diagnoses to predict admission risk)', 'Define the prediction moment; keep only information available then'],
          ['Future data in the training set (temporal leakage)', 'Temporal validation: train on earlier, test on later'],
          ['Outcome-derived predictors (e.g., treatment given because of the outcome)', 'Audit each predictor\'s timing and provenance'],
        ]}
      />
      <Callout kind="key">
        If an analysis step looks at the outcome, it belongs inside the validation loop. Nested cross-validation separates tuning (inner loop) from performance estimation
        (outer loop) <Cite ids="varma2006" />.
      </Callout>
      <Code
        r={`library(tidymodels)\nrec <- recipe(readmit ~ ., data = dat) |>\n  step_impute_bag(all_predictors()) |> step_normalize(all_numeric_predictors())\nwf  <- workflow(rec, logistic_reg())\nfolds <- group_vfold_cv(dat, group = patient_id, v = 10)   # patient-level splits\nfit_resamples(wf, folds, metrics = metric_set(roc_auc, brier_class))`}
        py={`from sklearn.pipeline import make_pipeline\nfrom sklearn.impute import SimpleImputer\nfrom sklearn.feature_selection import SelectKBest, f_classif\nfrom sklearn.model_selection import GroupKFold, cross_val_score\npipe = make_pipeline(SimpleImputer(), SelectKBest(f_classif, k=10), LogisticRegression(max_iter=1000))\ncross_val_score(pipe, X, y, groups=patient_id, cv=GroupKFold(10), scoring="roc_auc")  # all steps refit per fold`}
      />
      <Takeaways
        items={[
          'Any step that uses the outcome or the test data must be inside the resampling loop.',
          'With many candidates, screening outside CV makes pure noise look predictive.',
          'Split by patient, and respect time: predictors must be available at the prediction moment.',
          'Use pipelines so that preprocessing is refitted per fold automatically.',
        ]}
      />
      <CheckYourself ids={['va-selection-cv']} />
    </div>
  );
}
