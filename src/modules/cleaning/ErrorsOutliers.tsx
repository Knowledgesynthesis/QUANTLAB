import { useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { Rng, mean, sd, median, mad, quantile } from '@/lib/stats';
import { Plot, Dots, VRule, HoverLayer, extent } from '@/components/plot/Plot';
import { Button, Callout, DataTable, Legend, Segmented, SliderField, Code } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways, Ul } from '@/components/learning';
import { fmt } from '@/lib/utils';

interface Obs { value: number; error: boolean; jitter: number }

function makeData(nErrors: number, seed: number): Obs[] {
  const rng = new Rng(`outliers-${seed}`);
  // Triglycerides (mg/dL): right-skewed, log-normal with median 130.
  const obs: Obs[] = Array.from({ length: 240 }, () => ({ value: Math.round(Math.exp(rng.normal(Math.log(130), 0.45))), error: false, jitter: rng.uniform() }));
  for (let i = 0; i < nErrors; i++) {
    // Entry error: an extra digit (×10).
    const v = Math.round(Math.exp(rng.normal(Math.log(130), 0.3))) * 10;
    obs.push({ value: v, error: true, jitter: rng.uniform() });
  }
  return obs;
}

type Rule = 'z' | 'iqr' | 'mad';
const ruleLabel: Record<Rule, string> = { z: '|z| > 3 (mean ± 3 SD)', iqr: 'Tukey fences (Q3 + 1.5·IQR)', mad: 'Modified z > 3.5 (median, MAD)' };

function bounds(vals: number[], rule: Rule): [number, number] {
  if (rule === 'z') { const m = mean(vals), s = sd(vals); return [m - 3 * s, m + 3 * s]; }
  if (rule === 'iqr') { const q1 = quantile(vals, 0.25), q3 = quantile(vals, 0.75); return [q1 - 1.5 * (q3 - q1), q3 + 1.5 * (q3 - q1)]; }
  const m = median(vals), d = mad(vals); return [m - 3.5 * d, m + 3.5 * d];
}

export default function ErrorsOutliers() {
  const [nErr, setNErr] = useState(6);
  const [seed, setSeed] = useState(1);
  const [scale, setScale] = useState<'raw' | 'log'>('raw');
  const data = useMemo(() => makeData(nErr, seed), [nErr, seed]);
  const tf = (v: number) => (scale === 'log' ? Math.log10(v) : v);
  const vals = data.map((d) => tf(d.value));
  const rules: Rule[] = ['z', 'iqr', 'mad'];
  const res = rules.map((r) => {
    const [lo, hi] = bounds(vals, r);
    const flagged = data.map((_, i) => vals[i] < lo || vals[i] > hi);
    const caught = data.filter((d, i) => d.error && flagged[i]).length;
    const falsePos = data.filter((d, i) => !d.error && flagged[i]).length;
    return { r, lo, hi, caught, falsePos };
  });
  const colors: Record<Rule, string> = { z: 'var(--series-1)', iqr: 'var(--series-3)', mad: 'var(--series-4)' };
  const pts = data.map((d, i) => ({ x: vals[i], y: d.jitter, color: d.error ? 'var(--series-2)' : 'var(--subtle-foreground)', r: d.error ? 5 : 3, opacity: d.error ? 0.95 : 0.45, d }));

  return (
    <div>
      <P>
        An <strong>error</strong> is a value that cannot be true: impossible, internally inconsistent, or produced by a unit or entry mistake. An <strong>outlier</strong> is
        merely unusual. Errors are corrected or set to missing; outliers are real data and stay, unless you can show they are errors
        <Cite ids="vandenbroeck2005" />. Statistical rules can only <em>flag</em> candidates for review. They cannot tell the two apart.
      </P>
      <Ul>
        <li><strong>Hard limits</strong> (biologically impossible): catch errors with certainty. Write them in the data dictionary.</li>
        <li><strong>Soft limits</strong> (unusual): flag for verification against the source.</li>
        <li><strong>Distributional rules</strong> (z-scores, IQR, MAD): useful for screening, each with different weaknesses.</li>
      </Ul>

      <Lab
        title="Outlier rules lab"
        description="240 triglyceride values (right-skewed) plus planted entry errors (an extra digit). Orange = planted error."
        actions={<Button size="sm" variant="outline" onClick={() => setSeed((s) => s + 1)}><Shuffle className="h-4 w-4" /> New sample</Button>}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SliderField label="Planted entry errors" value={nErr} onChange={setNErr} min={0} max={20} />
          <Segmented label="Scale used for the rule" value={scale} onChange={setScale} options={[{ value: 'raw', label: 'Raw mg/dL' }, { value: 'log', label: 'log₁₀' }]} />
        </div>
        <Plot height={200} xDomain={extent(vals, 0.04)} yDomain={[-0.05, 1.05]} yTicks={[]} xLabel={scale === 'log' ? 'log₁₀ triglycerides' : 'Triglycerides (mg/dL)'} ariaLabel="Strip plot of values with the upper cut-off of each rule" grid={false}>
          <Dots points={pts} />
          {res.map((x) => <VRule key={x.r} x={x.hi} color={colors[x.r]} dash="5 3" width={2} />)}
          <HoverLayer points={pts} render={(p) => <span>{p.d.value} mg/dL {p.d.error ? '· planted error' : ''}</span>} />
        </Plot>
        <Legend items={[{ color: 'var(--series-2)', label: 'Planted error' }, { color: 'var(--subtle-foreground)', label: 'Genuine value' }, ...rules.map((r) => ({ color: colors[r], label: `${ruleLabel[r]} cut-off`, shape: 'line' as const, dashed: true }))]} />
        <DataTable
          head={['Rule', 'Upper cut-off', 'Errors caught', 'Genuine values flagged']}
          align={['l', 'r', 'r', 'r']}
          rows={res.map((x) => [
            ruleLabel[x.r],
            scale === 'log' ? `${fmt(10 ** x.hi, 0)} mg/dL` : `${fmt(x.hi, 0)} mg/dL`,
            <span className={x.caught < nErr ? 'font-semibold text-critical-text' : 'text-good-text'}>{x.caught} / {nErr}</span>,
            <span className={x.falsePos > 3 ? 'font-semibold text-warning-text' : ''}>{x.falsePos}</span>,
          ])}
        />
        <p className="text-sm text-muted-foreground">
          Push the errors to 15–20 on the raw scale: the SD rule's cut-off climbs with the errors and stops catching them (<strong>masking</strong>). On the raw scale the
          IQR rule flags many genuine high values because the distribution is skewed; on the log scale, both robust rules separate errors from real values far better.
        </p>
      </Lab>

      <Callout kind="key" title="Why the SD rule fails">
        The mean and SD are not robust: the errors pull them toward themselves, so the rule they define becomes too lenient exactly when errors are most numerous.
        Median and MAD are barely moved by a few extreme values <Cite ids="leys2013,iglewicz1993" />.
      </Callout>

      <h2 className="mt-8 mb-3 text-lg font-semibold">What to do with what you find</h2>
      <DataTable
        head={['Finding', 'Action']}
        rows={[
          ['Impossible (SBP 1,300; BMI 2.7; Hb 140 g/dL)', 'Correct from source (unit/decimal slip) with a documented rule, or set to missing.'],
          ['Implausible but possible', 'Verify against the source record. If confirmed, keep.'],
          ['Extreme but real', 'Keep. Choose a model that copes (log scale, robust regression, splines); report a sensitivity analysis.'],
          ['Unverifiable and influential', 'Primary analysis with the value; sensitivity analysis without. Report both.'],
        ]}
      />
      <Callout kind="warning" title="Winsorizing is not cleaning">
        Capping values at a percentile replaces real measurements with invented ones and changes what is estimated. If you use it, declare it in advance as a
        sensitivity analysis; never use it to "fix" errors.
      </Callout>
      <Code
        r={`x <- dat$triglycerides\nmz <- (x - median(x)) / mad(x)          # mad() is scaled by 1.4826\nflag_mad <- abs(mz) > 3.5\nflag_iqr <- x > quantile(x, .75) + 1.5 * IQR(x)\nsubset(dat, flag_mad)                    # review these against the source`}
        py={`from scipy.stats import median_abs_deviation\nx = dat["triglycerides"]\nmz = (x - x.median()) / median_abs_deviation(x, scale="normal")\nflag_mad = mz.abs() > 3.5\nq1, q3 = x.quantile([.25, .75])\nflag_iqr = x > q3 + 1.5 * (q3 - q1)\ndat[flag_mad]                            # review these against the source`}
      />
      <Takeaways
        items={[
          'Errors are fixed or set missing; outliers are kept and handled in modelling.',
          'SD-based rules are masked by the very values they should catch; use median/MAD.',
          'Apply distributional rules on a scale where the data are roughly symmetric.',
          'Rules flag; humans verify against the source. Log every decision.',
        ]}
      />
      <CheckYourself ids={['cl-masking', 'cl-winsor']} />
    </div>
  );
}
