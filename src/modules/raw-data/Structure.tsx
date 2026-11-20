import { useState } from 'react';
import { cohort } from '@/data/cohort';
import { Callout, Code, DataTable, SliderField, Stat, Segmented } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways, Ul } from '@/components/learning';
import { fmt } from '@/lib/utils';

const wide = [
  ['P10003', '1.1', '1.3', '1.8'],
  ['P10011', '0.9', '', '1.0'],
  ['P10024', '2.4', '2.2', ''],
];
const long = [
  ['P10003', '1', '1.1'], ['P10003', '2', '1.3'], ['P10003', '3', '1.8'],
  ['P10011', '1', '0.9'], ['P10011', '3', '1.0'],
  ['P10024', '1', '2.4'], ['P10024', '2', '2.2'],
];

function DesignEffect() {
  const [m, setM] = useState(20);
  const [icc, setIcc] = useState(0.05);
  const [n, setN] = useState(2000);
  const de = 1 + (m - 1) * icc;
  return (
    <Lab title="Design-effect calculator" description="How much information do correlated rows really carry?">
      <div className="grid gap-5 sm:grid-cols-3">
        <SliderField label="Rows per cluster (m)" value={m} onChange={setM} min={1} max={100} />
        <SliderField label="Intraclass correlation (ρ)" value={icc} onChange={setIcc} min={0} max={0.5} step={0.01} format={(v) => v.toFixed(2)} />
        <SliderField label="Total rows (n)" value={n} onChange={setN} min={100} max={10000} step={100} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Design effect" value={fmt(de, 2)} sub="1 + (m − 1)ρ" />
        <Stat label="Effective n" value={Math.round(n / de).toLocaleString()} sub={`of ${n.toLocaleString()} rows`} tone={de > 2 ? 'warning' : undefined} />
        <Stat label="SE inflation" value={`×${fmt(Math.sqrt(de), 2)}`} sub="√design effect" />
      </div>
      <p className="text-sm text-muted-foreground">
        Example: 20 hospitals × 100 patients with ρ = 0.05 gives a design effect of 5.95: the 2,000 patients carry the information of about 336
        independent ones. Analyses that ignore clustering report standard errors that are too small by the factor shown.
      </p>
    </Lab>
  );
}

export default function Structure() {
  const c = cohort();
  const patients = new Set(c.map((r) => r.patient_id));
  const perPatient = new Map<string, number>();
  c.forEach((r) => perPatient.set(r.patient_id, (perPatient.get(r.patient_id) ?? 0) + 1));
  const repeaters = [...perPatient.values()].filter((v) => v > 1).length;
  const [view, setView] = useState<'wide' | 'long'>('wide');

  return (
    <div>
      <P>
        Before any statistic, answer two questions: <strong>what is one row?</strong> and <strong>what do I want to draw conclusions about?</strong> The first is the
        unit of observation; the second is the unit of analysis. When they differ and you ignore it, every standard error and p-value is wrong.
      </P>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Tidy data</h2>
      <P>
        A dataset is tidy when each variable is a column, each observation is a row, and each type of observational unit is its own table <Cite ids="wickham2014" />.
        Almost every modelling function assumes this shape. Spreadsheet habits break it: merged cells, colour as data, several values in one cell, totals rows,
        dates typed as text <Cite ids="broman2018" />.
      </P>
      <Ul>
        <li>One value per cell; units in the dictionary, not the cell ("1.2", not "1.2 mg/dL").</li>
        <li>Dates in ISO 8601 (2024-03-07). Spreadsheets silently convert some text to dates, gene names included.</li>
        <li>Missing values left empty or as one explicit code, documented. Never 0 and never colour.</li>
        <li>No calculations or formatting stored in the raw data file.</li>
      </Ul>

      <Lab title="Wide vs long" description="Serial creatinine (mg/dL) on hospital days 1–3">
        <Segmented label="Layout" value={view} onChange={setView} options={[{ value: 'wide', label: 'Wide (one row per patient)' }, { value: 'long', label: 'Long (one row per measurement)' }]} />
        {view === 'wide' ? (
          <DataTable head={['patient_id', 'cr_day1', 'cr_day2', 'cr_day3']} rows={wide.map((r) => r.map((v) => v || <span className="text-muted-foreground">NA</span>))} align={['l', 'r', 'r', 'r']} />
        ) : (
          <DataTable head={['patient_id', 'day', 'creatinine']} rows={long} align={['l', 'r', 'r']} />
        )}
        <p className="text-sm text-muted-foreground">
          {view === 'wide'
            ? 'Wide suits one-row-per-patient summaries, but adding day 4 means adding a column and missing visits become empty cells.'
            : 'Long is tidy for repeated measures: each row is one measurement. Mixed models, GEE and plotting tools expect this shape. Missing visits are simply absent rows.'}
        </p>
        <Code
          r={`library(tidyr)\nlong <- pivot_longer(wide, starts_with("cr_day"),\n  names_to = "day", names_prefix = "cr_day",\n  values_to = "creatinine", values_drop_na = TRUE)`}
          py={`long = (wide.melt(id_vars="patient_id", var_name="day",\n                  value_name="creatinine")\n            .dropna(subset=["creatinine"]))\nlong["day"] = long["day"].str.removeprefix("cr_day").astype(int)`}
        />
      </Lab>

      <h2 className="mt-8 mb-3 text-lg font-semibold">Unit of observation ≠ unit of analysis</h2>
      <P>
        The QuantLab cohort has <strong>{c.length} admissions</strong> from <strong>{patients.size} patients</strong>; {repeaters} patients were admitted twice.
        Rows from the same patient share age, comorbidities and unmeasured frailty, so they are positively correlated. Treating them as independent makes
        results look more precise than they are.
      </P>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Rows (admissions)" value={c.length} />
        <Stat label="Patients" value={patients.size} />
        <Stat label="Patients with > 1 row" value={repeaters} />
      </div>
      <P>Three defensible options, chosen before looking at results:</P>
      <Ul>
        <li><strong>Index event:</strong> keep one admission per patient by a pre-specified rule (e.g., first eligible admission). Simple; discards data.</li>
        <li><strong>Model the clustering:</strong> mixed-effects models or GEE, or cluster-robust (sandwich) SEs by patient.</li>
        <li><strong>Aggregate:</strong> summarise to the patient level when the question is about patients.</li>
      </Ul>
      <DesignEffect />
      <Callout kind="mistake">
        Checking uniqueness only on <code>patient_id</code>. Check every key you rely on: admission IDs should be unique per row, patient IDs unique per patient,
        and their combination should match the stated unit.
      </Callout>
      <Code
        title="Key checks that should be in every cleaning script"
        r={`library(dplyr)\nstopifnot(!anyDuplicated(adm$admission_id))      # fail loudly\nadm |> count(patient_id) |> count(n, name = "patients")  # rows per patient\nn_distinct(adm$patient_id)`}
        py={`assert adm["admission_id"].is_unique, "duplicate admission IDs"\nadm.groupby("patient_id").size().value_counts().sort_index()  # rows per patient\nadm["patient_id"].nunique()`}
      />

      <Takeaways
        items={[
          'Write down the unit of analysis before cleaning; it decides how duplicates and repeated rows are handled.',
          'Tidy (long) format is the default for repeated measures; wide is a reporting view.',
          'Correlated rows shrink the effective sample size by the design effect 1 + (m − 1)ρ.',
          'Assert key uniqueness in code so that a new extract fails loudly instead of silently.',
        ]}
      />
      <CheckYourself ids={['rd-unit']} />
    </div>
  );
}
