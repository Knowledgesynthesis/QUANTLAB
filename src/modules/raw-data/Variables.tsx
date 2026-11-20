import { useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';
import { Callout, DataTable, SelectField } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways } from '@/components/learning';

type VType = 'continuous' | 'count' | 'binary' | 'nominal' | 'ordinal' | 'time-to-event';
const typeOptions: { value: VType | ''; label: string }[] = [
  { value: '', label: 'Choose a type…' },
  { value: 'continuous', label: 'Continuous' },
  { value: 'count', label: 'Count' },
  { value: 'binary', label: 'Binary' },
  { value: 'nominal', label: 'Nominal (unordered categories)' },
  { value: 'ordinal', label: 'Ordinal (ordered categories)' },
  { value: 'time-to-event', label: 'Time-to-event (with censoring)' },
];

const exercise: { name: string; desc: string; answer: VType; why: string }[] = [
  { name: 'los_days', desc: 'Length of stay, from admission/discharge timestamps', answer: 'continuous', why: 'Measured in hours and converted to days: continuous, positive and right-skewed. Usually modelled on the log scale or with a GLM (gamma/log link).' },
  { name: 'readmit_30d', desc: 'Readmitted within 30 days of discharge (0/1)', answer: 'binary', why: 'Binary – but only valid if every patient had 30 days of follow-up. Deaths before day 30 are a competing event to handle explicitly.' },
  { name: 'nyha_class', desc: 'NYHA heart-failure class I–IV', answer: 'ordinal', why: 'Ordered but unequally spaced. Use an ordinal model or dummies; coding it 1–4 as a number assumes equal steps.' },
  { name: 'icd10_primary', desc: 'Primary diagnosis code (~1,800 distinct values)', answer: 'nominal', why: 'Nominal with very high cardinality. Group into clinically meaningful categories (e.g., CCSR) before modelling.' },
  { name: 'prior_admissions_12m', desc: 'Number of admissions in the previous year', answer: 'count', why: 'Non-negative integers, often with many zeros. Poisson/negative binomial as an outcome; splines or log(x + 1) as a predictor.' },
  { name: 'time_to_death', desc: 'Days from discharge to death or end of follow-up', answer: 'time-to-event', why: 'Patients alive at the end of follow-up are censored. Analysing "died yes/no" ignores different follow-up times; use survival methods.' },
  { name: 'egfr', desc: 'Estimated GFR (CKD-EPI 2021)', answer: 'continuous', why: 'Continuous and derived from creatinine, age and sex. Record the equation used in the dictionary: older equations (MDRD, CKD-EPI 2009) included a race coefficient.' },
  { name: 'smoking', desc: 'Never / former / current', answer: 'nominal', why: 'Usually treated as nominal: "former" is not halfway between "never" and "current" in risk. Use dummies with a clear reference.' },
];

function ClassifyExercise() {
  const [answers, setAnswers] = useState<Record<string, VType | ''>>({});
  const correct = exercise.filter((e) => answers[e.name] === e.answer).length;
  const answered = exercise.filter((e) => answers[e.name]).length;
  return (
    <Lab title="Classify the variables" description={`Score: ${correct}/${exercise.length} correct (${answered} answered)`}>
      <div className="grid gap-4 sm:grid-cols-2">
        {exercise.map((e) => {
          const a = answers[e.name] ?? '';
          const ok = a === e.answer;
          return (
            <div key={e.name} className="rounded-lg border p-3">
              <p className="font-mono text-sm font-semibold">{e.name}</p>
              <p className="mb-2 text-xs text-muted-foreground">{e.desc}</p>
              <SelectField label="Type" value={a} onChange={(v) => setAnswers((s) => ({ ...s, [e.name]: v }))} options={typeOptions} />
              {a && (
                <p className={`mt-2 flex gap-1.5 text-xs ${ok ? 'text-good-text' : 'text-critical-text'}`}>
                  {ok ? <CircleCheck className="h-4 w-4 shrink-0" /> : <CircleX className="h-4 w-4 shrink-0" />}
                  <span className="text-foreground/90">{ok ? '' : `Best answer: ${e.answer}. `}{e.why}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Lab>
  );
}

export default function Variables() {
  return (
    <div>
      <P>
        The measurement scale of a variable decides which summaries are meaningful, which models fit, and which cleaning rules apply. Classify every variable in
        the dictionary before analysis.
      </P>
      <DataTable
        head={['Type', 'Example', 'Summarise with', 'Typical model (as outcome)', 'Watch for']}
        rows={[
          ['Continuous', 'Age, SBP, creatinine', 'Mean (SD) or median (IQR)', 'Linear; GLM with log link if positive and skewed', 'Units, impossible values, digit preference'],
          ['Count', 'Prior admissions', 'Median (IQR), % zero', 'Poisson / negative binomial', 'Over-dispersion, excess zeros, exposure time'],
          ['Binary', 'Readmission, diabetes', 'n (%)', 'Logistic', 'Which level is 1; complete follow-up'],
          ['Nominal', 'Site, smoking, diagnosis', 'n (%) per level', 'Multinomial', 'Inconsistent labels, rare levels'],
          ['Ordinal', 'NYHA, mRS, pain score', 'n (%) per level, median', 'Proportional-odds', 'Unequal spacing; ceiling effects'],
          ['Time-to-event', 'Time to death', 'Kaplan–Meier', 'Cox / parametric survival', 'Censoring, competing risks, time zero'],
        ]}
      />
      <h2 className="mt-8 mb-3 text-lg font-semibold">Keep information; decide coarsening only with a reason</h2>
      <P>
        Converting a continuous variable into categories (eGFR &lt; 60, "obese") discards information and assumes risk jumps at the cut-point. Coarsen for
        presentation if needed, but model the continuous value, with a spline if the relationship is non-linear <Cite ids="altman2006,harrell2015" />. Module 2
        quantifies this cost.
      </P>
      <Callout kind="mistake" title="Common mistake: binary outcome with unequal follow-up">
        "Died: yes/no" in a cohort followed for 1 to 5 years compares patients with very different chances to die. When follow-up varies, the outcome is
        time-to-event, and censoring must be handled.
      </Callout>
      <Callout kind="tip" title="Derived variables">
        For every derived variable (BMI, eGFR, LOS, comorbidity scores), record the formula, version and source variables. eGFR here uses the race-free CKD-EPI
        2021 equation <Cite ids="inker2021" />; mixing equations across sites or years creates artificial differences.
      </Callout>
      <ClassifyExercise />
      <Takeaways
        items={[
          'Measurement scale → summary statistic → model. Decide it per variable and write it in the dictionary.',
          'Ordinal is not interval: do not code 1–4 and treat it as continuous without justification.',
          'Unequal follow-up turns a binary outcome into a time-to-event outcome.',
          'Record formulas and versions of derived variables.',
        ]}
      />
      <CheckYourself ids={['rd-dictionary']} />
    </div>
  );
}
