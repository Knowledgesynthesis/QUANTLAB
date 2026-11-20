/** Audit checks computed on the raw extract, plus rule-based cleaning used by the capstone. */
import { median, quantile } from '@/lib/stats/descriptive';
import { ckdEpi2021 } from './cohort';
import { PLAUSIBLE, type RawRow } from './messy';

export const NUMERIC_VARS = ['age', 'bmi', 'sbp', 'dbp', 'heart_rate', 'hemoglobin', 'creatinine', 'egfr', 'los_days'] as const;
export type NumericVar = (typeof NUMERIC_VARS)[number];

const rowKey = (r: RawRow) => {
  const { row: _row, ...rest } = r;
  return JSON.stringify(rest);
};

export function structureCheck(rows: RawRow[]) {
  const keys = new Map<string, number>();
  let exactDup = 0;
  for (const r of rows) {
    const k = rowKey(r);
    if (keys.has(k)) exactDup++;
    keys.set(k, (keys.get(k) ?? 0) + 1);
  }
  const byId = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!byId.has(r.admission_id)) byId.set(r.admission_id, new Set());
    byId.get(r.admission_id)!.add(rowKey(r));
  }
  const conflictingIds = [...byId.entries()].filter(([, s]) => s.size > 1).map(([id]) => id);
  return {
    rows: rows.length,
    uniqueAdmissionIds: byId.size,
    uniquePatients: new Set(rows.map((r) => r.patient_id)).size,
    exactDuplicates: exactDup,
    conflictingIds,
  };
}

export function rangeCheck(rows: RawRow[]) {
  return NUMERIC_VARS.map((v) => {
    const vals = rows.map((r) => r[v]).filter((x): x is number => x !== null && Number.isFinite(x));
    const [lo, hi, unit] = PLAUSIBLE[v];
    return {
      variable: v,
      unit,
      n: vals.length,
      missing: rows.length - vals.length,
      min: Math.min(...vals),
      p1: quantile(vals, 0.01),
      median: median(vals),
      p99: quantile(vals, 0.99),
      max: Math.max(...vals),
      outside: vals.filter((x) => x < lo || x > hi).length,
      eq999: vals.filter((x) => x === 999).length,
      range: `${lo}–${hi}`,
    };
  });
}

export function categoryCheck(rows: RawRow[]) {
  const vars = ['sex', 'smoking', 'site', 'diabetes', 'hypertension', 'readmit_30d'] as const;
  return vars.map((v) => {
    const counts = new Map<string, number>();
    rows.forEach((r) => {
      const k = String(r[v]);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    return { variable: v, levels: [...counts.entries()].sort((a, b) => b[1] - a[1]) };
  });
}

export function bySiteCheck(rows: RawRow[]) {
  const vars: NumericVar[] = ['creatinine', 'egfr', 'hemoglobin', 'bmi', 'age', 'los_days'];
  return ['A', 'B', 'C'].map((s) => {
    const sub = rows.filter((r) => r.site === s);
    const out: Record<string, number | string> = { site: s, n: sub.length };
    for (const v of vars) {
      const vals = sub.map((r) => r[v]).filter((x): x is number => x !== null && x !== 999);
      out[v] = median(vals);
    }
    return out;
  });
}

const normSex = (s: string): 'F' | 'M' | null => {
  const t = s.trim().toLowerCase();
  if (t === 'f' || t === 'female') return 'F';
  if (t === 'm' || t === 'male') return 'M';
  return null;
};

export function crossFieldCheck(rows: RawRow[]) {
  const dischargeBeforeAdmit = rows.filter((r) => new Date(r.discharge) < new Date(r.admit));
  const dbpGeSbp = rows.filter((r) => r.sbp !== null && r.dbp !== null && r.dbp >= r.sbp);
  const sbpImpossible = rows.filter((r) => r.sbp !== null && r.sbp > 300);
  const egfrMismatch = rows.filter((r) => {
    const sex = normSex(r.sex);
    if (r.creatinine === null || r.egfr === null || r.age === null || r.age === 999 || !sex) return false;
    const recomputed = ckdEpi2021(r.creatinine, r.age, sex);
    return Math.abs(recomputed - r.egfr) > 5;
  });
  const mismatchBySite = ['A', 'B', 'C'].map((s) => ({ site: s, n: egfrMismatch.filter((r) => r.site === s).length, of: rows.filter((r) => r.site === s).length }));
  return { dischargeBeforeAdmit, dbpGeSbp, sbpImpossible, egfrMismatch, mismatchBySite };
}

export interface CleaningChoices {
  dedupe: boolean;
  conflicts: 'missing' | 'first';
  convertCreatinine: boolean;
  convertHemoglobin: boolean;
  sentinelsToNA: boolean;
  harmoniseSex: boolean;
  smokingMissing: 'na' | 'category' | 'never';
  dateErrors: 'na' | 'abs' | 'keep';
  implausibleToNA: boolean;
  extremes: 'keep' | 'delete';
}

export const correctChoices: CleaningChoices = {
  dedupe: true, conflicts: 'missing', convertCreatinine: true, convertHemoglobin: true, sentinelsToNA: true, harmoniseSex: true,
  smokingMissing: 'na', dateErrors: 'na', implausibleToNA: true, extremes: 'keep',
};

export interface CleanRow {
  admission_id: string;
  patient_id: string;
  site: string;
  age: number | null;
  sex: string;
  bmi: number | null;
  smoking: string | null;
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

/** Apply cleaning choices to the raw extract; returns cleaned rows and a log of what changed. */
export function applyCleaning(raw: RawRow[], ch: CleaningChoices): { rows: CleanRow[]; log: string[] } {
  const log: string[] = [];
  let rows = raw.map((r) => ({ ...r }));
  if (ch.dedupe) {
    const seen = new Set<string>();
    const before = rows.length;
    rows = rows.filter((r) => {
      const k = rowKey(r);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    log.push(`Removed ${before - rows.length} exact duplicate rows.`);
  }
  // Conflicting duplicates: same admission_id, different content.
  const groups = new Map<string, typeof rows>();
  rows.forEach((r) => {
    if (!groups.has(r.admission_id)) groups.set(r.admission_id, []);
    groups.get(r.admission_id)!.push(r);
  });
  const keep: typeof rows = [];
  let conflicts = 0;
  for (const g of groups.values()) {
    const distinct = new Set(g.map(rowKey));
    if (distinct.size === 1) { keep.push(...g); continue; }
    conflicts++;
    const firstKey = rowKey(g[0]);
    const kept = g.filter((x) => rowKey(x) === firstKey).map((x) => ({ ...x }));
    if (ch.conflicts === 'missing') kept.forEach((x) => { x.hemoglobin = null; });
    keep.push(...kept);
  }
  rows = keep;
  if (conflicts) log.push(`${conflicts} admission IDs with conflicting records: kept one version${ch.conflicts === 'missing' ? ' and set the conflicting hemoglobin to missing' : ' (first in file order)'}.`);

  let nCr = 0, nHb = 0, nSent = 0, nImpl = 0, nDate = 0;
  for (const r of rows) {
    if (ch.convertCreatinine && r.site === 'B' && r.creatinine !== null) { r.creatinine = Math.round((r.creatinine / 88.4) * 100) / 100; nCr++; }
    if (ch.convertHemoglobin && r.hemoglobin !== null && r.hemoglobin > 60) { r.hemoglobin = r.hemoglobin / 10; nHb++; }
    if (ch.sentinelsToNA) {
      if (r.heart_rate === 999) { r.heart_rate = null; nSent++; }
      if (r.age === 999) { r.age = null; nSent++; }
    }
    if (ch.implausibleToNA) {
      if (r.bmi !== null && (r.bmi < PLAUSIBLE.bmi[0] || r.bmi > PLAUSIBLE.bmi[1])) { r.bmi = null; nImpl++; }
      if (r.sbp !== null && r.dbp !== null && (r.sbp > 300 || r.dbp >= r.sbp)) { r.sbp = null; r.dbp = null; nImpl++; }
    }
    if (r.los_days !== null && r.los_days < 0) {
      nDate++;
      if (ch.dateErrors === 'na') r.los_days = null;
      else if (ch.dateErrors === 'abs') r.los_days = Math.abs(r.los_days);
    }
  }
  if (ch.convertCreatinine) log.push(`Converted ${nCr} site-B creatinine values from µmol/L to mg/dL (÷ 88.4).`);
  if (ch.convertHemoglobin) log.push(`Converted ${nHb} hemoglobin values from g/L to g/dL (÷ 10).`);
  if (ch.sentinelsToNA) log.push(`Recoded ${nSent} sentinel values (999) to missing.`);
  if (ch.implausibleToNA) log.push(`Set ${nImpl} implausible BMI/BP records to missing.`);
  if (nDate) log.push(`${nDate} records with discharge before admission: LOS ${ch.dateErrors === 'na' ? 'set to missing' : ch.dateErrors === 'abs' ? 'replaced by its absolute value' : 'left negative'}.`);

  const out: CleanRow[] = rows.map((r) => {
    let smoking: string | null = r.smoking;
    if (['', 'Unknown', 'NA'].includes(r.smoking)) smoking = ch.smokingMissing === 'na' ? null : ch.smokingMissing === 'category' ? 'unknown' : 'never';
    return {
      admission_id: r.admission_id, patient_id: r.patient_id, site: r.site, age: r.age, sex: ch.harmoniseSex ? normSex(r.sex) ?? r.sex : r.sex,
      bmi: r.bmi, smoking, diabetes: r.diabetes, hypertension: r.hypertension, sbp: r.sbp, dbp: r.dbp, heart_rate: r.heart_rate,
      hemoglobin: r.hemoglobin, creatinine: r.creatinine, egfr: r.egfr, los_days: r.los_days, readmit_30d: r.readmit_30d,
    };
  });
  if (ch.harmoniseSex) log.push('Harmonised sex codes to F/M with an explicit lookup.');
  log.push(`Smoking missing codes ("", "Unknown", "NA") → ${ch.smokingMissing === 'na' ? 'missing' : ch.smokingMissing === 'category' ? 'an "unknown" category' : '"never"'}.`);
  let final = out;
  if (ch.extremes === 'delete') {
    const before = final.length;
    final = final.filter((r) => !((r.creatinine ?? 0) > 5 && (r.creatinine ?? 0) < 20) && !((r.los_days ?? 0) > 30));
    log.push(`Deleted ${before - final.length} admissions with extreme but plausible creatinine or LOS.`);
  }
  return { rows: final, log };
}
