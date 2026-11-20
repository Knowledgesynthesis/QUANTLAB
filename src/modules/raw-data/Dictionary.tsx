import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { messyExtract, PLAUSIBLE } from '@/data/messy';
import { applyCleaning, correctChoices, type CleanRow } from '@/data/audit';
import { Button, Callout, Code, DataTable } from '@/components/ui';
import { CheckYourself, Cite, Lab, P, Takeaways, Ul } from '@/components/learning';
import { downloadText, fmt } from '@/lib/utils';
import { median, min, max } from '@/lib/stats/descriptive';

interface DictRow {
  name: string;
  label: string;
  type: string;
  units: string;
  allowed: string;
  missingCodes: string;
  source: string;
  derivation: string;
}

const meta: Record<keyof CleanRow, Omit<DictRow, 'name' | 'allowed'> & { allowed?: string }> = {
  admission_id: { label: 'Admission identifier', type: 'string (key)', units: '', missingCodes: 'never missing', source: 'ADT feed', derivation: 'Unique per row after de-duplication' },
  patient_id: { label: 'Patient identifier (pseudonymised)', type: 'string (key)', units: '', missingCodes: 'never missing', source: 'Master patient index', derivation: '' },
  site: { label: 'Hospital site', type: 'nominal', units: '', missingCodes: 'never missing', source: 'ADT feed', derivation: '', allowed: 'A, B, C' },
  age: { label: 'Age at admission', type: 'continuous (integer)', units: 'years', missingCodes: 'raw: 999', source: 'Demographics', derivation: 'floor((admit − birth date)/365.25)' },
  sex: { label: 'Sex recorded at admission', type: 'binary', units: '', missingCodes: 'raw: blank', source: 'Demographics', derivation: 'Raw spellings mapped to F/M via lookup table', allowed: 'F, M' },
  bmi: { label: 'Body-mass index', type: 'continuous', units: 'kg/m²', missingCodes: 'blank', source: 'Nursing admission form', derivation: 'weight / height²' },
  smoking: { label: 'Smoking status', type: 'nominal', units: '', missingCodes: 'raw: "", "Unknown", "NA"', source: 'Nursing admission form', derivation: '', allowed: 'never, former, current' },
  diabetes: { label: 'Diabetes mellitus', type: 'binary', units: '', missingCodes: 'none', source: 'Problem list', derivation: '', allowed: '0, 1' },
  hypertension: { label: 'Hypertension', type: 'binary', units: '', missingCodes: 'none', source: 'Problem list', derivation: '', allowed: '0, 1' },
  sbp: { label: 'Systolic BP, first recorded', type: 'continuous', units: 'mmHg', missingCodes: 'blank', source: 'Vital signs', derivation: '' },
  dbp: { label: 'Diastolic BP, first recorded', type: 'continuous', units: 'mmHg', missingCodes: 'blank', source: 'Vital signs', derivation: '' },
  heart_rate: { label: 'Heart rate, first recorded', type: 'continuous', units: 'beats/min', missingCodes: 'raw: 999', source: 'Vital signs', derivation: '' },
  hemoglobin: { label: 'Hemoglobin, first value', type: 'continuous', units: 'g/dL', missingCodes: 'blank', source: 'Lab feed', derivation: 'g/L values ÷ 10' },
  creatinine: { label: 'Serum creatinine, first value', type: 'continuous', units: 'mg/dL', missingCodes: 'blank', source: 'Lab feed', derivation: 'Site B reported µmol/L; ÷ 88.4' },
  egfr: { label: 'Estimated GFR', type: 'continuous', units: 'mL/min/1.73m²', missingCodes: 'blank', source: 'Lab feed', derivation: 'CKD-EPI 2021 creatinine equation (race-free)' },
  los_days: { label: 'Length of stay', type: 'continuous', units: 'days', missingCodes: 'set missing if discharge < admit', source: 'Derived', derivation: '(discharge − admit) in days' },
  readmit_30d: { label: 'Unplanned readmission ≤ 30 days', type: 'binary', units: '', missingCodes: 'none', source: 'ADT feed', derivation: 'Any admission within 30 days of discharge', allowed: '0, 1' },
};

export default function Dictionary() {
  const { rows, log, rawN } = useMemo(() => {
    const raw = messyExtract().rows;
    const res = applyCleaning(raw, correctChoices);
    return { ...res, rawN: raw.length };
  }, []);

  const dict: (DictRow & { nMissing: number; observed: string })[] = useMemo(() => {
    return (Object.keys(meta) as (keyof CleanRow)[]).map((k) => {
      const vals = rows.map((r) => r[k]);
      const nMissing = vals.filter((v) => v === null).length;
      const nums = vals.filter((v): v is number => typeof v === 'number');
      const pl = PLAUSIBLE[k as string];
      const observed = nums.length && meta[k].type.startsWith('continuous') ? `${fmt(min(nums), 1)}–${fmt(max(nums), 1)} (median ${fmt(median(nums), 1)})` : [...new Set(vals.filter((v) => v !== null).map(String))].slice(0, 6).join(', ');
      return {
        name: k, ...meta[k],
        allowed: meta[k].allowed ?? (pl ? `${pl[0]}–${pl[1]}` : ''),
        nMissing, observed,
      };
    });
  }, [rows]);

  const csv = () => {
    const head = ['variable', 'label', 'type', 'units', 'allowed_values', 'missing_codes', 'source', 'derivation', 'n_missing_clean'];
    const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
    downloadText('data-dictionary.csv', [head.join(','), ...dict.map((d) => [d.name, d.label, d.type, d.units, d.allowed, d.missingCodes, d.source, d.derivation, d.nMissing].map(esc).join(','))].join('\n'), 'text/csv');
  };

  return (
    <div>
      <P>
        A data dictionary turns tacit knowledge ("site B uses µmol/L", "999 means not recorded") into something code and co-authors can check. Keep it as a
        machine-readable file (CSV/YAML) next to the code, version it, and cite it in the methods <Cite ids="broman2018,wilkinson2016" />.
      </P>
      <Ul>
        <li><strong>Minimum columns:</strong> name, label, type, units, allowed values or range, missing-value codes, source, derivation.</li>
        <li><strong>Plus for analysis:</strong> number missing after cleaning, and the role in the analysis (outcome, exposure, confounder, auxiliary).</li>
      </Ul>

      <Lab title="Dictionary generated from the cleaned extract" actions={<Button size="sm" variant="outline" onClick={csv}><Download className="h-4 w-4" /> CSV</Button>}>
        <DataTable
          head={['Variable', 'Label', 'Type', 'Units', 'Allowed', 'Missing codes', 'Derivation', 'Missing (n)', 'Observed']}
          rows={dict.map((d) => [<span className="font-mono">{d.name}</span>, d.label, d.type, d.units, d.allowed, d.missingCodes, d.derivation, d.nMissing, d.observed])}
          className="text-xs"
        />
      </Lab>

      <h2 className="mt-8 mb-3 text-lg font-semibold">The audit trail</h2>
      <P>Every change from raw to analysis data must be reproducible and counted. Applying the correct actions from the audit lab to the {rawN}-row extract gives:</P>
      <ol className="mb-4 space-y-1.5 rounded-xl border bg-card p-4 text-sm">
        {log.map((l, i) => (
          <li key={i} className="flex gap-2"><span className="tabular text-muted-foreground">{i + 1}.</span>{l}</li>
        ))}
        <li className="flex gap-2 font-semibold"><span className="tabular text-muted-foreground">→</span>{rows.length} admissions in the analysis dataset.</li>
      </ol>
      <P>These counts feed the participant flow diagram that STROBE and RECORD expect <Cite ids="vonelm2007,benchimol2015" />.</P>

      <Code
        title="01_clean.R – one script, raw in, clean out"
        r={`library(dplyr); library(readr); library(validate)

raw <- read_csv("data/raw/extract.csv", col_types = cols(.default = "c"))
sex_map <- c(F = "F", f = "F", female = "F", Female = "F",
             M = "M", m = "M", male = "M", Male = "M")

clean <- raw |>
  distinct() |>                                   # exact duplicates
  mutate(across(c(age, bmi, sbp, dbp, heart_rate, hemoglobin,
                  creatinine, egfr), as.numeric),
         across(c(age, heart_rate), ~ na_if(.x, 999)),
         creatinine = if_else(site == "B", creatinine / 88.4, creatinine),
         hemoglobin = if_else(hemoglobin > 60, hemoglobin / 10, hemoglobin),
         sex = unname(sex_map[sex]),
         smoking = na_if(na_if(na_if(smoking, ""), "Unknown"), "NA"),
         los_days = as.numeric(difftime(as.POSIXct(discharge),
                                        as.POSIXct(admit), units = "days")),
         los_days = if_else(los_days < 0, NA_real_, los_days),
         bmi = if_else(bmi < 10 | bmi > 80, NA_real_, bmi))
stopifnot(!anyNA(clean$sex))                      # fail on unmapped codes

rules <- validator(age >= 18, age <= 110, hemoglobin <= 25,
                   dbp < sbp, creatinine < 20)
summary(confront(clean, rules))                   # documented checks
write_csv(clean, "data/processed/analysis.csv")`}
        py={`import pandas as pd
import pandera.pandas as pa   # declarative data validation

raw = pd.read_csv("data/raw/extract.csv", dtype=str)
sex_map = {"F": "F", "f": "F", "female": "F", "Female": "F",
           "M": "M", "m": "M", "male": "M", "Male": "M"}
num = ["age", "bmi", "sbp", "dbp", "heart_rate", "hemoglobin", "creatinine", "egfr"]

clean = raw.drop_duplicates().copy()
clean[num] = clean[num].apply(pd.to_numeric)
clean[["age", "heart_rate"]] = clean[["age", "heart_rate"]].replace(999, pd.NA)
clean.loc[clean.site == "B", "creatinine"] /= 88.4
clean.loc[clean.hemoglobin > 60, "hemoglobin"] /= 10
clean["sex"] = clean["sex"].map(sex_map)
assert clean["sex"].notna().all(), "unmapped sex code"
clean["smoking"] = clean["smoking"].replace({"": pd.NA, "Unknown": pd.NA, "NA": pd.NA})
los = (pd.to_datetime(clean.discharge) - pd.to_datetime(clean.admit)).dt.total_seconds() / 86400
clean["los_days"] = los.where(los >= 0)

schema = pa.DataFrameSchema({
    "age": pa.Column(float, pa.Check.in_range(18, 110), nullable=True),
    "hemoglobin": pa.Column(float, pa.Check.le(25), nullable=True),
    "creatinine": pa.Column(float, pa.Check.lt(20), nullable=True),
})
schema.validate(clean)                            # raises on violations
clean.to_csv("data/processed/analysis.csv", index=False)`}
      />
      <Callout kind="tip" title="Validation rules belong in code">
        Declarative checks (R <code>validate</code> or <code>pointblank</code>; Python <code>pandera</code>) turn your plausibility rules into tests that run on
        every new extract and stop the pipeline when the data change under you.
      </Callout>
      <Takeaways
        items={[
          'The dictionary is a versioned, machine-readable file, not a Word table written at the end.',
          'Record missing-value codes and derivations explicitly; they are where analyses silently go wrong.',
          'Counts at each cleaning step become the flow diagram.',
          'Encode plausibility rules as automated validation that fails loudly.',
        ]}
      />
      <CheckYourself ids={['rd-raw-readonly']} />
    </div>
  );
}
