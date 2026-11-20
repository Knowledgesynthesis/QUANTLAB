import { useMemo, useState } from 'react';
import { Play, Shuffle } from 'lucide-react';
import { cohort, type Admission } from '@/data/cohort';
import { Rng, crossprod, crossprodVec, invertSPD, matVec, tPValue, quantile, median, mean, sd } from '@/lib/stats';
import { Plot, Dots, HRule } from '@/components/plot/Plot';
import { Button, Callout, DataTable, Legend, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { pct } from '@/lib/utils';

type Outcome = 'raw' | 'log' | 'winsor';
type Coding = 'continuous' | 'median' | 'top-tertile';
type Adjust = 'none' | 'age-sex' | 'clinical' | 'full';
type Exclude = 'none' | 'los>30' | '|z|>3';
type Subgroup = 'all' | 'age≥65' | 'diabetes';
interface Spec { outcome: Outcome; coding: Coding; adjust: Adjust; exclude: Exclude; subgroup: Subgroup }
const choices = {
  outcome: ['raw', 'log', 'winsor'] as Outcome[],
  coding: ['continuous', 'median', 'top-tertile'] as Coding[],
  adjust: ['none', 'age-sex', 'clinical', 'full'] as Adjust[],
  exclude: ['none', 'los>30', '|z|>3'] as Exclude[],
  subgroup: ['all', 'age≥65', 'diabetes'] as Subgroup[],
};
const specs: Spec[] = choices.outcome.flatMap((outcome) => choices.coding.flatMap((coding) => choices.adjust.flatMap((adjust) => choices.exclude.flatMap((exclude) => choices.subgroup.map((subgroup) => ({ outcome, coding, adjust, exclude, subgroup }))))));

interface Row extends Admission { marker: number }

function dataset(seed: string, n = 300): Row[] {
  const rng = new Rng(seed);
  const c = cohort();
  return Array.from({ length: n }, () => ({ ...c[rng.int(c.length)], marker: rng.normal(5, 1.5) }));
}

function tStat(rows: Row[], s: Spec): { t: number; df: number } {
  let d = rows;
  if (s.subgroup === 'age≥65') d = d.filter((r) => r.age >= 65);
  if (s.subgroup === 'diabetes') d = d.filter((r) => r.diabetes === 1);
  const cap = quantile(d.map((r) => r.los_days), 0.95);
  let y = d.map((r) => (s.outcome === 'log' ? Math.log(r.los_days) : s.outcome === 'winsor' ? Math.min(r.los_days, cap) : r.los_days));
  if (s.exclude !== 'none') {
    const m = mean(y), sdev = sd(y);
    const keep = d.map((r, i) => (s.exclude === 'los>30' ? r.los_days <= 30 : Math.abs((y[i] - m) / sdev) <= 3));
    d = d.filter((_, i) => keep[i]);
    y = y.filter((_, i) => keep[i]);
  }
  const mk = d.map((r) => r.marker);
  const med = median(mk), t3 = quantile(mk, 2 / 3);
  const x = mk.map((v) => (s.coding === 'continuous' ? v : s.coding === 'median' ? (v > med ? 1 : 0) : v > t3 ? 1 : 0));
  const X = d.map((r, i) => {
    const row = [1, x[i]];
    if (s.adjust !== 'none') row.push((r.age - 65) / 10, r.sex === 'M' ? 1 : 0);
    if (s.adjust === 'clinical' || s.adjust === 'full') row.push(...(s.subgroup === 'diabetes' ? [] : [r.diabetes]), r.hypertension);
    if (s.adjust === 'full') row.push(r.hemoglobin, Math.log(r.creatinine), r.smoking === 'current' ? 1 : 0);
    return row;
  });
  const inv = invertSPD(crossprod(X));
  const b = matVec(inv, crossprodVec(X, y));
  let rss = 0;
  X.forEach((row, i) => { rss += (y[i] - row.reduce((acc, v, j) => acc + v * b[j], 0)) ** 2; });
  const s2 = rss / (X.length - X[0].length);
  return { t: b[1] / Math.sqrt(s2 * inv[1][1]), df: X.length - X[0].length };
}

export default function ForkingPaths() {
  const [seed, setSeed] = useState(1);
  const ts = useMemo(() => {
    const d = dataset(`multiverse-${seed}`);
    return specs.map((s) => ({ s, ...tStat(d, s) }));
  }, [seed]);
  const sig = ts.filter((r) => tPValue(r.t, r.df) < 0.05);
  const sorted = [...ts].sort((a, b) => a.t - b.t);
  const [many, setMany] = useState<{ anySig: number; meanShare: number; reps: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);

  const runMany = async () => {
    setRunning(true);
    let any = 0, share = 0;
    const reps = 40;
    for (let k = 0; k < reps; k++) {
      await new Promise((r) => setTimeout(r, 0));
      const d = dataset(`multiverse-many-${k}`);
      const nsig = specs.filter((s) => { const r = tStat(d, s); return tPValue(r.t, r.df) < 0.05; }).length;
      if (nsig > 0) any++;
      share += nsig / specs.length;
      setProgress(k + 1);
    }
    setMany({ anySig: any / reps, meanShare: share / reps, reps });
    setRunning(false);
  };

  const byChoice = (Object.keys(choices) as (keyof Spec)[]).flatMap((key) =>
    (choices[key] as string[]).map((opt) => {
      const sub = ts.filter((r) => r.s[key] === opt);
      return [key, opt, pct(sub.filter((r) => tPValue(r.t, r.df) < 0.05).length / sub.length)];
    }),
  );

  return (
    <div>
      <P>
        Every analysis involves choices: how to handle outliers, which covariates, which transformation, which subgroup. When these choices are made after seeing the data,
        even honest analysts drift toward results that "work". Gelman and Loken called this the garden of forking paths: false positives multiply without any deliberate
        p-hacking <Cite ids="gelman2014" />.
      </P>
      <Lab
        title="Multiverse"
        description={`Question: is a new biomarker associated with length of stay? The biomarker is pure noise, so the true answer is no. We run all ${specs.length} reasonable analyses (3 outcome scales × 3 codings × 4 adjustment sets × 3 exclusion rules × 3 subgroups) on one sample of 300 admissions.`}
        actions={<Button size="sm" variant="outline" onClick={() => setSeed((s) => s + 1)}><Shuffle className="h-4 w-4" /> New sample</Button>}
      >
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Specifications with p < 0.05" value={`${sig.length} / ${specs.length}`} tone={sig.length ? 'critical' : 'good'} />
          <Stat label="Largest |t|" value={Math.max(...ts.map((r) => Math.abs(r.t))).toFixed(2)} />
          <Stat label="Smallest p" value={Math.min(...ts.map((r) => tPValue(r.t, r.df))).toFixed(3)} />
        </div>
        <Plot height={240} xDomain={[0, specs.length + 1]} yDomain={[Math.min(-3, ...ts.map((r) => r.t)) - 0.2, Math.max(3, ...ts.map((r) => r.t)) + 0.2]} xLabel="Specification (sorted by t)" yLabel="t statistic for the biomarker" ariaLabel="Specification curve: t statistics of all analyses sorted">
          <HRule y={1.97} color="var(--critical)" label="p = 0.05" />
          <HRule y={-1.97} color="var(--critical)" />
          <HRule y={0} dash="" />
          <Dots points={sorted.map((r, i) => ({ x: i + 1, y: r.t, color: Math.abs(r.t) > 1.97 ? 'var(--critical)' : 'var(--series-1)', r: 2.5 }))} opacity={0.8} ring={false} />
        </Plot>
        <Legend items={[{ color: 'var(--series-1)', label: 'p ≥ 0.05' }, { color: 'var(--critical)', label: 'p < 0.05 (false positive)' }]} />
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium">Share of significant results by analytic choice</summary>
          <DataTable head={['Choice', 'Option', 'p < 0.05']} rows={byChoice} className="mt-2" />
        </details>
        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Button onClick={runMany} disabled={running}><Play className="h-4 w-4" /> {running ? `Running ${progress}/40…` : 'Repeat in 40 independent samples'}</Button>
        </div>
        {many && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Samples with ≥ 1 significant specification" value={pct(many.anySig)} tone="critical" sub="what a flexible analyst can report" />
            <Stat label="Average share of specifications significant" value={pct(many.meanShare, 1)} sub="≈ 5%: any single pre-specified analysis is fine" tone="good" />
          </div>
        )}
      </Lab>
      <Callout kind="key" title="The fix is commitment, not cleverness">
        Each pre-specified analysis has a 5% false-positive rate. Choosing among many after seeing the results does not. Write and date a statistical analysis plan (SAP) before
        analysing outcomes; register protocols (ClinicalTrials.gov, OSF); label any later analyses as exploratory; and where many analyses are defensible, report all of them
        as a specification curve <Cite ids="simonsohn2020" />.
      </Callout>
      <DataTable
        head={['SAP section', 'Must specify']}
        rows={[
          ['Estimand', 'Population, exposure contrast, outcome, summary measure, handling of intercurrent events'],
          ['Primary model', 'Outcome scale, covariates (with rationale, e.g., a DAG), functional forms'],
          ['Missing data', 'Assumed mechanism, primary method, number of imputations, sensitivity analyses'],
          ['Data handling', 'Exclusion and outlier rules, derived variables'],
          ['Secondary and sensitivity analyses', 'Listed in advance, with their purpose'],
          ['Multiplicity', 'Which results are confirmatory and how error is controlled'],
        ]}
      />
      <Takeaways
        items={[
          'Data-dependent choices inflate false positives even without intent.',
          'A dated SAP turns one of hundreds of possible analyses into the analysis.',
          'Report deviations from the plan and label exploratory results as such.',
          'When many specifications are defensible, show them all.',
        ]}
      />
      <CheckYourself ids={['rp-forking']} />
    </div>
  );
}
