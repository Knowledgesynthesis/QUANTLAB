import { useMemo, useState } from 'react';
import { Play, Shuffle } from 'lucide-react';
import { cohort } from '@/data/cohort';
import { Rng, mean, bootstrapReplicates, percentileInterval, bcaInterval, tInterval } from '@/lib/stats';
import { Histogram } from '@/components/plot/charts';
import { Plot, Line, VRule } from '@/components/plot/Plot';
import { Button, Callout, Code, DataTable, Legend, SliderField, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { defer, fmt, pct } from '@/lib/utils';

type Iv = [number, number];

export default function Bootstrap() {
  const pop = useMemo(() => cohort().map((r) => r.los_days), []);
  const popMean = mean(pop);
  const [n, setN] = useState(25);
  const [B, setB] = useState(1000);
  const [seed, setSeed] = useState(1);
  const sample = useMemo(() => new Rng(`boot-sample-${seed}-${n}`).resampleIndices(pop.length).slice(0, n).map((i) => pop[i]), [seed, n, pop]);
  const reps = useMemo(() => bootstrapReplicates(sample, mean, B, new Rng(`boot-${seed}-${n}-${B}`)), [sample, B, seed, n]);
  const pci = percentileInterval(reps);
  const bci = bcaInterval(sample, mean, reps);
  const tci = tInterval(sample);

  const [cov, setCov] = useState<{ t: Iv[]; pct: Iv[]; bca: Iv[] } | null>(null);
  const [running, setRunning] = useState(false);
  const runCoverage = async () => {
    setRunning(true);
    const res = await defer(() => {
      const rng = new Rng(`coverage-${n}-${Date.now()}`);
      const out = { t: [] as Iv[], pct: [] as Iv[], bca: [] as Iv[] };
      for (let k = 0; k < 100; k++) {
        const s = Array.from({ length: n }, () => pop[rng.int(pop.length)]);
        const r = bootstrapReplicates(s, mean, 500, rng);
        out.t.push(tInterval(s));
        out.pct.push(percentileInterval(r));
        out.bca.push(bcaInterval(s, mean, r));
      }
      return out;
    });
    setCov(res);
    setRunning(false);
  };
  const covers = (iv: Iv) => iv[0] <= popMean && popMean <= iv[1];
  const covCount = (ivs: Iv[]) => ivs.filter(covers).length;

  return (
    <div>
      <P>
        The bootstrap approximates the sampling distribution of a statistic by resampling the observed data with replacement: the sample stands in for the population
        <Cite ids="efron1993" />. It is invaluable for statistics without simple standard-error formulas (medians, C-statistics, optimism, ratios), and it is the engine of
        internal validation.
      </P>
      <Lab
        title="Bootstrap in action"
        description={`A sample of length-of-stay values (right-skewed) drawn from the cohort, whose mean ${fmt(popMean, 2)} days plays the role of the unknown truth.`}
        actions={<Button size="sm" variant="outline" onClick={() => setSeed((s) => s + 1)}><Shuffle className="h-4 w-4" /> New sample</Button>}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SliderField label="Sample size n" value={n} onChange={setN} min={10} max={200} step={5} />
          <SliderField label="Bootstrap replicates B" value={B} onChange={setB} min={100} max={5000} step={100} />
        </div>
        <Histogram values={reps} label="Bootstrap means of LOS (days)" bins={40} height={210}>
          <VRule x={mean(sample)} color="var(--foreground)" dash="" label="sample mean" />
          <VRule x={pci[0]} color="var(--series-2)" /><VRule x={pci[1]} color="var(--series-2)" />
          <VRule x={popMean} color="var(--good)" dash="" width={2} label="truth" labelPos="bottom" />
        </Histogram>
        <DataTable
          head={['95% interval', 'Lower', 'Upper', 'Covers truth?']}
          align={['l', 'r', 'r', 'c']}
          rows={[
            ['t-interval (normal theory)', fmt(tci[0], 2), fmt(tci[1], 2), covers(tci) ? 'yes' : 'no'],
            ['Bootstrap percentile', fmt(pci[0], 2), fmt(pci[1], 2), covers(pci) ? 'yes' : 'no'],
            ['Bootstrap BCa', fmt(bci[0], 2), fmt(bci[1], 2), covers(bci) ? 'yes' : 'no'],
          ]}
        />
        <p className="text-sm text-muted-foreground">
          With skewed data the bootstrap distribution is skewed too, and the BCa interval shifts to the right to correct for bias and skewness <Cite ids="diciccio1996" />.
        </p>
      </Lab>

      <Lab title="What does 95% mean? A coverage experiment" description={`Draw 100 independent samples of n = ${n}, compute a 95% interval from each, and count how many contain the true mean.`}>
        <Button onClick={runCoverage} disabled={running}><Play className="h-4 w-4" /> {running ? 'Computing 100 × 500 bootstraps…' : 'Draw 100 samples'}</Button>
        {cov && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="t-interval" value={`${covCount(cov.t)}/100`} tone={covCount(cov.t) < 90 ? 'warning' : 'good'} />
              <Stat label="Percentile" value={`${covCount(cov.pct)}/100`} tone={covCount(cov.pct) < 90 ? 'warning' : 'good'} />
              <Stat label="BCa" value={`${covCount(cov.bca)}/100`} tone={covCount(cov.bca) < 90 ? 'warning' : 'good'} />
            </div>
            <Plot height={320} xDomain={[Math.min(...cov.bca.map((i) => i[0])) - 0.3, Math.max(...cov.bca.map((i) => i[1])) + 0.3]} yDomain={[0, 101]} yTicks={[]} xLabel="LOS (days) – BCa intervals from 100 samples" ariaLabel="100 confidence intervals; those missing the true mean are highlighted">
              {cov.bca.map((iv, k) => (
                <Line key={k} points={[{ x: iv[0], y: k + 1 }, { x: iv[1], y: k + 1 }]} color={covers(iv) ? 'var(--series-1)' : 'var(--critical)'} width={covers(iv) ? 1.5 : 2.5} />
              ))}
              <VRule x={popMean} color="var(--good)" dash="" width={2} label="truth" />
            </Plot>
            <Legend items={[{ color: 'var(--series-1)', label: 'Covers the true mean', shape: 'line' }, { color: 'var(--critical)', label: 'Misses it', shape: 'line' }]} />
            <p className="text-sm text-muted-foreground">
              Each interval either contains the truth or does not. "95%" describes the procedure: about 95 of 100 intervals capture the true value. With small, skewed samples
              all three under-cover somewhat (expect high 80s to low 90s at n = 10–25; run it a few times), and the deficit shrinks as n grows. Coverage of {pct(0.95)} is a
              large-sample promise.
            </p>
          </>
        )}
      </Lab>
      <Callout kind="mistake" title="&quot;There is a 95% probability the true value lies in this interval&quot;">
        Under the frequentist interpretation the parameter is fixed and the interval is random; once computed, an interval contains the parameter or it does not. The
        correct statement is about the long-run coverage of the procedure <Cite ids="greenland2016" />. (A Bayesian credible interval does support a probability statement,
        given its prior.)
      </Callout>
      <DataTable
        head={['Use the bootstrap for', 'Watch out for']}
        rows={[
          ['SEs/CIs of medians, ratios, C-statistics, differences in AUC', 'Small n: the sample may not represent the tails'],
          ['Optimism correction in model validation (resample the whole procedure)', 'Clustered data: resample clusters (patients, sites), not rows'],
          ['Stability of variable selection', 'Time series: use block bootstrap'],
          ['Bias estimation and correction (BCa)', 'Extremes (max, min) and boundary parameters are poorly estimated'],
        ]}
      />
      <Code
        r={`library(boot)\nb <- boot(dat$los_days, function(x, i) mean(x[i]), R = 5000)\nboot.ci(b, type = c("perc", "bca"))\n# Cluster bootstrap: resample patients, keep all their rows\nids <- unique(dat$patient_id)\nstat <- function(i) mean(dat$los_days[dat$patient_id %in% ids[i]])`}
        py={`from scipy.stats import bootstrap\nimport numpy as np\nres = bootstrap((los,), np.mean, n_resamples=5000, method="BCa",\n                rng=np.random.default_rng(2025))\nres.confidence_interval`}
      />
      <Takeaways
        items={[
          'Bootstrap: resample with replacement to approximate a sampling distribution.',
          'Prefer BCa intervals for skewed statistics; use B ≥ 1,000 for intervals.',
          '95% describes the long-run behaviour of the interval procedure.',
          'Resample the independent units (patients or clusters), not rows.',
        ]}
      />
      <CheckYourself ids={['va-ci-meaning']} />
    </div>
  );
}
