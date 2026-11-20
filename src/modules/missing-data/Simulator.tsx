import { useMemo, useState } from 'react';
import { Play, Shuffle } from 'lucide-react';
import { Rng } from '@/lib/stats';
import { Plot, Dots, VRule, HoverLayer, Line, extent } from '@/components/plot/Plot';
import { Histogram } from '@/components/plot/charts';
import { Button, Callout, DataTable, Legend, SelectField, SliderField, Tabs } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { cn, defer, fmt, pct } from '@/lib/utils';
import { allMethods, analyse, generate, mechanismLabel, methodLabel, repeatSim, TRUTH, type Mechanism, type RepeatResult } from './sim';

const mechOptions = (Object.keys(mechanismLabel) as Mechanism[]).map((m) => ({ value: m, label: mechanismLabel[m] }));

function CoveragePlot({ results, target }: { results: RepeatResult[]; target: 'beta' | 'mean' }) {
  const truth = target === 'beta' ? TRUTH.betaBmi : TRUTH.bmiMean;
  const rows = results.map((r, i) => ({ i, s: r[target], label: methodLabel[r.method] }));
  const vals = rows.flatMap((r) => [r.s.meanEstimate - 1.96 * r.s.empiricalSE, r.s.meanEstimate + 1.96 * r.s.empiricalSE]);
  const xd = extent([...vals, truth], 0.08);
  return (
    <div>
      <Plot height={300} xDomain={xd} yDomain={[-0.7, rows.length - 0.3]} yTicks={[]} xLabel={target === 'beta' ? 'Estimated BMI coefficient (mmHg per kg/m²)' : 'Estimated mean BMI (kg/m²)'} ariaLabel="Mean estimate and spread of each method across simulated datasets, compared with the truth" grid>
        <VRule x={truth} color="var(--good)" dash="" width={2} label="truth" />
        {rows.map((r) => {
          const y = rows.length - 1 - r.i;
          const bad = r.s.coverage < 0.9;
          return (
            <g key={r.i}>
              <Line points={[{ x: r.s.meanEstimate - 1.96 * r.s.empiricalSE, y }, { x: r.s.meanEstimate + 1.96 * r.s.empiricalSE, y }]} color={bad ? 'var(--critical)' : 'var(--series-1)'} width={2} />
              <Dots points={[{ x: r.s.meanEstimate, y, color: bad ? 'var(--critical)' : 'var(--series-1)', r: 5 }]} />
            </g>
          );
        })}
        <HoverLayer points={rows.map((r) => ({ x: r.s.meanEstimate, y: rows.length - 1 - r.i, r }))} render={(p) => <span>{p.r.label}: mean {fmt(p.r.s.meanEstimate, 3)}, coverage {pct(p.r.s.coverage)}</span>} radius={60} />
      </Plot>
      <div className="-mt-1 grid gap-0.5 text-xs text-muted-foreground sm:hidden">
        {rows.map((r) => <span key={r.i}>{r.i + 1}. {r.label}</span>)}
      </div>
    </div>
  );
}

export default function Simulator() {
  const [mech, setMech] = useState<Mechanism>('MAR-outcome');
  const [prop, setProp] = useState(0.4);
  const [strength, setStrength] = useState(4);
  const [seed, setSeed] = useState(1);
  const [target, setTarget] = useState<'beta' | 'mean'>('beta');
  const [rep, setRep] = useState<RepeatResult[] | null>(null);
  const [repKey, setRepKey] = useState('');
  const [running, setRunning] = useState(false);
  const n = 300;
  const key = `${mech}-${prop}-${strength}`;

  const single = useMemo(() => {
    const rng = new Rng(`single-${seed}-${key}`);
    const d = generate(n, mech, prop, strength, rng);
    const res = allMethods.map((m) => ({ m, r: analyse(d, m, rng, 20) }));
    return { d, res };
  }, [seed, key, mech, prop, strength]);

  const runRepeat = async () => {
    setRunning(true);
    const r = await defer(() => repeatSim(n, mech, prop, strength, 200, `rep-${key}-${seed}`, 10));
    setRep(r);
    setRepKey(key);
    setRunning(false);
  };

  const { d } = single;
  const missingTrue = d.bmi.filter((_, i) => d.missing[i]);
  const observed = d.bmi.filter((_, i) => !d.missing[i]);
  const dom: [number, number] = [14, 42];
  const truth = target === 'beta' ? TRUTH.betaBmi : TRUTH.bmiMean;

  return (
    <div>
      <P>
        True model: SBP = 130 + {fmt(TRUTH.betaBmi, 3)}·(BMI − 28) + {fmt(TRUTH.betaAge, 3)}·(age − 60) + error, with BMI and age correlated (r = 0.5). BMI is then
        deleted by the mechanism you choose. Two estimands: the <strong>BMI coefficient</strong> (adjusted for age) and the <strong>mean BMI</strong> (true value 28).
        Because the truth is known, you can see bias directly <Cite ids="morris2019" />.
      </P>

      <Lab
        title="Missing-data simulator"
        description={`n = ${n}. One dataset below; then run 200 datasets to measure bias and confidence-interval coverage.`}
        actions={<Button size="sm" variant="outline" onClick={() => setSeed((s) => s + 1)}><Shuffle className="h-4 w-4" /> New dataset</Button>}
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField label="Mechanism" value={mech} onChange={(v) => { setMech(v); }} options={mechOptions} />
          <SliderField label="Proportion missing" value={prop} onChange={setProp} min={0.1} max={0.7} step={0.05} format={(v) => pct(v)} />
          <SliderField label="Strength (odds ratio per SD)" value={strength} onChange={setStrength} min={1} max={10} step={0.5} format={(v) => `${v}×`} disabled={mech === 'MCAR'} hint={mech === 'MCAR' ? 'Not used under MCAR.' : 'How strongly the driver predicts missingness.'} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-medium">SBP vs BMI (orange = BMI missing; position shown using the true value)</p>
            <Plot height={230} xDomain={dom} yDomain={extent(d.sbp)} xLabel="BMI (kg/m²)" yLabel="SBP (mmHg)" ariaLabel="Scatter of SBP against BMI, highlighting patients whose BMI is missing">
              <Dots points={d.bmi.map((b, i) => ({ x: b, y: d.sbp[i], color: d.missing[i] ? 'var(--series-2)' : 'var(--series-1)', opacity: d.missing[i] ? 0.85 : 0.45, r: 3 }))} />
            </Plot>
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">BMI: observed (blue) vs the values that went missing (orange)</p>
            <Histogram values={observed} label="BMI (kg/m²)" domain={dom} bins={28} height={230}>
              <VRule x={observed.reduce((s, v) => s + v, 0) / observed.length} color="var(--series-1)" dash="" width={2} />
              <VRule x={missingTrue.reduce((s, v) => s + v, 0) / Math.max(1, missingTrue.length)} color="var(--series-2)" dash="" width={2} />
              <VRule x={TRUTH.bmiMean} color="var(--good)" width={2} />
            </Histogram>
            <Legend items={[{ color: 'var(--series-1)', label: 'Mean of observed', shape: 'line' }, { color: 'var(--series-2)', label: 'Mean of missing (unknowable)', shape: 'line' }, { color: 'var(--good)', label: 'True mean 28', shape: 'line', dashed: true }]} />
          </div>
        </div>

        <Tabs value={target} onChange={setTarget} tabs={[{ value: 'beta', label: 'BMI coefficient' }, { value: 'mean', label: 'Mean BMI' }]} />
        <DataTable
          caption={`This dataset: ${d.missing.filter(Boolean).length} of ${n} BMI values missing. Truth = ${fmt(truth, 3)}. MI uses m = 20.`}
          head={['Method', 'Estimate', 'SE', '95% CI', 'Covers truth?']}
          align={['l', 'r', 'r', 'r', 'c']}
          rows={single.res.map(({ m, r }) => {
            const e = r[target];
            const covers = e.lo <= truth && truth <= e.hi;
            return [methodLabel[m], fmt(e.est, 3), fmt(e.se, 3), `${fmt(e.lo, 2)} to ${fmt(e.hi, 2)}`, <span className={covers ? 'text-good-text' : 'font-semibold text-critical-text'}>{covers ? 'yes' : 'no'}</span>];
          })}
        />

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Button onClick={runRepeat} disabled={running}><Play className="h-4 w-4" /> {running ? 'Running 200 datasets…' : 'Run 200 datasets'}</Button>
          {rep && repKey !== key && <span className="text-xs text-warning-text">Settings changed – rerun to update.</span>}
        </div>
        {rep && (
          <>
            <CoveragePlot results={rep} target={target} />
            <p className="text-xs text-muted-foreground">Dot = mean estimate across 200 datasets; bar = ± 1.96 × empirical SE. Red = 95% CI coverage below 90%.</p>
            <DataTable
              head={['Method', 'Bias', 'MCSE', 'Empirical SE', 'Mean model SE', 'Coverage']}
              align={['l', 'r', 'r', 'r', 'r', 'r']}
              rows={rep.map((r) => {
                const s = r[target];
                return [
                  methodLabel[r.method],
                  <span className={cn(Math.abs(s.bias) > 3 * s.biasMCSE && Math.abs(s.bias) > 0.02 * Math.abs(truth) && 'font-semibold text-critical-text')}>{fmt(s.bias, 3)}</span>,
                  fmt(s.biasMCSE, 3),
                  fmt(s.empiricalSE, 3),
                  <span className={cn(s.meanModelSE < 0.85 * s.empiricalSE && 'font-semibold text-warning-text')}>{fmt(s.meanModelSE, 3)}</span>,
                  <span className={cn(s.coverage < 0.9 ? 'font-semibold text-critical-text' : 'text-good-text')}>{pct(s.coverage)}</span>,
                ];
              })}
            />
          </>
        )}
      </Lab>

      <Callout kind="key" title="Experiments to run">
        <ol className="list-decimal space-y-1 pl-5">
          <li><strong>MAR on age</strong>, BMI coefficient: complete cases are unbiased with correct coverage, just less precise. The mean BMI from complete cases is biased.</li>
          <li><strong>MAR on SBP (the outcome)</strong>: now complete cases are biased for the coefficient. MI with the outcome in the imputation model recovers it; MI <em>without</em> the outcome is biased toward zero <Cite ids="moons2006" />.</li>
          <li>Under any mechanism, <strong>mean imputation</strong> and the <strong>missing indicator</strong> bias the coefficient, and their SEs are too small <Cite ids="groenwold2012" />.</li>
          <li><strong>Deterministic regression imputation</strong> inflates the coefficient (imputed points sit exactly on the line); <strong>single stochastic imputation</strong> fixes the bias but under-covers, because it treats imputed values as known.</li>
          <li><strong>MNAR</strong>: every method is biased for the mean. Only a sensitivity analysis can address this (lesson 5).</li>
        </ol>
      </Callout>
      <Callout kind="info" title="Reading the table">
        Bias = mean estimate − truth. MCSE is its Monte Carlo standard error: bias within about 2 MCSE is consistent with zero. If the mean model SE is much smaller than the
        empirical SE, the method is over-confident; that shows up as coverage below 95%.
      </Callout>
      <Takeaways
        items={[
          'Bias depends on the mechanism and the estimand: the same data give unbiased coefficients but a biased mean from complete cases.',
          'When missingness depends on the outcome, complete-case regression is biased; MI with the outcome fixes it.',
          'Single imputation of any kind understates uncertainty.',
          'No standard method removes MNAR bias.',
        ]}
      />
      <CheckYourself ids={['md-cca-valid', 'md-outcome-in-model', 'md-mean-imp', 'md-indicator']} />
    </div>
  );
}
