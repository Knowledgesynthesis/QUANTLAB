/**
 * A deliberately messy EHR extract derived from the synthetic cohort, with a
 * registry of planted problems (the "answer key" for the audit lab and capstone).
 */
import { Rng } from '@/lib/stats';
import { cohort, ckdEpi2021, type Admission } from './cohort';

export interface RawRow {
  row: number;
  admission_id: string;
  patient_id: string;
  site: string;
  admit: string;
  discharge: string;
  age: number | null;
  sex: string;
  bmi: number | null;
  smoking: string;
  diabetes: number;
  hypertension: number;
  sbp: number | null;
  dbp: number | null;
  heart_rate: number | null;
  hemoglobin: number | null;
  creatinine: number | null;
  egfr: number | null;
  los_days: number | null;
  readmit_30d: number;
}

export type IssueId =
  | 'exact-duplicates'
  | 'conflicting-duplicates'
  | 'creatinine-units'
  | 'hemoglobin-units'
  | 'hr-sentinel'
  | 'age-sentinel'
  | 'sex-coding'
  | 'smoking-missing-codes'
  | 'date-order'
  | 'bmi-implausible'
  | 'bp-implausible'
  | 'genuine-extremes';

export interface PlantedIssue {
  id: IssueId;
  title: string;
  variable: string;
  rows: number[];
  /** Which audit check reveals it. */
  check: AuditCheckId;
  finding: string;
  options: { id: string; label: string; correct: boolean; feedback: string }[];
}

export type AuditCheckId = 'structure' | 'ranges' | 'categories' | 'by-site' | 'cross-field';

function cloneRow(a: Admission, row: number): RawRow {
  return {
    row, admission_id: a.admission_id, patient_id: a.patient_id, site: a.site, admit: a.admit, discharge: a.discharge, age: a.age,
    sex: a.sex, bmi: a.bmi, smoking: a.smoking, diabetes: a.diabetes, hypertension: a.hypertension, sbp: a.sbp, dbp: a.dbp,
    heart_rate: a.heart_rate, hemoglobin: a.hemoglobin, creatinine: a.creatinine, egfr: a.egfr, los_days: a.los_days, readmit_30d: a.readmit_30d,
  };
}

export interface MessyExtract {
  rows: RawRow[];
  issues: PlantedIssue[];
}

export function buildMessyExtract(seed = 7): MessyExtract {
  const rng = new Rng(`messy-${seed}`);
  const base = cohort();
  const rows: RawRow[] = base.map((a, i) => cloneRow(a, i + 1));
  const pick = (k: number, filter: (r: RawRow) => boolean = () => true) => {
    const pool = rows.filter((r) => filter(r) && !touched.has(r.row));
    const chosen = rng.shuffle(pool).slice(0, k);
    chosen.forEach((r) => touched.add(r.row));
    return chosen;
  };
  const touched = new Set<number>();

  // Genuine but plausible extremes (should be KEPT).
  const extremes = rows.filter((r) => (r.creatinine ?? 0) > 5 || (r.los_days ?? 0) > 30);
  extremes.forEach((r) => touched.add(r.row));

  // 1. Site B reports creatinine in µmol/L (×88.4); eGFR from the lab system is correct.
  const siteB = rows.filter((r) => r.site === 'B');
  siteB.forEach((r) => { r.creatinine = r.creatinine === null ? null : Math.round(r.creatinine * 88.4); });

  // 2. Hemoglobin recorded in g/L for a few rows.
  const hbRows = pick(3);
  hbRows.forEach((r) => { r.hemoglobin = r.hemoglobin === null ? null : Math.round(r.hemoglobin * 10); });

  // 3. Heart-rate sentinel 999 = "not recorded".
  const hrRows = pick(5);
  hrRows.forEach((r) => { r.heart_rate = 999; });

  // 4. Age sentinel 999.
  const ageRows = pick(2);
  ageRows.forEach((r) => { r.age = 999; });

  // 5. Inconsistent sex coding by site.
  const sexMap: Record<string, Record<string, string[]>> = {
    A: { F: ['F'], M: ['M'] },
    B: { F: ['Female', 'female'], M: ['Male', 'male'] },
    C: { F: ['f', 'F'], M: ['m', 'M'] },
  };
  rows.forEach((r) => { r.sex = rng.choice(sexMap[r.site][r.sex]); });

  // 6. Smoking: missing coded three different ways.
  const smokeRows = pick(46);
  smokeRows.forEach((r, i) => { r.smoking = i % 3 === 0 ? '' : i % 3 === 1 ? 'Unknown' : 'NA'; });

  // 7. Discharge before admission (dates transposed at entry).
  const dateRows = pick(3, (r) => (r.los_days ?? 0) > 2);
  dateRows.forEach((r) => {
    const a = r.admit;
    r.admit = r.discharge;
    r.discharge = a;
    r.los_days = -(r.los_days ?? 0);
  });

  // 8. Implausible BMI: decimal shift and keying error.
  const bmiRows = pick(4);
  bmiRows.forEach((r, i) => { r.bmi = i < 3 ? Math.round((r.bmi ?? 27) * 1) / 10 : Math.round((r.bmi ?? 27) * 10); });

  // 9. Implausible blood pressure: an extra zero, and DBP/SBP transposed.
  const bpRows = pick(3);
  bpRows[0].sbp = (bpRows[0].sbp ?? 120) * 10;
  for (const r of bpRows.slice(1)) {
    const s = r.sbp;
    r.sbp = r.dbp;
    r.dbp = s;
  }

  // 10. Real missingness (MAR-like: BMI more often missing in older patients and at site C).
  rows.forEach((r) => {
    if (touched.has(r.row)) return;
    const pMiss = 0.04 + (r.age !== null && r.age > 75 ? 0.1 : 0) + (r.site === 'C' ? 0.08 : 0);
    if (rng.uniform() < pMiss) r.bmi = null;
    if (rng.uniform() < 0.05) r.hemoglobin = null;
  });

  // 11. Conflicting duplicates: same admission_id twice with different values.
  const conflictSrc = pick(2);
  const conflicts = conflictSrc.map((r) => ({ ...r, hemoglobin: r.hemoglobin === null ? 11.2 : Math.round((r.hemoglobin - 1.4) * 10) / 10, discharge: r.discharge }));

  // 12. Exact duplicates from an export glitch.
  const dupSrc = pick(6);
  const dups = dupSrc.map((r) => ({ ...r }));

  const all = [...rows, ...conflicts, ...dups];
  // Shuffle row order (as a real extract would be ordered by something arbitrary) then renumber.
  const shuffled = rng.shuffle(all);
  const oldToNew = new Map<RawRow, number>();
  shuffled.forEach((r, i) => oldToNew.set(r, i + 1));
  const renum = (list: RawRow[]) => list.map((r) => oldToNew.get(r)!).sort((a, b) => a - b);
  const finalRows = shuffled.map((r, i) => ({ ...r, row: i + 1 }));

  const dupRowNums = [...renum(dupSrc), ...renum(dups)].sort((a, b) => a - b);
  const conflictRowNums = [...renum(conflictSrc), ...renum(conflicts)].sort((a, b) => a - b);

  const issues: PlantedIssue[] = [
    {
      id: 'exact-duplicates', title: 'Exact duplicate rows', variable: 'all columns', rows: dupRowNums, check: 'structure',
      finding: `${dups.length} rows are byte-for-byte identical to another row (same admission_id and every value).`,
      options: [
        { id: 'dedupe', label: 'Keep one copy of each; log how many were removed', correct: true, feedback: 'Correct. Identical rows carry no new information; an export glitch is the usual cause. Removing them is safe, but record the count in your audit log and flow diagram.' },
        { id: 'keep', label: 'Keep all rows', correct: false, feedback: 'Duplicates inflate n, shrink standard errors and over-weight those patients.' },
        { id: 'drop-both', label: 'Delete every copy, including the original', correct: false, feedback: 'The original record is valid; deleting it discards a real admission.' },
      ],
    },
    {
      id: 'conflicting-duplicates', title: 'Same admission_id with conflicting values', variable: 'hemoglobin', rows: conflictRowNums, check: 'structure',
      finding: `${conflicts.length} admission_ids appear twice with different hemoglobin values.`,
      options: [
        { id: 'query', label: 'Query the source system; until resolved, keep neither value (set hemoglobin missing) and flag', correct: true, feedback: 'Correct. You cannot know which value is right from the extract. Adjudicate against the source (e.g., the lab feed); if impossible, treat the value as missing and document the rule.' },
        { id: 'first', label: 'Keep whichever row appears first', correct: false, feedback: 'Row order in an extract is arbitrary; this silently picks a value at random and is not reproducible across exports.' },
        { id: 'average', label: 'Average the two values', correct: false, feedback: 'Averaging invents a measurement nobody recorded.' },
      ],
    },
    {
      id: 'creatinine-units', title: 'Creatinine reported in µmol/L at site B', variable: 'creatinine', rows: renum(siteB), check: 'by-site',
      finding: 'Median creatinine at site B is ~80 versus ~1 at sites A and C, yet eGFR is similar across sites. Site B reports µmol/L (1 mg/dL = 88.4 µmol/L).',
      options: [
        { id: 'convert', label: 'Convert site B values to mg/dL (÷ 88.4) and document the unit harmonisation', correct: true, feedback: 'Correct. The unit is identifiable from the site and confirmed by the eGFR column. Convert in code, never by hand-editing the raw file.' },
        { id: 'outliers', label: 'Treat values > 10 as outliers and delete them', correct: false, feedback: 'That would delete a third of the data and leave a systematically biased sample. These are not outliers; they are a different unit.' },
        { id: 'log', label: 'Log-transform creatinine so the scales look similar', correct: false, feedback: 'A transformation cannot fix a unit error; site B values would still be ~4.5 log-units too high.' },
      ],
    },
    {
      id: 'hemoglobin-units', title: 'Hemoglobin recorded in g/L in a few rows', variable: 'hemoglobin', rows: renum(hbRows), check: 'ranges',
      finding: `${hbRows.length} hemoglobin values are > 60 (all between 70 and 190). Hemoglobin in g/dL cannot exceed ~25; these are g/L.`,
      options: [
        { id: 'convert', label: 'Divide by 10 (g/L → g/dL), flag the rows, and verify with the source if possible', correct: true, feedback: 'Correct. Values ten times the plausible range with a plausible distribution after ÷10 point to a unit slip. Document the rule and its trigger.' },
        { id: 'winsor', label: 'Winsorize to the 99th percentile', correct: false, feedback: 'Winsorizing turns an identifiable error into a different wrong value.' },
        { id: 'keep', label: 'Keep: they are just outliers', correct: false, feedback: 'A hemoglobin of 140 g/dL is physiologically impossible; this is an error, not an outlier.' },
      ],
    },
    {
      id: 'hr-sentinel', title: 'Heart rate = 999', variable: 'heart_rate', rows: renum(hrRows), check: 'ranges',
      finding: `${hrRows.length} heart-rate values equal exactly 999 – a classic "not recorded" sentinel code.`,
      options: [
        { id: 'na', label: 'Recode 999 to missing (NA) and record the sentinel in the data dictionary', correct: true, feedback: 'Correct. Sentinel codes must be converted to true missing values before any summary or model.' },
        { id: 'keep', label: 'Keep: the model will handle it', correct: false, feedback: 'A value of 999 will dominate means, SDs and regression fits.' },
        { id: 'cap', label: 'Cap at 200 bpm', correct: false, feedback: 'Capping invents a heart rate of 200 for patients whose value was never recorded.' },
      ],
    },
    {
      id: 'age-sentinel', title: 'Age = 999', variable: 'age', rows: renum(ageRows), check: 'ranges',
      finding: `${ageRows.length} patients have age 999.`,
      options: [
        { id: 'recover', label: 'Recover age from date of birth in the source if possible; otherwise set to missing', correct: true, feedback: 'Correct. Age is usually recoverable from the master patient index. Never leave a sentinel in an analysis variable.' },
        { id: 'exclude', label: 'Exclude these patients from all analyses', correct: false, feedback: 'Exclusion is a last resort; the value is likely recoverable, and other variables are valid.' },
        { id: 'mean', label: 'Replace with the mean age', correct: false, feedback: 'Ad-hoc mean substitution understates uncertainty; recover or treat as missing and handle with the missing-data strategy.' },
      ],
    },
    {
      id: 'sex-coding', title: 'Sex coded six different ways', variable: 'sex', rows: [], check: 'categories',
      finding: 'Levels found: F, M, Female, female, Male, male, f, m. Software treats each spelling as a distinct category.',
      options: [
        { id: 'harmonise', label: 'Map all spellings to F/M with an explicit lookup table in code', correct: true, feedback: 'Correct. Use an explicit mapping (and fail loudly on unexpected levels) so new spellings in future extracts are caught.' },
        { id: 'leave', label: 'Leave as is', correct: false, feedback: 'A model would estimate seven separate "sex" effects, several aliased with site.' },
        { id: 'drop', label: 'Drop rows that are not exactly "F" or "M"', correct: false, feedback: 'This deletes almost all of sites B and C.' },
      ],
    },
    {
      id: 'smoking-missing-codes', title: 'Smoking missing coded as "", "Unknown" and "NA"', variable: 'smoking', rows: renum(smokeRows), check: 'categories',
      finding: `${smokeRows.length} rows have smoking recorded as an empty string, "Unknown" or the text "NA".`,
      options: [
        { id: 'na', label: 'Recode all three to missing, but keep a note: "Unknown" may have been an active answer', correct: true, feedback: 'Correct. They should be one missing code for analysis; whether "Unknown" carries information is a question for the data owner and belongs in the dictionary.' },
        { id: 'category', label: 'Create an "Unknown" smoking category and use it in the model', correct: false, feedback: 'A missing-indicator category is generally biased for confounders unless missingness is related only to the indicator itself (Groenwold et al. 2012).' },
        { id: 'never', label: 'Assume missing means "never smoker"', correct: false, feedback: 'An undocumented assumption that misclassifies smokers and biases the smoking effect toward zero.' },
      ],
    },
    {
      id: 'date-order', title: 'Discharge before admission', variable: 'admit / discharge', rows: renum(dateRows), check: 'cross-field',
      finding: `${dateRows.length} rows have a discharge timestamp earlier than the admission timestamp (negative length of stay).`,
      options: [
        { id: 'query', label: 'Flag and query the source; treat LOS as missing until resolved', correct: true, feedback: 'Correct. Transposition is likely, but confirm before swapping: the timestamps may belong to different encounters.' },
        { id: 'abs', label: 'Take the absolute value of LOS', correct: false, feedback: 'Plausible guess, but an undocumented silent fix. If you swap dates, do it in code with a documented rule after verification.' },
        { id: 'keep', label: 'Keep: negative LOS will average out', correct: false, feedback: 'Negative stays are impossible and will bias every LOS summary and model.' },
      ],
    },
    {
      id: 'bmi-implausible', title: 'Implausible BMI values', variable: 'bmi', rows: renum(bmiRows), check: 'ranges',
      finding: `${bmiRows.length} BMI values are < 10 or > 100 kg/m² (decimal shifts and a keying error).`,
      options: [
        { id: 'na', label: 'Set to missing (or correct from height/weight in the source) and log each change', correct: true, feedback: 'Correct. A BMI of 2.7 is impossible. Recompute from height and weight if available; otherwise treat as missing.' },
        { id: 'times10', label: 'Multiply values < 10 by 10', correct: false, feedback: 'Probably right for some, but guessing without the source is undocumentable; and the value > 100 needs a different fix.' },
        { id: 'keep', label: 'Keep: BMI varies a lot', correct: false, feedback: 'These are outside the biologically possible range.' },
      ],
    },
    {
      id: 'bp-implausible', title: 'Impossible blood pressures', variable: 'sbp / dbp', rows: renum(bpRows), check: 'cross-field',
      finding: 'One systolic BP > 1000 mmHg and two rows where diastolic exceeds systolic (fields transposed).',
      options: [
        { id: 'query', label: 'Set the impossible values to missing pending source verification; document the rule (SBP > 300 or DBP ≥ SBP)', correct: true, feedback: 'Correct. Logical-consistency rules catch errors that univariate range checks miss.' },
        { id: 'swap', label: 'Silently swap DBP and SBP and divide 1000+ values by 10', correct: false, feedback: 'May be right, but must be verified and documented; silent fixes are not reproducible.' },
        { id: 'keep', label: 'Keep', correct: false, feedback: 'An SBP of 1,300 mmHg will distort every BP analysis.' },
      ],
    },
    {
      id: 'genuine-extremes', title: 'Very high creatinine and very long stays', variable: 'creatinine / los_days', rows: renum(extremes), check: 'ranges',
      finding: `${extremes.length} admissions have creatinine > 5 mg/dL or LOS > 30 days. Values are within physiological limits and internally consistent (low eGFR; dates agree).`,
      options: [
        { id: 'keep', label: 'Keep them: extreme but plausible. Check influence later and report a sensitivity analysis', correct: true, feedback: 'Correct. Outliers are not errors. Patients with advanced CKD or long stays are real and often the most important.' },
        { id: 'delete', label: 'Delete values beyond 3 SD', correct: false, feedback: 'Deleting real patients biases estimates and is a common reason findings fail to replicate.' },
        { id: 'winsor', label: 'Winsorize them to the 95th percentile', correct: false, feedback: 'Winsorizing real values discards the information that these patients are sicker; use a robust or appropriately transformed model instead.' },
      ],
    },
  ];
  return { rows: finalRows, issues };
}

let cachedExtract: MessyExtract | null = null;
export function messyExtract(): MessyExtract {
  if (!cachedExtract) cachedExtract = buildMessyExtract();
  return cachedExtract;
}

/** The plausible-range rules used by the audit (documented in the data dictionary). */
export const PLAUSIBLE: Record<string, [number, number, string]> = {
  age: [18, 110, 'years'],
  bmi: [10, 80, 'kg/m²'],
  sbp: [50, 300, 'mmHg'],
  dbp: [20, 200, 'mmHg'],
  heart_rate: [20, 250, 'beats/min'],
  hemoglobin: [3, 25, 'g/dL'],
  creatinine: [0.1, 20, 'mg/dL'],
  egfr: [2, 200, 'mL/min/1.73m²'],
  los_days: [0, 365, 'days'],
};

export { ckdEpi2021 };
