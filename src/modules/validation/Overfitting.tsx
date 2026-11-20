import { useMemo, useState } from 'react';
import { Play, Shuffle } from 'lucide-react';
import { Rng, mean } from '@/lib/stats';
import { Plot, Line, Dots, HRule } from '@/components/plot/Plot';
import { Button, Callout, DataTable, Legend, SliderField, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { defer, fmt } from '@/lib/utils';
import { evaluate, fit, generate, TRUE_BETAS } from './sim';

const test = generate(5000, 40, new Rng('overfit-test'));

function testFor(noise: number) {
  return { X: test.X.map((r) => r.slice(0, 1 + TRUE_BETAS.length + noise)), y: test.y };
}

export default function Overfitting() {
  const [n, setN] = useState(200);
  const [noise, setNoise] = useState(10);
  const [seed, setSeed] = useState(1);
  const [curve, setCurve] = useState<{ noise: number; app: number; truth: number; slope: number }[] | null>(null);
  const [running, setRunning] = useState(false);
  const one = useMemo(() => {
    const d = generate(n, noise, new Rng(`overfit-${n}-${noise}-${seed}`));
    const coef = fit(d);
    const events = d.y.reduce((s, v) => s + v, 0);
    return { app: evaluate(coef, d), truth: evaluate(coef, testFor(noise)), events, params: TRUE_BETAS.length + noise };
  }, [n, noise, seed]);
  const oracle = useMemo(() => evaluate([-1.75, ...TRUE_BETAS], testFor(0)).auc, []);
  const runCurve = async () => {
    setRunning(true);
    const res = await defer(() => [0, 5, 10, 15, 20, 30, 40].map((k) => {
      const rng = new Rng(`overfit-curve-${n}-${k}`);
      const a: number[] = [], t: number[] = [], s: number[] = [];
      for (let r = 0; r < 15; r++) {
        const d = generate(n, k, rng);
        const coef = fit(d);
        a.push(evaluate(coef, d).auc);
        const tt = evaluate(coef, testFor(k));
        t.push(tt.auc); s.push(tt.slope);
      }
      return { noise: k, app: mean(a), truth: mean(t), slope: mean(s) };
    }));
    setCurve(res);
    setRunning(false);
  };

  return (
    <div>
      <P>
        A model fitted to a sample learns its signal and its noise. Performance measured on the same data (<strong>apparent</strong> performance) is therefore optimistic,
        and the gap grows with the number of parameters relative to the information in the data (the number of events, for binary outcomes) <Cite ids="steyerberg2019,harrell2015" />.
      </P>
      <Lab
        title="Overfitting simulator"
        description="4 real predictors plus pure-noise candidates; 20% outcome rate. Truth is measured in 5,000 new patients."
        actions={<Button size="sm" variant="outline" onClick={() => setSeed((s) => s + 1)}><Shuffle className="h-4 w-4" /> New sample</Button>}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SliderField label="Development sample size" value={n} onChange={setN} min={100} max={2000} step={50} />
          <SliderField label="Noise predictors added" value={noise} onChange={setNoise} min={0} max={40} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Events per parameter" value={fmt(one.events / one.params, 1)} sub={`${one.events} events / ${one.params} parameters`} />
          <Stat label="Apparent C-statistic" value={fmt(one.app.auc, 3)} />
          <Stat label="C-statistic in new patients" value={fmt(one.truth.auc, 3)} sub={`best possible ≈ ${fmt(oracle, 3)}`} tone={one.app.auc - one.truth.auc > 0.05 ? 'critical' : undefined} />
          <Stat label="Calibration slope in new patients" value={fmt(one.truth.slope, 2)} sub="apparent is always 1.00" tone={one.truth.slope < 0.85 ? 'critical' : 'good'} />
        </div>
        <Button onClick={runCurve} disabled={running}><Play className="h-4 w-4" /> {running ? 'Running…' : `Average over 15 samples per setting (n = ${n})`}</Button>
        {curve && (
          <>
            <Plot height={240} xDomain={[0, 40]} yDomain={[0.5, 1]} xLabel="Noise predictors" yLabel="C-statistic" ariaLabel="Apparent versus true C-statistic as noise predictors are added">
              <HRule y={oracle} color="var(--good)" label="true model" />
              <Line points={curve.map((c) => ({ x: c.noise, y: c.app }))} color="var(--series-2)" />
              <Dots points={curve.map((c) => ({ x: c.noise, y: c.app, color: 'var(--series-2)' }))} r={4} />
              <Line points={curve.map((c) => ({ x: c.noise, y: c.truth }))} color="var(--series-1)" />
              <Dots points={curve.map((c) => ({ x: c.noise, y: c.truth }))} r={4} />
            </Plot>
            <Legend items={[{ color: 'var(--series-2)', label: 'Apparent (development data)', shape: 'line' }, { color: 'var(--series-1)', label: 'New patients', shape: 'line' }, { color: 'var(--good)', label: 'True model', shape: 'line', dashed: true }]} />
            <DataTable head={['Noise predictors', 'Apparent C', 'True C', 'Optimism', 'True calibration slope']} align={['r', 'r', 'r', 'r', 'r']} rows={curve.map((c) => [c.noise, fmt(c.app, 3), fmt(c.truth, 3), fmt(c.app - c.truth, 3), fmt(c.slope, 2)])} />
          </>
        )}
      </Lab>
      <Callout kind="key" title="Two symptoms of overfitting">
        (1) Optimism: apparent discrimination exceeds true discrimination. (2) Miscalibration in new data: a calibration slope below 1, meaning high predicted risks are too
        high and low ones too low. Shrinkage (uniform shrinkage, ridge, LASSO) targets the second, but only an adequate sample size prevents both reliably <Cite ids="riley2021,riley2020" />.
      </Callout>
      <Callout kind="mistake" title="Selecting predictors by p-value in the same data">
        Univariable screening or stepwise selection makes the problem worse: the selected coefficients are biased away from zero and the selection itself is unstable
        <Cite ids="heinze2018" />. Choose candidate predictors on clinical grounds before seeing the outcome data.
      </Callout>
      <Takeaways
        items={[
          'Apparent performance is optimistic; the optimism grows with parameters per event.',
          'Overfit models give predictions that are too extreme (calibration slope < 1).',
          'Count candidate parameters, not just selected ones: every dummy, spline term and screened variable.',
          'Plan the sample size before development (lesson 6).',
        ]}
      />
      <CheckYourself ids={['va-epv']} />
    </div>
  );
}
