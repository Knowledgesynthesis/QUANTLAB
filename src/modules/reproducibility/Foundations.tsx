import { useState } from 'react';
import { Play } from 'lucide-react';
import { cohort } from '@/data/cohort';
import { Rng, mean, bootstrapReplicates, percentileInterval } from '@/lib/stats';
import { Button, Callout, Checkbox, Code, DataTable, SliderField } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { fmt } from '@/lib/utils';

/** A deliberately different generator (mulberry32) standing in for "a different software version". */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Run { id: number; seeded: boolean; seed: number; version: string; lo: number; hi: number; boots: number }

export default function Foundations() {
  const los = cohort().slice(0, 80).map((r) => r.los_days);
  const [useSeed, setUseSeed] = useState(true);
  const [seed, setSeed] = useState(2025);
  const [v2, setV2] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
  const run = () => {
    const effSeed = useSeed ? seed : Math.floor(Math.random() * 1e9);
    let ci: [number, number];
    if (v2) {
      const u = mulberry(effSeed);
      const reps = Array.from({ length: 1000 }, () => mean(Array.from({ length: los.length }, () => los[Math.floor(u() * los.length)])));
      ci = percentileInterval(reps);
    } else {
      ci = percentileInterval(bootstrapReplicates(los, mean, 1000, new Rng(effSeed)));
    }
    setRuns((r) => [{ id: (r[0]?.id ?? 0) + 1, seeded: useSeed, seed: effSeed, version: v2 ? '2.0 (new RNG)' : '1.0', lo: ci[0], hi: ci[1], boots: 1000 }, ...r].slice(0, 8));
  };

  return (
    <div>
      <P>
        The National Academies distinguish <strong>reproducibility</strong>, obtaining consistent results with the same data and code, from <strong>replicability</strong>,
        obtaining consistent findings in a new study <Cite ids="nasem2019" />. Reproducibility is the minimum standard: if your own numbers cannot be regenerated, nobody can
        check them. It is also entirely within your control.
      </P>
      <DataTable
        head={['Threat to reproducibility', 'Remedy']}
        rows={[
          ['Manual steps (copy-paste, spreadsheet edits)', 'Script everything from raw data to tables and figures'],
          ['Uncontrolled randomness (bootstrap, CV, MI, ML)', 'Set and report seeds; use one RNG stream per task'],
          ['Software and package changes', 'Lock versions (renv, uv, conda-lock); record sessionInfo(); containers for long-term archiving'],
          ['Hidden state (notebooks run out of order, objects in memory)', 'Re-run from a clean session; render documents end-to-end'],
          ['Undocumented decisions', 'Version control with informative messages; analysis plan and decision log'],
        ]}
      />
      <Lab title="Seed demo" description="Bootstrap 95% CI for mean LOS in 80 patients (1,000 resamples).">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Checkbox label="Set a seed" checked={useSeed} onChange={setUseSeed} />
            {useSeed && <SliderField label="Seed" value={seed} onChange={setSeed} min={1} max={5000} />}
          </div>
          <Checkbox label="Run under 'version 2.0' (different random-number algorithm)" checked={v2} onChange={setV2} hint="Stands in for a software update that changes the generator or the sampling algorithm." />
        </div>
        <Button onClick={run}><Play className="h-4 w-4" /> Run analysis</Button>
        {runs.length > 0 && (
          <DataTable
            head={['Run', 'Seed', 'Version', '95% CI']}
            align={['r', 'l', 'l', 'r']}
            rows={runs.map((r) => [r.id, r.seeded ? r.seed : <span className="text-muted-foreground">none ({r.seed})</span>, r.version, `${fmt(r.lo, 3)} to ${fmt(r.hi, 3)}`])}
          />
        )}
        <p className="text-sm text-muted-foreground">
          Run several times: without a seed, the third decimal changes each time. With a seed, results repeat exactly, but only under the same version. Toggle "version 2.0":
          same seed, different numbers.
        </p>
      </Lab>
      <Callout kind="warning" title="A seed is not enough on its own">
        R 3.6.0 changed the default algorithm of <code>sample()</code>, so <code>set.seed(1); sample(10)</code> gives different results before and after that release; old
        results can be recovered with <code>RNGkind(sample.kind = &quot;Rounding&quot;)</code>. Record the RNG kind and lock package versions. Parallel code needs reproducible
        parallel streams.
      </Callout>
      <Code
        r={`set.seed(2025)                 # once, at the top of each script\nRNGkind()                      # record generator + sampling algorithm\nlibrary(future.apply)          # reproducible parallel streams:\nfuture_lapply(1:100, f, future.seed = TRUE)\nmice::mice(dat, m = 40, seed = 2025)   # many functions take their own seed\nsessionInfo()                  # versions, for the supplement`}
        py={`import numpy as np\nrng = np.random.default_rng(2025)          # modern Generator API (not np.random.seed)\nchild_rngs = [np.random.default_rng(s) for s in np.random.SeedSequence(2025).spawn(8)]  # parallel\n# scikit-learn: pass random_state everywhere randomness occurs\nfrom sklearn.model_selection import StratifiedKFold\ncv = StratifiedKFold(n_splits=10, shuffle=True, random_state=2025)`}
      />
      <Takeaways
        items={[
          'Reproducible = same data + same code → same numbers. It is the minimum standard.',
          'Seed every random process; record the RNG kind and package versions.',
          'Use NumPy\'s Generator API (default_rng), not the legacy global seed.',
          'Re-run from a clean session before you report.',
        ]}
      />
      <CheckYourself ids={['rp-defs', 'rp-seed']} />
    </div>
  );
}
