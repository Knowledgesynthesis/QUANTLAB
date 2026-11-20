import { useMemo, useState } from 'react';
import { cohort } from '@/data/cohort';
import { fitOLS, vif, mean } from '@/lib/stats';
import { Callout, Code, DataTable, Segmented } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { cn, fmt, fmtP } from '@/lib/utils';

type Model = 'interaction' | 'quadratic';

export default function Centering() {
  const c = cohort();
  const [model, setModel] = useState<Model>('interaction');
  const res = useMemo(() => {
    const age = c.map((r) => r.age), bmi = c.map((r) => r.bmi), y = c.map((r) => r.sbp);
    const ma = mean(age), mb = mean(bmi);
    const build = (center: boolean) => {
      const a = age.map((v) => (center ? v - ma : v));
      const b = bmi.map((v) => (center ? v - mb : v));
      const cols = model === 'interaction' ? [a, b, a.map((v, i) => v * b[i])] : [a, a.map((v) => v * v)];
      const names = model === 'interaction' ? ['age', 'bmi', 'age × bmi'] : ['age', 'age²'];
      const fit = fitOLS(c.map((_, i) => [1, ...cols.map((col) => col[i])]), y, ['(Intercept)', ...names]);
      return { fit, vifs: vif(cols), names };
    };
    return { raw: build(false), cen: build(true), ma, mb };
  }, [model, c]);
  const { raw, cen } = res;
  const maxPredDiff = Math.max(...raw.fit.fitted.map((f, i) => Math.abs(f - cen.fit.fitted[i])));
  const top = raw.names.length; // index of highest-order term

  return (
    <div>
      <P>
        X and X·Z (or X and X²) are strongly correlated when X and Z are far from zero, so models with interactions or polynomials show large VIFs. A popular remedy is to
        mean-center X and Z first. Centering does lower those VIFs, but it changes nothing about the model&apos;s fit, its predictions, or the inference on the interaction
        (or quadratic) term <Cite ids="echambadi2007" />.
      </P>
      <Lab title="Centering demo" description="Cohort: systolic BP modelled on age and BMI.">
        <Segmented label="Model" value={model} onChange={setModel} options={[{ value: 'interaction', label: 'SBP ~ age + BMI + age × BMI' }, { value: 'quadratic', label: 'SBP ~ age + age²' }]} />
        <DataTable
          head={['Term', 'Uncentred: estimate (SE)', 'p', 'VIF', 'Centred: estimate (SE)', 'p', 'VIF']}
          align={['l', 'r', 'r', 'r', 'r', 'r', 'r']}
          rows={raw.names.map((nm, k) => {
            const same = k === top - 1;
            return [
              <span className={cn(same && 'font-semibold')}>{nm}</span>,
              `${fmt(raw.fit.coef[k + 1], 4)} (${fmt(raw.fit.se[k + 1], 4)})`, fmtP(raw.fit.pValue[k + 1]),
              <span className={cn(raw.vifs[k] > 10 && 'font-semibold text-critical-text')}>{fmt(raw.vifs[k], 1)}</span>,
              `${fmt(cen.fit.coef[k + 1], 4)} (${fmt(cen.fit.se[k + 1], 4)})`, fmtP(cen.fit.pValue[k + 1]),
              <span className={cn(cen.vifs[k] > 10 && 'font-semibold text-critical-text')}>{fmt(cen.vifs[k], 1)}</span>,
            ];
          })}
        />
        <DataTable
          head={['', 'Uncentred', 'Centred']}
          align={['l', 'r', 'r']}
          rows={[
            ['R²', fmt(raw.fit.r2, 6), fmt(cen.fit.r2, 6)],
            ['Residual SD', fmt(raw.fit.sigma, 6), fmt(cen.fit.sigma, 6)],
            ['Largest difference in any fitted value', '', fmt(maxPredDiff, 10)],
          ]}
        />
        <p className="text-sm text-muted-foreground">
          The highest-order term ({raw.names[top - 1]}) has the same estimate, SE and p-value. R², residual SD and every prediction are identical. Only the lower-order
          coefficients changed, because they now mean something else: in the centred model, the age coefficient is the effect of age at the mean BMI ({fmt(res.mb, 1)}) instead
          of at BMI = 0, a value no patient has.
        </p>
      </Lab>
      <Callout kind="key" title="Centering is about interpretation">
        Centre (or choose a meaningful reference value) so that lower-order terms describe effects at realistic values, for example age at 65 years or BMI at 25. Do it for
        interpretability, not to "fix" collinearity. The same holds for standardizing: it rescales coefficients and changes nothing else.
      </Callout>
      <Code
        r={`dat$age_c <- dat$age - 65; dat$bmi_c <- dat$bmi - 25    # meaningful references\nfit <- lm(sbp ~ age_c * bmi_c, data = dat)\n# Compare: identical fit, identical interaction test\nanova(lm(sbp ~ age * bmi, dat), fit)`}
        py={`dat = dat.assign(age_c=dat.age - 65, bmi_c=dat.bmi - 25)\nfit_c = smf.ols("sbp ~ age_c * bmi_c", dat).fit()\nfit_u = smf.ols("sbp ~ age * bmi", dat).fit()\nnp.allclose(fit_c.fittedvalues, fit_u.fittedvalues)   # True`}
      />
      <Takeaways
        items={[
          'Centering lowers VIFs of lower-order terms in interaction or polynomial models.',
          'It does not change the fit, predictions, or the highest-order term\'s estimate, SE and p.',
          'Lower-order coefficients change meaning: effects at the centring value.',
          'Centre at clinically meaningful values for interpretation.',
        ]}
      />
      <CheckYourself ids={['mc-centering']} />
    </div>
  );
}
