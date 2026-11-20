import { useMemo, useState } from 'react';
import { Rng, fitLogistic } from '@/lib/stats';
import { Callout, DataTable, SliderField, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { fmt } from '@/lib/utils';

function SeparationLab() {
  const [shift, setShift] = useState(3);
  const res = useMemo(() => {
    const rng = new Rng('separation');
    const z0 = Array.from({ length: 20 }, () => rng.normal());
    const z1 = Array.from({ length: 20 }, () => rng.normal());
    // Scale spread down so that a large shift produces complete separation.
    const x = [...z0.map((v) => 0.45 * v), ...z1.map((v) => 0.45 * v + shift)];
    const y = [...z0.map(() => 0), ...z1.map(() => 1)];
    const X = x.map((v) => [1, v]);
    const ml = fitLogistic(X, y, ['(Intercept)', 'x']);
    const fi = fitLogistic(X, y, ['(Intercept)', 'x'], { firth: true });
    const max0 = Math.max(...x.slice(0, 20)), min1 = Math.min(...x.slice(20));
    return { ml, fi, separated: max0 < min1 };
  }, [shift]);
  return (
    <Lab title="Separation in logistic regression" description="40 patients; x shifted between outcome groups. Increase the shift until the groups no longer overlap.">
      <SliderField label="Group separation on x" value={shift} onChange={setShift} min={0} max={4} step={0.1} format={(v) => v.toFixed(1)} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Groups overlap?" value={res.separated ? 'No – separated' : 'Yes'} tone={res.separated ? 'critical' : 'good'} />
        <Stat label="ML slope (SE)" value={fmt(res.ml.coef[1], 1)} sub={`SE ${fmt(res.ml.se[1], 1)}${res.ml.separation ? ' · diverging' : ''}`} tone={res.ml.separation ? 'critical' : undefined} />
        <Stat label="Firth slope (SE)" value={fmt(res.fi.coef[1], 2)} sub={`SE ${fmt(res.fi.se[1], 2)}`} />
        <Stat label="ML iterations" value={res.ml.iterations} sub={res.ml.converged ? 'converged' : 'stopped at limit'} />
      </div>
      <p className="text-sm text-muted-foreground">
        Under complete separation the maximum-likelihood estimate is infinite: software stops after some iterations with an enormous coefficient and SE (R warns "fitted
        probabilities numerically 0 or 1"). Firth&apos;s penalized likelihood gives finite, less biased estimates <Cite ids="firth1993" />.
      </p>
    </Lab>
  );
}

export default function Assumptions() {
  return (
    <div>
      <P>
        Checklists often present regression assumptions as equally important pass/fail items. They are not. Ranked by how much harm a violation does
        <Cite ids="gelman2020" />:
      </P>
      <DataTable
        head={['#', 'Assumption', 'If violated', 'How to check', 'Remedy']}
        rows={[
          ['1', 'Validity: the data answer the question (right outcome, population, measurement)', 'Every estimate answers a different question', 'Design, data dictionary, audit', 'No statistical fix'],
          ['2', 'Representativeness of the sample for the target population', 'Results do not generalize', 'Compare with population data; inclusion flow', 'Weighting, restriction, cautious inference'],
          ['3', 'Linearity and additivity of the mean model', 'Biased coefficients and predictions', 'Residuals vs fitted and vs each predictor; partial residuals', 'Splines, transformations, interactions'],
          ['4', 'Independence of errors', 'SEs too small, often badly', 'Design (clustering, repeated measures, time order)', 'Mixed models, GEE, cluster-robust SEs'],
          ['5', 'Equal variance (homoscedasticity)', 'Coefficients still unbiased; SEs and prediction intervals wrong', 'Residuals vs fitted; scale-location', 'HC3 SEs, WLS, modelling the variance, log/GLM'],
          ['6', 'Normality of errors', 'Matters for prediction intervals and very small samples; coefficient inference is robust in moderate n', 'Q-Q plot of residuals', 'Usually nothing; robust regression if heavy-tailed'],
        ]}
      />
      <Callout kind="mistake" title="&quot;No multicollinearity&quot; is not an assumption">
        OLS requires only that no predictor is an <em>exact</em> linear combination of others. Strong but imperfect correlation leaves estimates unbiased and inference valid;
        it only makes some coefficients imprecise, which the standard errors already report. Module 5 covers it.
      </Callout>
      <Callout kind="key" title="Normality concerns the errors, and matters least">
        Neither the outcome nor the predictors need to be normally distributed. With moderate samples the sampling distribution of the coefficients is approximately normal
        by the central limit theorem, even with skewed errors <Cite ids="lumley2002" />. Testing residuals for normality (e.g., Shapiro–Wilk) in large samples mostly detects
        harmless departures.
      </Callout>
      <h2 className="mt-8 mb-3 text-lg font-semibold">Logistic and other GLMs</h2>
      <DataTable
        head={['Check', 'Why', 'How']}
        rows={[
          ['Linearity on the logit scale', 'Continuous predictors often act non-linearly', 'Restricted cubic splines; compare with linear term'],
          ['Influential observations', 'Few events make estimates fragile', "Cook's D and DFBETAS from the GLM; leave-one-out changes"],
          ['Separation', 'Infinite ML estimates', 'Warnings, huge SEs; use Firth or penalization'],
          ['Overdispersion (count models)', 'Poisson SEs too small', 'Pearson χ²/df; negative binomial or quasi-Poisson'],
          ['Calibration (prediction)', 'Predicted risks must match observed', 'Calibration curve and slope (Module 6)'],
        ]}
      />
      <SeparationLab />
      <Takeaways
        items={[
          'Validity, representativeness, the mean model and independence matter far more than normality.',
          'Heteroscedasticity affects SEs, not coefficients.',
          'Multicollinearity is not an assumption violation.',
          'In logistic regression check functional form, influence and separation.',
        ]}
      />
      <CheckYourself ids={['rg-not-assumption']} />
    </div>
  );
}
