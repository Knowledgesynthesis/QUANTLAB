/**
 * Synthetic hospital-admission cohort with a known data-generating process.
 * Fully seeded: the same seed always reproduces the same patients. Because the
 * truth is known, labs can show the bias of each analytic choice directly.
 */
import { Rng, logistic } from '@/lib/stats';

export type Site = 'A' | 'B' | 'C';
export type Sex = 'F' | 'M';
export type Smoking = 'never' | 'former' | 'current';

export interface Admission {
  admission_id: string;
  patient_id: string;
  site: Site;
  admit: string; // ISO datetime
  discharge: string; // ISO datetime
  age: number;
  sex: Sex;
  bmi: number;
  smoking: Smoking;
  diabetes: 0 | 1;
  hypertension: 0 | 1;
  sbp: number;
  dbp: number;
  heart_rate: number;
  hemoglobin: number; // g/dL
  creatinine: number; // mg/dL
  egfr: number; // mL/min/1.73m², CKD-EPI 2021
  los_days: number;
  readmit_30d: 0 | 1;
}

/**
 * CKD-EPI 2021 race-free creatinine equation (Inker et al., NEJM 2021).
 * eGFR = 142 · min(Scr/κ,1)^α · max(Scr/κ,1)^−1.200 · 0.9938^age · 1.012[female]
 */
export function ckdEpi2021(creatinineMgDl: number, age: number, sex: Sex): number {
  const female = sex === 'F';
  const kappa = female ? 0.7 : 0.9;
  const alpha = female ? -0.241 : -0.302;
  const r = creatinineMgDl / kappa;
  return 142 * Math.pow(Math.min(r, 1), alpha) * Math.pow(Math.max(r, 1), -1.2) * Math.pow(0.9938, age) * (female ? 1.012 : 1);
}

/** True model for log(length of stay). Coefficients are on the log scale. */
export const TRUE_LOG_LOS = {
  intercept: 1.25,
  age10: 0.11, // per 10 years above 65
  diabetes: 0.2,
  hypertension: 0.1,
  hemoglobin: -0.06, // per g/dL above 13.5
  logCreatinine: 0.25,
  male: -0.05,
  currentSmoker: 0.1,
  siteB: 0.0,
  siteC: 0.12,
  sigma: 0.42,
} as const;

/** True model for 30-day readmission (log-odds). */
export const TRUE_READMIT = {
  intercept: -1.9,
  age10: 0.15,
  diabetes: 0.45,
  logLos: 0.35,
  hemoglobin: -0.1,
  currentSmoker: 0.4,
  logCreatinine: 0.3,
} as const;

const round = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

function isoAdd(base: Date, days: number): string {
  return new Date(base.getTime() + days * 86400000).toISOString().slice(0, 16);
}

export function generateCohort(nPatients = 560, seed: number | string = 2025): Admission[] {
  const rng = new Rng(`cohort-${seed}`);
  const out: Admission[] = [];
  const start = new Date('2023-01-02T08:00:00Z');
  let admissionCounter = 1;

  for (let p = 0; p < nPatients; p++) {
    const patient_id = `P${String(10000 + p * 7 + rng.int(7))}`;
    const site: Site = (['A', 'B', 'C'] as const)[rng.categorical([0.4, 0.35, 0.25])];
    const age = Math.round(Math.min(98, Math.max(18, rng.normal(65, 15))));
    const sex: Sex = rng.uniform() < 0.52 ? 'F' : 'M';
    const male = sex === 'M' ? 1 : 0;
    const a65 = (age - 65) / 10;
    const bmi = Math.min(52, Math.max(15.5, Math.exp(rng.normal(Math.log(27.5) - 0.006 * a65 * a65, 0.17))));
    const pCurrent = Math.min(0.4, Math.max(0.05, 0.2 - 0.04 * a65));
    const pFormer = Math.min(0.5, Math.max(0.1, 0.28 + 0.03 * a65));
    const smoking: Smoking = (['current', 'former', 'never'] as const)[rng.categorical([pCurrent, pFormer, 1 - pCurrent - pFormer])];
    const diabetes = rng.bernoulli(logistic(-1.6 + 0.3 * a65 + 0.11 * (bmi - 27.5)));
    const hypertension = rng.bernoulli(logistic(-0.1 + 0.5 * a65 + 0.08 * (bmi - 27.5) + 0.5 * diabetes));
    const sbp = Math.round(124 + 3.5 * a65 + 0.6 * (bmi - 27.5) + 11 * hypertension + rng.normal(0, 13));
    const dbp = Math.round(0.42 * sbp + 22 - 1.2 * a65 + rng.normal(0, 6.5));
    const heart_rate = Math.round(80 + 3 * diabetes + rng.normal(0, 13));
    const logCr = Math.log(0.88) + 0.2 * male + 0.07 * a65 + 0.18 * diabetes + 0.1 * hypertension + rng.normal(0, 0.26);
    let creatinine = Math.exp(logCr);
    // A few genuine, plausible extremes (e.g., advanced CKD / dialysis).
    if (rng.uniform() < 0.006) creatinine = 5.5 + rng.uniform() * 3;
    creatinine = round(creatinine, 2);
    const hemoglobin = round(13.2 + 1.3 * male - 0.15 * a65 - 1.1 * Math.max(0, Math.log(creatinine / 1.3)) + rng.normal(0, 1.25), 1);
    const egfr = Math.round(ckdEpi2021(creatinine, age, sex));
    const nAdm = rng.uniform() < 0.08 ? 2 : 1;
    let t0 = rng.uniform() * 640;
    for (let k = 0; k < nAdm; k++) {
      const T = TRUE_LOG_LOS;
      const logLos = T.intercept + T.age10 * a65 + T.diabetes * diabetes + T.hypertension * hypertension + T.hemoglobin * (hemoglobin - 13.5) +
        T.logCreatinine * Math.log(creatinine) + T.male * male + T.currentSmoker * (smoking === 'current' ? 1 : 0) +
        (site === 'C' ? T.siteC : 0) + rng.normal(0, T.sigma);
      const los_days = Math.max(0.2, round(Math.exp(logLos), 1));
      const R = TRUE_READMIT;
      const readmit_30d = rng.bernoulli(
        logistic(R.intercept + R.age10 * a65 + R.diabetes * diabetes + R.logLos * Math.log(los_days) + R.hemoglobin * (hemoglobin - 13.5) +
          R.currentSmoker * (smoking === 'current' ? 1 : 0) + R.logCreatinine * Math.log(creatinine)),
      );
      const admitDate = new Date(start.getTime() + t0 * 86400000 + rng.int(14) * 3600000);
      out.push({
        admission_id: `A${String(admissionCounter++).padStart(5, '0')}`,
        patient_id, site, admit: admitDate.toISOString().slice(0, 16), discharge: isoAdd(admitDate, los_days),
        age, sex, bmi: round(bmi, 1), smoking, diabetes, hypertension, sbp, dbp, heart_rate, hemoglobin, creatinine, egfr,
        los_days, readmit_30d,
      });
      t0 += los_days + 20 + rng.uniform() * 120;
    }
  }
  return out;
}

let cached: Admission[] | null = null;
/** The canonical cohort used across modules. */
export function cohort(): Admission[] {
  if (!cached) cached = generateCohort();
  return cached;
}
