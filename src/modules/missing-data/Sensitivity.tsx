import { useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { Rng } from '@/lib/stats';
import { Plot, Line, Band, Dots, HRule, VRule, HoverLayer } from '@/components/plot/Plot';
import { Button, Callout, Code, DataTable, Legend, SliderField, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { fmt } from '@/lib/utils';
import { analyse, generate, TRUTH } from './sim';

export default function Sensitivity() {
  const [strength, setStrength] = useState(4);
  const [seed, setSeed] = useState(1);
  const [delta, setDelta] = useState(0);
  const deltas = useMemo(() => Array.from({ length: 17 }, (_, i) => -2 + i * 0.5), []);
  const curve = useMemo(() => {
    const rng = new Rng(`delta-${seed}-${strength}`);
    const d = generate(500, 'MNAR', 0.35, strength, rng);
    const cc = analyse(d, 'cca', rng);
    const pts = deltas.map((dl) => {
      const r = analyse(d, 'mi', new Rng(`delta-mi-${seed}-${strength}`), 20, dl);
      return { delta: dl, est: r.mean.est, lo: r.mean.lo, hi: r.mean.hi, beta: r.beta.est };
    });
    const missingMean = d.bmi.filter((_, i) => d.missing[i]).reduce((s, v, _, a) => s + v / a.length, 0);
    const observedMean = d.bmi.filter((_, i) => !d.missing[i]).reduce((s, v, _, a) => s + v / a.length, 0);
    return { pts, cc, nMiss: d.missing.filter(Boolean).length, missingMean, observedMean };
  }, [seed, strength, deltas]);
  const tipping = curve.pts.find((p) => p.hi >= TRUTH.bmiMean - 1e-9 && p.lo <= TRUTH.bmiMean);
  const cur = curve.pts.reduce((best, p) => (Math.abs(p.delta - delta) < Math.abs(best.delta - delta) ? p : best), curve.pts[0]);
  const ys = curve.pts.flatMap((p) => [p.lo, p.hi]).concat(TRUTH.bmiMean);

  return (
    <div>
      <P>
        If data may be MNAR, no analysis of the observed data alone can give an unbiased answer. The recommended response is a <strong>sensitivity analysis</strong>: keep a
        principled primary analysis (usually MI under MAR), then ask how far the unobserved values would have to depart from MAR to change the conclusion
        <Cite ids="cro2020,carpenter2013" />.
      </P>
      <h2 className="mt-6 mb-3 text-lg font-semibold">Delta adjustment</h2>
      <P>
        Impute under MAR, then shift every imputed value by δ (here in kg/m²): δ &gt; 0 says patients with missing BMI have higher BMI than similar observed patients. Analyse
        and pool as usual, across a range of δ. The δ at which the conclusion flips is the <strong>tipping point</strong>; the question becomes whether a departure that large
        is clinically plausible.
      </P>

      <Lab
        title="Tipping-point analysis"
        description="Simulated MNAR data (n = 500, 35% missing): patients with higher BMI were more likely not to have it recorded."
        actions={<Button size="sm" variant="outline" onClick={() => setSeed((s) => s + 1)}><Shuffle className="h-4 w-4" /> New dataset</Button>}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SliderField label="Strength of MNAR (odds ratio per SD of BMI)" value={strength} onChange={setStrength} min={1} max={8} step={0.5} format={(v) => `${v}×`} />
          <SliderField label="Sensitivity parameter δ (kg/m²)" value={delta} onChange={setDelta} min={-2} max={6} step={0.5} format={(v) => (v > 0 ? `+${v}` : `${v}`)} />
        </div>
        <Plot height={260} xDomain={[-2, 6]} yDomain={[Math.min(...ys) - 0.3, Math.max(...ys) + 0.3]} xLabel="δ added to imputed BMI values (kg/m²)" yLabel="Pooled mean BMI" ariaLabel="Pooled mean BMI with 95% CI as a function of the delta adjustment">
          <Band points={curve.pts.map((p) => ({ x: p.delta, lo: p.lo, hi: p.hi }))} />
          <Line points={curve.pts.map((p) => ({ x: p.delta, y: p.est }))} />
          <HRule y={TRUTH.bmiMean} color="var(--good)" dash="" width={2} label="true mean 28" />
          <VRule x={0} label="MAR" />
          {tipping && <VRule x={tipping.delta} color="var(--series-2)" label="tipping point" labelPos="bottom" />}
          <Dots points={[{ x: cur.delta, y: cur.est, r: 6, color: 'var(--series-2)' }]} />
          <HoverLayer points={curve.pts.map((p) => ({ x: p.delta, y: p.est, p }))} render={({ p }) => <span className="tabular">δ = {p.delta}: {fmt(p.est, 2)} ({fmt(p.lo, 2)} to {fmt(p.hi, 2)})</span>} />
        </Plot>
        <Legend items={[{ color: 'var(--series-1)', label: 'Pooled estimate ± 95% CI', shape: 'line' }, { color: 'var(--good)', label: 'Truth (known only in simulation)', shape: 'line' }]} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Complete cases" value={fmt(curve.cc.mean.est, 2)} />
          <Stat label="MI under MAR (δ = 0)" value={fmt(curve.pts.find((p) => p.delta === 0)!.est, 2)} />
          <Stat label={`MI with δ = ${delta}`} value={fmt(cur.est, 2)} sub={`${fmt(cur.lo, 2)} to ${fmt(cur.hi, 2)}`} />
          <Stat label="Tipping point (CI reaches 28)" value={tipping ? `δ = +${tipping.delta}` : '> +6'} />
        </div>
        <p className="text-sm text-muted-foreground">
          In this simulation the missing patients truly averaged {fmt(curve.missingMean, 1)} kg/m² against {fmt(curve.observedMean, 1)} among the observed. MI under MAR closes part of
          that gap using age and SBP; the rest is MNAR and needs δ. In a real study you would elicit a plausible range of δ from clinicians and report results across it.
        </p>
      </Lab>
      <DataTable
        head={['Approach', 'Idea', 'When']}
        rows={[
          ['Delta adjustment / tipping point', 'Shift imputed values by δ; find where conclusions change', 'Continuous or binary variables; simple to communicate'],
          ['Reference-based MI (jump-to-reference, copy-reference)', 'Impute dropouts using the control arm\'s trajectory', 'Randomized trials with treatment discontinuation'],
          ['Selection / pattern-mixture models', 'Model the missingness process jointly with the outcome', 'Specialist analyses; strong untestable assumptions'],
        ]}
      />
      <Callout kind="report" title="Reporting template (TARMOS framework)">
        "Missing data: BMI was missing for 35% of patients and was more often missing in older patients and at site C. The primary analysis used multiple imputation by chained
        equations (40 imputations, predictive mean matching) including the outcome and [auxiliary variables], assuming MAR. Sensitivity to MNAR was assessed by delta-adjusted
        imputation (δ from −2 to +6 kg/m²); conclusions were unchanged unless missing BMI values were on average more than X kg/m² higher than in comparable observed patients."
        <Cite ids="lee2021" />
      </Callout>
      <Code
        r={`library(mice)\ndeltas <- seq(-2, 6, by = 1)\nres <- lapply(deltas, function(d) {\n  post <- make.post(dat); post["bmi"] <- paste("imp[[j]][,i] <- imp[[j]][,i] +", d)\n  imp <- mice(dat, m = 40, method = "pmm", post = post, seed = 2025, printFlag = FALSE)\n  summary(pool(with(imp, lm(sbp ~ bmi + age))), conf.int = TRUE)[2, ]\n})\ncbind(delta = deltas, do.call(rbind, res)[, c("estimate", "2.5 %", "97.5 %")])`}
      />
      <Takeaways
        items={[
          'MNAR cannot be detected or fixed from the observed data; it can only be explored.',
          'Delta adjustment states the departure from MAR in clinical units.',
          'Report the tipping point and argue whether that departure is plausible.',
          'Pre-specify the sensitivity analysis in the statistical analysis plan.',
        ]}
      />
      <CheckYourself ids={['md-mnar-plan']} />
    </div>
  );
}
