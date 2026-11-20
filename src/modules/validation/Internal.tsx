import { useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { Rng, mean, sd } from '@/lib/stats';
import { Plot, Dots, VRule } from '@/components/plot/Plot';
import { Button, Callout, Code, DataTable, SliderField } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { fmt } from '@/lib/utils';
import { bootstrapOptimism, crossValidatedAUC, evaluate, fit, generate, splitSample } from './sim';

type MethodKey = 'apparent' | 'split' | 'cv' | 'boot';
const label: Record<MethodKey, string> = { apparent: 'Apparent', split: 'Split sample 70/30', cv: '10-fold CV', boot: 'Bootstrap optimism-corrected' };
const keys: MethodKey[] = ['apparent', 'split', 'cv', 'boot'];

export default function Internal() {
  const [n, setN] = useState(300);
  const [noise, setNoise] = useState(6);
  const [errors, setErrors] = useState<Record<MethodKey, number[]> | null>(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const stop = useRef(false);
  const REPS = 30;

  const run = async () => {
    setRunning(true);
    stop.current = false;
    const rng = new Rng(`internal-${n}-${noise}-${Date.now()}`);
    const test = generate(5000, noise, new Rng(`internal-test-${noise}`));
    const acc: Record<MethodKey, number[]> = { apparent: [], split: [], cv: [], boot: [] };
    for (let r = 0; r < REPS && !stop.current; r++) {
      await new Promise((res) => setTimeout(res, 0));
      const d = generate(n, noise, rng);
      const truth = evaluate(fit(d), test).auc;
      const bo = bootstrapOptimism(d, 40, rng);
      acc.apparent.push(bo.apparent - truth);
      acc.boot.push(bo.corrected - truth);
      acc.cv.push(crossValidatedAUC(d, 10, rng) - truth);
      acc.split.push(splitSample(d, rng) - truth);
      setProgress(r + 1);
      setErrors({ apparent: [...acc.apparent], split: [...acc.split], cv: [...acc.cv], boot: [...acc.boot] });
    }
    setRunning(false);
  };

  const all = errors ? keys.flatMap((k) => errors[k]) : [0];
  const lim = Math.max(0.1, ...all.map(Math.abs)) * 1.1;

  return (
    <div>
      <P>
        Internal validation estimates how the model <em>fitted to all your data</em> will perform in new patients from the same population. Methods differ in bias and,
        just as important, in how much the estimate varies from one dataset to the next <Cite ids="steyerberg2001,steyerberg2016" />.
      </P>
      <DataTable
        head={['Method', 'How', 'Problems']}
        rows={[
          ['Apparent', 'Evaluate on the development data', 'Optimistic'],
          ['Split sample', 'Develop on 70%, test on 30%', 'Evaluates a different, weaker model; very variable; wastes data'],
          ['k-fold cross-validation', 'Fit on k − 1 folds, test on the held-out fold, average', 'Slightly pessimistic (models fit on (k−1)/k of data); repeat for stability'],
          ['Bootstrap optimism correction', 'Apparent − mean(optimism), where optimism = performance on bootstrap sample − on original data', 'Can under-correct when events per parameter are very low'],
        ]}
      />
      <Lab title="Validation comparison" description="Each dot is one simulated development dataset: estimated C-statistic minus the true C-statistic of the full-data model (measured in 5,000 new patients). 0 = perfect.">
        <div className="grid gap-5 sm:grid-cols-2">
          <SliderField label="Development sample size" value={n} onChange={setN} min={100} max={800} step={50} disabled={running} />
          <SliderField label="Noise predictors (plus 4 real)" value={noise} onChange={setNoise} min={0} max={20} disabled={running} />
        </div>
        <div className="flex items-center gap-3">
          {!running ? (
            <Button onClick={run}><Play className="h-4 w-4" /> Run {REPS} datasets</Button>
          ) : (
            <Button variant="outline" onClick={() => { stop.current = true; }}><Square className="h-4 w-4" /> Stop ({progress}/{REPS})</Button>
          )}
          <span className="text-xs text-muted-foreground">Each dataset: 1 full fit, 40 bootstrap fits, 10 CV fits, 1 split fit.</span>
        </div>
        {errors && (
          <>
            <Plot height={250} xDomain={[-lim, lim]} yDomain={[-0.6, keys.length - 0.4]} yTicks={[]} xLabel="Estimate − truth (C-statistic)" ariaLabel="Error of each validation method across simulated datasets">
              <VRule x={0} color="var(--good)" dash="" width={2} />
              {keys.map((k, i) => (
                <Dots key={k} points={errors[k].map((e, j) => ({ x: e, y: keys.length - 1 - i + ((j % 7) - 3) * 0.06, color: `var(--series-${(i % 4) + 1})` }))} r={4} opacity={0.75} />
              ))}
            </Plot>
            <DataTable
              head={['Method', 'Mean error (bias)', 'SD of error', 'Root mean squared error']}
              align={['l', 'r', 'r', 'r']}
              rows={keys.map((k, i) => {
                const e = errors[k];
                return [
                  <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--series-${(i % 4) + 1})` }} />{label[k]}</span>,
                  fmt(mean(e), 3), fmt(e.length > 1 ? sd(e) : 0, 3), fmt(Math.sqrt(mean(e.map((v) => v * v))), 3),
                ];
              })}
            />
            <p className="text-sm text-muted-foreground">
              Rows top to bottom: apparent, split sample, 10-fold CV, bootstrap. Typically the apparent estimate is clearly optimistic; the split-sample estimate is roughly
              unbiased on average but scattered widely, so any single split can mislead; CV and bootstrap are both closer to the truth with less scatter. With 20 noise
              predictors and n = 100 (very few events per parameter), watch the bootstrap under-correct.
            </p>
          </>
        )}
      </Lab>
      <Callout kind="key" title="Validate the whole procedure">
        The bootstrap or CV loop must repeat <em>every</em> data-driven step: variable selection, transformations chosen by looking at data, imputation, and tuning of
        penalties. Validating only the final model gives optimistic numbers (next lesson).
      </Callout>
      <Callout kind="tip" title="Internal–external validation">
        With multi-centre or multi-period data, leave one centre (or period) out at a time, develop on the rest and test on the held-out one. This shows heterogeneity in
        performance across settings, which random resampling cannot <Cite ids="steyerberg2016" />.
      </Callout>
      <Code
        r={`library(rms)\nfit <- lrm(readmit ~ age + diabetes + log(los) + hb + smoker, data = dat, x = TRUE, y = TRUE)\nset.seed(2025)\nvalidate(fit, method = "boot", B = 500)     # optimism-corrected Dxy (C = Dxy/2 + 0.5), slope\ncal <- calibrate(fit, B = 500); plot(cal)    # bias-corrected calibration curve`}
        py={`from sklearn.model_selection import RepeatedStratifiedKFold, cross_val_score\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\npipe = make_pipeline(StandardScaler(), LogisticRegression(penalty=None, max_iter=1000))\ncv = RepeatedStratifiedKFold(n_splits=10, n_repeats=20, random_state=2025)\ncross_val_score(pipe, X, y, cv=cv, scoring="roc_auc").mean()`}
      />
      <Takeaways
        items={[
          'Report apparent and optimism-corrected performance, and the method used.',
          'Avoid single random splits for development samples of typical clinical size.',
          'Bootstrap (500+ replicates) or repeated k-fold CV are efficient choices.',
          'Every data-driven step goes inside the resampling loop.',
        ]}
      />
      <CheckYourself ids={['va-split', 'va-optimism', 'va-stratified']} />
    </div>
  );
}
