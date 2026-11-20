import { useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import { Rng, fitOLS, mean, sd } from '@/lib/stats';
import { Plot, Dots, HRule, VRule } from '@/components/plot/Plot';
import { Button, Callout, DataTable, Formula, SliderField, Stat } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { fmt } from '@/lib/utils';

function simulate(rho: number, n: number, seed: number) {
  const rng = new Rng(`collin-${rho}-${n}-${seed}`);
  const reps = 300;
  const b1: number[] = [], b2: number[] = [], se1: number[] = [], rmseSame: number[] = [], rmseNew: number[] = [];
  const draw = (r: number) => {
    const x1 = rng.normal();
    return [x1, r * x1 + Math.sqrt(1 - r * r) * rng.normal()];
  };
  for (let k = 0; k < reps; k++) {
    const X = Array.from({ length: n }, () => draw(rho));
    const y = X.map(([a, b]) => 1 + a + b + rng.normal(0, 2));
    const fit = fitOLS(X.map(([a, b]) => [1, a, b]), y, ['i', 'x1', 'x2']);
    b1.push(fit.coef[1]); b2.push(fit.coef[2]); se1.push(fit.se[1]);
    // Prediction error for 200 new patients: same correlation structure vs a structure where x1, x2 are independent.
    const err = (r: number) => {
      let s = 0;
      for (let j = 0; j < 200; j++) {
        const [a, b] = draw(r);
        const truth = 1 + a + b;
        s += (fit.coef[0] + fit.coef[1] * a + fit.coef[2] * b - truth) ** 2;
      }
      return Math.sqrt(s / 200);
    };
    rmseSame.push(err(rho));
    rmseNew.push(err(0));
  }
  const sums = b1.map((v, i) => v + b2[i]);
  return { b1, b2, sdB1: sd(b1), meanB1: mean(b1), meanSE: mean(se1), sdSum: sd(sums), rmseSame: mean(rmseSame), rmseNew: mean(rmseNew) };
}

export default function Concept() {
  const [rho, setRho] = useState(0.9);
  const [n, setN] = useState(100);
  const [seed, setSeed] = useState(1);
  const s = useMemo(() => simulate(rho, n, seed), [rho, n, seed]);
  const vifTheory = 1 / (1 - rho * rho);
  const s0 = useMemo(() => simulate(0, n, seed), [n, seed]);

  return (
    <div>
      <P>
        Collinearity means predictors carry overlapping information. The data then contain little information about the effect of one predictor <em>holding the other
        fixed</em>, because they rarely vary independently. Goldberger called it "micronumerosity": it behaves like a small sample for those comparisons
        <Cite ids="belsley1980,obrien2007" />.
      </P>
      <Formula note="Variance of a coefficient: residual variance, sample size, spread of xⱼ – and the VIF">Var(β̂ⱼ) = σ² / ((n − 1)·Var(xⱼ)) × 1/(1 − R²ⱼ)    where VIFⱼ = 1/(1 − R²ⱼ)</Formula>

      <Lab
        title="Collinearity simulator"
        description="300 datasets from y = 1 + 1·x₁ + 1·x₂ + ε, where corr(x₁, x₂) = ρ. Each dot is one dataset's pair of estimates."
        actions={<Button size="sm" variant="outline" onClick={() => setSeed((v) => v + 1)}><Shuffle className="h-4 w-4" /> Resimulate</Button>}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <SliderField label="Correlation between predictors ρ" value={rho} onChange={setRho} min={0} max={0.99} step={0.01} format={(v) => v.toFixed(2)} />
          <SliderField label="Sample size per dataset" value={n} onChange={setN} min={30} max={1000} step={10} />
        </div>
        <Plot height={300} xDomain={[-2, 4]} yDomain={[-2, 4]} xLabel="β̂₁ (truth 1)" yLabel="β̂₂ (truth 1)" ariaLabel="Scatter of the two estimated coefficients across simulated datasets" aspect={1}>
          <VRule x={1} color="var(--good)" dash="" />
          <HRule y={1} color="var(--good)" dash="" />
          <Dots points={s.b1.map((b, i) => ({ x: b, y: s.b2[i] }))} r={3} opacity={0.5} />
        </Plot>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="VIF = 1/(1 − ρ²)" value={fmt(vifTheory, 1)} sub={`SE inflation ×${fmt(Math.sqrt(vifTheory), 2)}`} />
          <Stat label="Mean of β̂₁" value={fmt(s.meanB1, 3)} sub="unbiased: ≈ 1" tone="good" />
          <Stat label="Empirical SD of β̂₁" value={fmt(s.sdB1, 3)} sub={`ρ = 0: ${fmt(s0.sdB1, 3)}; ratio ${fmt(s.sdB1 / s0.sdB1, 2)}`} />
          <Stat label="SD of β̂₁ + β̂₂" value={fmt(s.sdSum, 3)} sub="the joint effect stays precise" />
        </div>
        <DataTable
          head={['Prediction RMSE for new patients', 'Value']}
          align={['l', 'r']}
          rows={[
            ['Same correlation structure as the training data', fmt(s.rmseSame, 3)],
            ['New patients in whom x₁ and x₂ vary independently (extrapolation)', fmt(s.rmseNew, 3)],
          ]}
        />
        <p className="text-sm text-muted-foreground">
          As ρ → 1 the cloud stretches along a line of slope −1: datasets that overestimate β₁ underestimate β₂. Each estimate stays centred on the truth, and the model&apos;s
          SEs correctly report the extra uncertainty (mean SE {fmt(s.meanSE, 3)} vs empirical {fmt(s.sdB1, 3)}). Predictions are fine where the data live, but degrade when new
          patients break the correlation pattern.
        </p>
      </Lab>
      <DataTable
        head={['Collinearity…', 'Yes / No']}
        rows={[
          ['biases coefficients', 'No'],
          ['inflates SEs of the involved coefficients', 'Yes, by √VIF'],
          ['makes the SEs wrong', 'No: they honestly report the imprecision'],
          ['affects the joint effect or overall fit (R², F test)', 'No'],
          ['affects predictions within the observed covariate pattern', 'No'],
          ['affects extrapolation to a different covariate pattern', 'Yes'],
          ['violates a regression assumption', 'Only if exact (perfect collinearity)'],
        ]}
      />
      <Callout kind="key">
        Multicollinearity is a question of <strong>information</strong>, not validity. The remedy depends on the goal (lesson 4); often it is to accept wide intervals or
        ask a different question.
      </Callout>
      <Takeaways
        items={[
          'Collinear predictors leave coefficients unbiased but imprecise; the SEs are honest.',
          'The SE inflation is √VIF; VIF = 1/(1 − ρ²) for two predictors.',
          'Combined effects and predictions inside the data pattern stay precise.',
          'Collinearity resembles a small sample for the contrast you care about.',
        ]}
      />
      <CheckYourself ids={['mc-vif-se', 'mc-what-affected']} />
    </div>
  );
}
