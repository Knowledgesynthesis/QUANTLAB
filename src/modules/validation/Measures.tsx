import { useMemo, useState } from 'react';
import { cohort, generateCohort, type Admission } from '@/data/cohort';
import { fitLogistic, auc, brier, calibration, calibrationCurve, calibrationGroups, netBenefit, netBenefitTreatAll, logistic, linearPredictor, mean } from '@/lib/stats';
import { Plot, Line, Dots, HRule, HoverLayer } from '@/components/plot/Plot';
import { Callout, Code, DataTable, Legend, SliderField, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { fmt, pct } from '@/lib/utils';

const design = (rows: Admission[]) => rows.map((r) => [1, (r.age - 65) / 10, r.diabetes, Math.log(r.los_days), r.hemoglobin - 13.5, r.smoking === 'current' ? 1 : 0, Math.log(r.creatinine)]);
const NAMES = ['(Intercept)', 'Age (per 10 y)', 'Diabetes', 'log LOS', 'Hemoglobin', 'Current smoker', 'log creatinine'];

export default function Measures() {
  const [slopeK, setSlopeK] = useState(1);
  const [shift, setShift] = useState(0);
  const base = useMemo(() => {
    const dev = cohort();
    const val = generateCohort(1500, 'validation-2025');
    const fit = fitLogistic(design(dev), dev.map((r) => r.readmit_30d), NAMES);
    const lp = linearPredictor(fit.coef, design(val));
    return { fit, lp, y: val.map((r) => r.readmit_30d) };
  }, []);
  const p = base.lp.map((v) => logistic(slopeK * v + shift));
  const y = base.y;
  const cal = calibration(y, p);
  const curve = calibrationCurve(y, p, 0.6);
  const groups = calibrationGroups(y, p, 10);
  const thresholds = Array.from({ length: 40 }, (_, i) => 0.01 + i * 0.0125);
  const nbModel = thresholds.map((t) => ({ x: t, y: netBenefit(y, p, t) }));
  const nbAll = thresholds.map((t) => ({ x: t, y: netBenefitTreatAll(y, t) }));
  const prev = mean(y);

  return (
    <div>
      <P>
        A risk model is judged on three things <Cite ids="steyerberg2019,vancalster2019" />: <strong>discrimination</strong> (does it rank patients with the outcome above
        those without?), <strong>calibration</strong> (are predicted risks numerically right?), and <strong>clinical utility</strong> (does using it improve decisions?). They
        can disagree completely.
      </P>
      <Lab title="Performance lab" description={`30-day readmission model developed in the cohort and applied to 1,500 new patients (observed rate ${pct(prev)}). Distort its predictions on the logit scale.`}>
        <div className="grid gap-5 sm:grid-cols-2">
          <SliderField label="Multiply the linear predictor by" value={slopeK} onChange={setSlopeK} min={0.3} max={2.5} step={0.05} format={(v) => `×${v.toFixed(2)}`} hint="> 1 makes predictions more extreme, as overfitting does." />
          <SliderField label="Shift the intercept by" value={shift} onChange={setShift} min={-1.5} max={1.5} step={0.05} format={(v) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))} hint="Mimics a setting with a different baseline risk." />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="C-statistic (AUC)" value={fmt(auc(y, p), 3)} sub="ranking only" />
          <Stat label="Calibration slope" value={fmt(cal.slope, 2)} sub="ideal 1" tone={Math.abs(cal.slope - 1) > 0.15 ? 'critical' : 'good'} />
          <Stat label="Calibration-in-the-large" value={fmt(cal.citl, 2)} sub={`ideal 0 · O/E ${fmt(cal.oe, 2)}`} tone={Math.abs(cal.citl) > 0.15 ? 'critical' : 'good'} />
          <Stat label="Brier score" value={fmt(brier(y, p), 4)} sub={`no-skill ${fmt(prev * (1 - prev), 4)}`} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-medium">Calibration plot</p>
            <Plot height={250} xDomain={[0, 0.8]} yDomain={[0, 0.8]} xLabel="Predicted risk" yLabel="Observed proportion" ariaLabel="Calibration plot: LOWESS curve and decile groups against the diagonal" aspect={1}>
              <Line points={[{ x: 0, y: 0 }, { x: 0.8, y: 0.8 }]} color="var(--axis)" dash="5 4" width={1.5} />
              <Line points={curve} color="var(--series-1)" />
              <Dots points={groups.map((g) => ({ x: g.predicted, y: g.observed }))} color="var(--series-2)" r={4.5} />
              <HoverLayer points={groups.map((g) => ({ x: g.predicted, y: g.observed, g }))} render={(q) => <span>{q.g.n} patients: predicted {pct(q.g.predicted)}, observed {pct(q.g.observed)}</span>} />
            </Plot>
            <Legend items={[{ color: 'var(--series-1)', label: 'LOWESS calibration curve', shape: 'line' }, { color: 'var(--series-2)', label: 'Decile groups' }]} />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium">Decision curve</p>
            <Plot height={250} xDomain={[0, 0.5]} yDomain={[-0.05, Math.max(0.1, prev * 1.1)]} xLabel="Risk threshold for intervention" yLabel="Net benefit" ariaLabel="Decision curve: net benefit of the model, treat all and treat none">
              <HRule y={0} dash="" color="var(--axis)" />
              <Line points={nbAll} color="var(--series-3)" />
              <Line points={nbModel} color="var(--series-1)" />
              <HoverLayer points={nbModel} render={(q) => <span>threshold {pct(q.x)}: NB {fmt(q.y, 3)}</span>} />
            </Plot>
            <Legend items={[{ color: 'var(--series-1)', label: 'Model', shape: 'line' }, { color: 'var(--series-3)', label: 'Treat all', shape: 'line' }, { color: 'var(--axis)', label: 'Treat none', shape: 'line' }]} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Move either slider: the C-statistic does not change, because multiplying or shifting the linear predictor preserves the ranking. Calibration shows the damage
          immediately, and the decision curve drops below "treat all" at thresholds where miscalibrated risks lead to wrong decisions.
        </p>
      </Lab>
      <DataTable
        head={['Measure', 'Answers', 'Ideal', 'Blind to']}
        rows={[
          ['C-statistic (AUC)', 'Does the model rank patients correctly?', '1 (0.5 = chance)', 'Calibration; clinical consequences'],
          ['Calibration-in-the-large / O:E', 'Is the average predicted risk right?', 'CITL 0; O:E 1', 'Spread of predictions'],
          ['Calibration slope', 'Are predictions too extreme or too modest?', '1 (< 1: overfitting)', 'Mean risk (assessed separately)'],
          ['Calibration curve', 'Where along the risk range is it off?', 'On the diagonal', 'Needs ≥ a few hundred events to be precise'],
          ['Brier score', 'Overall accuracy of probabilities', '0; compare with prevalence·(1 − prevalence)', 'Hard to interpret alone'],
          ['Net benefit (decision curve)', 'Is acting on the model better than defaults?', 'Above treat-all and treat-none', 'Thresholds outside the clinically relevant range'],
        ]}
      />
      <Callout kind="mistake" title="Reporting only the C-statistic">
        A model can rank well and still predict 30% where the truth is 10%. TRIPOD+AI requires calibration to be reported alongside discrimination <Cite ids="collins2024" />, and
        decision curves show whether the model helps at clinically relevant thresholds <Cite ids="vickers2006,vancalster2018" />.
      </Callout>
      <Code
        r={`library(rms)\nfit <- lrm(readmit ~ rcs(age, 4) + diabetes + log(los) + hb, data = dev, x = TRUE, y = TRUE)\np_val <- predict(fit, newdata = val, type = "fitted")\nval.prob(p_val, val$readmit)          # C, calibration slope/intercept, Brier, curve\nlibrary(dcurves)\ndca(readmit ~ p_val, data = transform(val, p_val = p_val), thresholds = seq(0, .5, .01)) |> plot()`}
        py={`from sklearn.metrics import roc_auc_score, brier_score_loss\nimport statsmodels.api as sm, numpy as np\nlp = np.log(p_val / (1 - p_val))\nslope = sm.Logit(y_val, sm.add_constant(lp)).fit(disp=0).params[1]\ncitl = sm.GLM(y_val, np.ones_like(lp), family=sm.families.Binomial(), offset=lp).fit().params[0]\nroc_auc_score(y_val, p_val), brier_score_loss(y_val, p_val)`}
      />
      <Takeaways
        items={[
          'Discrimination, calibration and utility answer different questions; report all three.',
          'AUC is invariant to monotone distortions, so it cannot detect miscalibration.',
          'Calibration slope < 1 signals overfitting; CITL ≠ 0 signals a different baseline risk.',
          'Decision curves show whether the model improves decisions at realistic thresholds.',
        ]}
      />
      <CheckYourself ids={['va-auc-calib', 'va-slope', 'va-dca']} />
    </div>
  );
}
