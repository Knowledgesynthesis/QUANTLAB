import { Callout, DataTable, Formula } from '@/components/ui';
import { CheckYourself, Cite, P, Takeaways, Ul } from '@/components/learning';

function Dag({ mech }: { mech: 'MCAR' | 'MAR' | 'MNAR' }) {
  // R = missingness indicator of BMI; arrows show what R depends on.
  const node = (x: number, y: number, label: string, sub?: string, dashed?: boolean) => (
    <g>
      <rect x={x - 46} y={y - 20} width={92} height={40} rx={10} fill="var(--card)" stroke="var(--border)" strokeDasharray={dashed ? '4 3' : undefined} strokeWidth={1.5} />
      <text x={x} y={y - 2} textAnchor="middle" className="fill-[var(--foreground)] text-[12px] font-semibold">{label}</text>
      {sub && <text x={x} y={y + 12} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[10px]">{sub}</text>}
    </g>
  );
  const arrow = (x1: number, y1: number, x2: number, y2: number, color = 'var(--series-2)') => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} markerEnd={`url(#ah-${mech})`} />
  );
  return (
    <svg viewBox="0 0 300 150" className="w-full max-w-[300px]" role="img" aria-label={`${mech}: what the missingness of BMI depends on`}>
      <defs>
        <marker id={`ah-${mech}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--series-2)" />
        </marker>
      </defs>
      {node(60, 30, 'Age', 'observed')}
      {node(240, 30, 'BMI', 'partly missing', true)}
      {node(150, 120, 'R', 'BMI missing?')}
      {mech === 'MAR' && arrow(80, 50, 132, 100)}
      {mech === 'MNAR' && arrow(220, 50, 168, 100)}
      {mech === 'MCAR' && <text x={150} y={80} textAnchor="middle" className="fill-[var(--muted-foreground)] text-[11px]">no arrows into R</text>}
    </svg>
  );
}

export default function Mechanisms() {
  return (
    <div>
      <P>
        Rubin&apos;s classification <Cite ids="rubin1976" /> is about <strong>what the probability of a value being missing depends on</strong>. It is a property of the
        data-collection process <em>relative to the variables you analyse</em>, not of the dataset alone. Let R be the indicator that BMI is missing.
      </P>
      <div className="grid gap-4 sm:grid-cols-3">
        {(['MCAR', 'MAR', 'MNAR'] as const).map((m) => (
          <figure key={m} className="rounded-xl border bg-card p-3">
            <Dag mech={m} />
            <figcaption className="mt-2 text-sm">
              <strong>{m}</strong>:{' '}
              {m === 'MCAR' ? 'R depends on nothing measured or unmeasured.' : m === 'MAR' ? 'R depends only on observed data (here age).' : 'R depends on the missing value itself, even after accounting for observed data.'}
            </figcaption>
          </figure>
        ))}
      </div>
      <Formula note="MAR, formally: given the observed data, missingness carries no further information about the unobserved values">P(R | Y_obs, Y_mis) = P(R | Y_obs)</Formula>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Clinical examples</h2>
      <DataTable
        head={['Scenario', 'Mechanism', 'Why']}
        rows={[
          ['Samples lost when a centrifuge failed on random days', 'MCAR', 'Unrelated to anything about the patient.'],
          ['BMI not measured in older, frailer patients who cannot stand', 'MAR given age (and frailty, if recorded)', 'Depends on observed characteristics. Becomes MNAR if frailty is unrecorded and related to BMI.'],
          ['HbA1c ordered more often when glucose is high', 'MAR given glucose', 'Missingness follows an observed lab value.'],
          ['Depression questionnaire skipped by the most depressed', 'MNAR', 'Depends on the unobserved score itself.'],
          ['Lab not repeated because the clinician judged the patient "well"', 'Often MNAR', 'Depends on unrecorded clinical judgement related to the value.'],
        ]}
      />
      <Callout kind="key" title="MAR is an assumption conditional on what you include">
        The same data can be MNAR in an analysis that ignores age and close to MAR in one that includes it. This is why imputation models should be rich: include
        the outcome, all analysis variables, and auxiliary variables that predict either the missing values or their missingness <Cite ids="white2011,vanbuuren2018" />.
      </Callout>

      <h2 className="mt-8 mb-3 text-lg font-semibold">What can and cannot be tested</h2>
      <Ul>
        <li><strong>You can show data are not MCAR</strong>: if patients with missing BMI are older, MCAR is implausible. Little&apos;s test formalizes this, with limited power <Cite ids="little1988" />.</li>
        <li><strong>You cannot distinguish MAR from MNAR</strong> with the observed data: both are compatible with anything you can see. That choice rests on clinical knowledge, and MNAR is handled by sensitivity analysis <Cite ids="sterne2009" />.</li>
        <li><strong>The percentage missing does not determine the method.</strong> What matters is the mechanism, whether missingness depends on the outcome, and the auxiliary information available <Cite ids="madleydowd2019" />.</li>
      </Ul>
      <Callout kind="mistake" title="&quot;Complete-case analysis is biased unless MCAR&quot;">
        Too simple. For regression coefficients, complete-case analysis is unbiased when missingness depends on the covariates but not on the outcome (given the covariates),
        even if the data are MNAR in a covariate. It is biased when missingness depends on the outcome. Means and prevalences behave differently <Cite ids="hughes2019,white2011" />.
        The next lesson lets you verify this.
      </Callout>
      <Takeaways
        items={[
          'MCAR / MAR / MNAR describe what missingness depends on, relative to the variables in the analysis.',
          'Observed data can refute MCAR but cannot distinguish MAR from MNAR.',
          'Whether complete cases are biased depends on the estimand and on whether missingness depends on the outcome.',
          'Make MAR plausible by including the outcome and auxiliary variables in the imputation model.',
        ]}
      />
      <CheckYourself ids={['md-mar', 'md-untestable', 'md-proportion']} />
    </div>
  );
}
