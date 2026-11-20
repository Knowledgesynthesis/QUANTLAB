import { useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';
import { Button, Callout, Checkbox, DataTable } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';
import { cn } from '@/lib/utils';

const weak = [
  'We performed a retrospective cohort study of patients admitted to three hospitals.',
  'Data were cleaned and outliers were removed.',
  'Missing data were handled using multiple imputation.',
  'Variables with p < 0.10 in univariable analysis were entered into a multivariable linear regression for length of stay.',
  'Model assumptions were checked and were met.',
  'Statistical significance was set at p < 0.05. Analyses were performed in R.',
];

const omissions: { id: string; text: string; present: boolean; why: string }[] = [
  { id: 'flow', text: 'Number of patients at each exclusion step (flow diagram)', present: false, why: 'Sentence 1–2 give no counts; STROBE/RECORD require them.' },
  { id: 'outliers', text: 'How outliers were defined and how many were removed', present: false, why: '"Outliers were removed" is uncheckable and may have removed real patients.' },
  { id: 'missing', text: 'Amount of missing data, assumed mechanism, imputation model, number of imputations', present: false, why: 'Sentence 3 names a method but none of the details TARMOS asks for.' },
  { id: 'selection', text: 'Rationale for covariates (prespecified, DAG) instead of p-value screening', present: false, why: 'Univariable screening is discouraged; it biases estimates and is unstable.' },
  { id: 'outcome-scale', text: 'Outcome scale (e.g., log-transformed LOS) and how effects are expressed', present: false, why: 'Readers cannot interpret coefficients without it.' },
  { id: 'diagnostics', text: 'Which diagnostics were examined and what was done', present: false, why: '"Assumptions were met" is a conclusion without evidence.' },
  { id: 'software', text: 'Software versions and packages', present: false, why: '"R" alone is insufficient for reproducibility.' },
  { id: 'design', text: 'Study design and setting', present: true, why: 'Sentence 1 states design and setting (though dates and eligibility are missing).' },
  { id: 'effect-ci', text: 'Effect sizes with confidence intervals as the primary result', present: false, why: 'Only a significance threshold is mentioned.' },
];

function MethodsCritique() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [checked, setChecked] = useState(false);
  const right = omissions.filter((o) => (flags[o.id] ?? false) === !o.present).length;
  return (
    <Lab title="Spot the omissions" description="A typical statistical-methods paragraph. Tick every element that is MISSING or inadequate.">
      <ol className="space-y-1.5 rounded-lg bg-muted/60 p-4 text-sm">
        {weak.map((s, i) => <li key={i}><span className="mr-1.5 text-muted-foreground">{i + 1}.</span>{s}</li>)}
      </ol>
      <div className="space-y-2">
        {omissions.map((o) => (
          <div key={o.id} className={cn('rounded-lg border p-2.5', checked && ((flags[o.id] ?? false) === !o.present ? 'border-good/50 bg-good-soft/50' : 'border-critical/40 bg-critical-soft/60'))}>
            <Checkbox label={o.text} checked={flags[o.id] ?? false} onChange={(v) => setFlags((f) => ({ ...f, [o.id]: v }))} disabled={checked} />
            {checked && (
              <p className="mt-1 flex gap-1.5 pl-6 text-xs">
                {(flags[o.id] ?? false) === !o.present ? <CircleCheck className="h-3.5 w-3.5 shrink-0 text-good-text" /> : <CircleX className="h-3.5 w-3.5 shrink-0 text-critical-text" />}
                <span><strong>{o.present ? 'Present.' : 'Missing.'}</strong> {o.why}</span>
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {!checked ? <Button onClick={() => setChecked(true)}>Check</Button> : <Button variant="outline" onClick={() => { setChecked(false); setFlags({}); }}>Reset</Button>}
        {checked && <span className="text-sm font-medium">{right} / {omissions.length} correct</span>}
      </div>
      {checked && (
        <Callout kind="tip" title="A better version">
          Of 607 rows in the extract, 6 exact duplicates were removed and 2 conflicting records were resolved, leaving 599 admissions in 560 patients (Figure 1). Implausible values
          (pre-specified ranges, Supplementary Table S1) were set to missing; no patients were excluded for extreme values. Length of stay was log-transformed and effects are
          reported as ratios of geometric means with 95% CIs. Covariates were chosen a priori from a directed acyclic graph (Supplementary Figure S2). Missing BMI and
          hemoglobin values were imputed by chained equations (40 imputations, predictive mean matching) including the outcome and site, assuming MAR; a delta-adjusted
          sensitivity analysis explored MNAR. Residual and influence diagnostics are shown in Supplementary Figure S3; HC3 standard errors were used. Analyses used R 4.5
          (mice 3.17, sandwich 3.1) with versions locked by renv; code is archived at doi:10.5281/zenodo.xxxxxxx.
        </Callout>
      )}
    </Lab>
  );
}

export default function Reporting() {
  return (
    <div>
      <P>
        Reporting guidelines list what readers need to judge and reproduce a study. Journals expect them, and they double as a design checklist when used before analysis.
        The EQUATOR Network keeps the current library <Cite ids="equator" />. Several key guidelines were updated in 2024–2025.
      </P>
      <DataTable
        head={['Study type', 'Guideline (current version)', 'Notes']}
        rows={[
          ['Randomised trial', <>CONSORT 2025 <Cite ids="hopewell2025" /></>, 'Replaces CONSORT 2010'],
          ['Trial protocol', <>SPIRIT 2025 <Cite ids="chan2025" /></>, 'Replaces SPIRIT 2013'],
          ['Observational study', <>STROBE <Cite ids="vonelm2007" /></>, <>Add RECORD for routinely collected data (EHR, claims) <Cite ids="benchimol2015" /></>],
          ['Target trial emulation', <>TARGET 2025 <Cite ids="cashin2025" /></>, 'For observational studies emulating a trial'],
          ['Prediction model (regression or ML)', <>TRIPOD+AI 2024 <Cite ids="collins2024" /></>, 'Replaces TRIPOD 2015'],
          ['Studies using large language models', <>TRIPOD-LLM 2025 <Cite ids="gallifant2025" /></>, ''],
          ['Risk-of-bias of prediction models', <>PROBAST+AI 2025 <Cite ids="moons2025" /></>, 'An appraisal tool, not a reporting guideline'],
          ['Diagnostic accuracy', <>STARD 2015 <Cite ids="bossuyt2015" /></>, ''],
          ['Economic evaluation', <>CHEERS 2022 <Cite ids="husereau2022" /></>, ''],
          ['Statistical methods (any design)', <>SAMPL <Cite ids="lang2015" /></>, 'Basic statistical reporting'],
        ]}
      />
      <h2 className="mt-8 mb-3 text-lg font-semibold">What a statistical methods section must let readers check</h2>
      <DataTable
        head={['Element', 'Example of adequate reporting']}
        rows={[
          ['Participant flow', 'Counts at each exclusion and cleaning step'],
          ['Outcome definition and scale', 'Log-transformed LOS; effects as ratios of geometric means'],
          ['Covariate rationale', 'Pre-specified from a DAG or prior literature, not p-value screening'],
          ['Functional form', 'Age as a restricted cubic spline (4 knots)'],
          ['Missing data', 'Amount per variable, assumed mechanism, method, m, imputation model, sensitivity analysis'],
          ['Diagnostics', 'Which checks, what was found, what was done (with supplement figures)'],
          ['Uncertainty', 'Effect estimates with 95% CIs; exact p-values; robust SEs if used'],
          ['Validation (prediction)', 'Internal validation method, optimism-corrected discrimination and calibration'],
          ['Software and reproducibility', 'Versions, packages, seeds, code DOI'],
        ]}
      />
      <MethodsCritique />
      <Callout kind="mistake" title="p-values without effect sizes">
        A p-value alone conveys neither the size nor the precision of an effect. Report estimates with confidence intervals, and do not call p = 0.06 "no effect"
        <Cite ids="wasserstein2016,greenland2016" />.
      </Callout>
      <Takeaways
        items={[
          'Use the current guideline: CONSORT 2025, SPIRIT 2025, TRIPOD+AI, TARGET, STROBE + RECORD.',
          'PROBAST+AI appraises risk of bias; it is not a reporting checklist.',
          'Methods must state counts, missing-data handling, covariate rationale, diagnostics and software versions.',
          'Report effect sizes with confidence intervals, not just p-values.',
        ]}
      />
      <CheckYourself ids={['rp-tripod', 'rp-strobe']} />
    </div>
  );
}
