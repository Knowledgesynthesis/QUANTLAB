import { useMemo, useState } from 'react';
import { binaryOutcomeSampleSize, coxSnellFromC, maxCoxSnellR2 } from '@/lib/stats';
import { Callout, Checkbox, Code, DataTable, SliderField, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { fmt, pct } from '@/lib/utils';

export default function SampleSize() {
  const [prev, setPrev] = useState(0.2);
  const [params, setParams] = useState(12);
  const [useC, setUseC] = useState(true);
  const [cstat, setCstat] = useState(0.75);
  const [r2, setR2] = useState(0.1);
  const r2cs = useMemo(() => (useC ? coxSnellFromC(cstat, prev) : r2), [useC, cstat, prev, r2]);
  const res = binaryOutcomeSampleSize({ parameters: params, prevalence: prev, coxSnellR2: r2cs });
  const epp10 = Math.ceil((10 * params) / prev);

  return (
    <div>
      <P>
        Most clinical prediction models are developed in samples too small to support their number of candidate parameters, which is why they overfit and fail at
        validation. The "10 events per variable" rule has no general justification <Cite ids="vansmeden2016" />. Riley and colleagues derived the minimum sample size from
        three explicit targets <Cite ids="riley2020" />:
      </P>
      <DataTable
        head={['Criterion', 'Target']}
        rows={[
          ['1. Small overfitting', 'Expected uniform shrinkage factor ≥ 0.9 (≤ 10% overfitting of predictor effects)'],
          ['2. Small optimism in model fit', 'Apparent and adjusted Nagelkerke R² differ by ≤ 0.05'],
          ['3. Precise overall risk', 'Mean outcome risk estimated within ± 0.05'],
        ]}
      />
      <Lab title="Sample-size calculator (binary outcome)" description="Reproduces pmsampsize for binary outcomes.">
        <div className="grid gap-5 sm:grid-cols-2">
          <SliderField label="Anticipated outcome proportion" value={prev} onChange={setPrev} min={0.02} max={0.5} step={0.01} format={(v) => pct(v)} />
          <SliderField label="Candidate predictor parameters" value={params} onChange={setParams} min={1} max={60} hint="Count every df: dummies, spline terms, and every candidate considered, not only those finally kept." />
          <div className="space-y-2">
            <Checkbox label="Derive R² from an anticipated C-statistic" checked={useC} onChange={setUseC} hint="E.g., the C of an existing model for the same outcome, ideally adjusted for optimism." />
            {useC ? (
              <SliderField label="Anticipated C-statistic" value={cstat} onChange={setCstat} min={0.55} max={0.95} step={0.01} format={(v) => v.toFixed(2)} />
            ) : (
              <SliderField label="Anticipated Cox–Snell R²" value={r2} onChange={setR2} min={0.01} max={Math.min(0.6, maxCoxSnellR2(prev) * 0.95)} step={0.005} format={(v) => v.toFixed(3)} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 self-start">
            <Stat label="Cox–Snell R² used" value={fmt(r2cs, 3)} sub={`max possible ${fmt(res.maxR2cs, 3)}`} />
            <Stat label="Nagelkerke R²" value={fmt(r2cs / res.maxR2cs, 3)} />
          </div>
        </div>
        <DataTable
          head={['Criterion', 'Required n']}
          align={['l', 'r']}
          rows={[
            ['1. Shrinkage ≥ 0.9', <span className={res.binding === 1 ? 'font-semibold' : ''}>{res.criterion1.toLocaleString()}</span>],
            ['2. Optimism in R² ≤ 0.05', <span className={res.binding === 2 ? 'font-semibold' : ''}>{res.criterion2.toLocaleString()}</span>],
            ['3. Overall risk ± 0.05', <span className={res.binding === 3 ? 'font-semibold' : ''}>{res.criterion3.toLocaleString()}</span>],
          ]}
        />
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Minimum sample size" value={res.n.toLocaleString()} sub={`criterion ${res.binding} binds`} />
          <Stat label="Events" value={res.events.toLocaleString()} />
          <Stat label="Events per parameter" value={fmt(res.epp, 1)} sub={`"10 EPV" would say n = ${epp10.toLocaleString()}`} />
        </div>
        <p className="text-sm text-muted-foreground">
          Weaker anticipated signal (lower C or R²) demands more data: shrinkage is worse when there is less signal to estimate. The EPP that results varies widely, which is why
          a single EPV rule cannot be right.
        </p>
      </Lab>
      <h2 className="mt-8 mb-3 text-lg font-semibold">External validation and model updating</h2>
      <P>
        External validation tests the model in data from a different setting, period or population. Calibration is the usual casualty: different baseline risk shifts CITL;
        different case-mix or measurement changes the slope. Validation studies need enough events to estimate calibration precisely, typically several hundred; precision-based
        sample-size methods are available (pmvalsampsize) <Cite ids="riley2024" />.
      </P>
      <DataTable
        head={['Finding at validation', 'Usual update']}
        rows={[
          ['CITL ≠ 0, slope ≈ 1', 'Re-estimate the intercept (recalibration-in-the-large)'],
          ['Slope ≠ 1', 'Logistic recalibration: re-estimate intercept and a common slope'],
          ['Specific predictors behave differently', 'Model revision: re-estimate selected coefficients (needs more data)'],
          ['Poor discrimination', 'Consider a new model or added predictors; recalibration cannot fix ranking'],
        ]}
      />
      <Callout kind="report" title="Sample size statement">
        "Assuming an outcome proportion of {pct(prev)}, up to {params} candidate parameters and an anticipated C-statistic of {cstat.toFixed(2)} (Cox–Snell R² {fmt(r2cs, 3)}), the minimum
        sample size was {res.n.toLocaleString()} ({res.events} events) by the criteria of Riley et al. (pmsampsize)." Report the assumptions; reviewers check them.
      </Callout>
      <Code
        r={`library(pmsampsize)\npmsampsize(type = "b", cstatistic = 0.75, parameters = 12, prevalence = 0.2)\n# or with an anticipated Cox–Snell R²:\npmsampsize(type = "b", csrsquared = 0.10, parameters = 12, prevalence = 0.2)`}
        py={`# pip install pmsampsize\nfrom pmsampsize.pmsampsize import pmsampsize\npmsampsize(type="b", cstatistic=0.75, parameters=12, prevalence=0.2)`}
      />
      <Takeaways
        items={[
          'Base development sample size on the Riley criteria, not on events-per-variable rules.',
          'Count all candidate parameters, including those you might drop.',
          'Expect calibration to need updating in new settings; plan validation with enough events.',
          'State the sample-size assumptions explicitly in the protocol and paper.',
        ]}
      />
      <CheckYourself ids={['va-external']} />
    </div>
  );
}
