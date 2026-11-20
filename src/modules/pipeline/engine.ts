/**
 * Capstone pipeline: messy extract → cleaning choices → model choices → missing-data
 * method → fit, diagnostics, validation → report. Every choice changes the numbers.
 */
import { messyExtract } from '@/data/messy';
import { applyCleaning, correctChoices, type CleaningChoices, type CleanRow } from '@/data/audit';
import { TRUE_LOG_LOS } from '@/data/cohort';
import { Rng, fitOLS, coefTable, mean, skewness, vif, rcsKnots, rcsBasis, mice, rubinsRules, type OLSFit, type MiceVariable } from '@/lib/stats';

export interface ModelChoices {
  outcome: 'raw' | 'log';
  age: 'linear' | 'spline' | 'omit';
  sex: boolean;
  bmi: 'continuous' | 'obese' | 'omit';
  diabetes: boolean;
  hypertension: boolean;
  hemoglobin: boolean;
  creatinine: 'log' | 'raw' | 'omit';
  egfr: boolean;
  smoking: boolean;
  site: boolean;
  sbp: boolean;
}

export type MissingMethod = 'cca' | 'mean' | 'mi';

export interface PipelineChoices {
  cleaning: CleaningChoices;
  model: ModelChoices;
  missing: MissingMethod;
  robust: boolean;
}

export const defaultChoices: PipelineChoices = {
  cleaning: { dedupe: false, conflicts: 'first', convertCreatinine: false, convertHemoglobin: false, sentinelsToNA: false, harmoniseSex: false, smokingMissing: 'category', dateErrors: 'keep', implausibleToNA: false, extremes: 'keep' },
  model: { outcome: 'raw', age: 'linear', sex: true, bmi: 'continuous', diabetes: true, hypertension: true, hemoglobin: true, creatinine: 'raw', egfr: true, smoking: true, site: false, sbp: false },
  missing: 'cca',
  robust: false,
};

export const recommendedChoices: PipelineChoices = {
  cleaning: correctChoices,
  model: { outcome: 'log', age: 'linear', sex: true, bmi: 'continuous', diabetes: true, hypertension: true, hemoglobin: true, creatinine: 'log', egfr: false, smoking: true, site: true, sbp: false },
  missing: 'mi',
  robust: true,
};

interface Term { key: string; label: string; cols: string[]; truth?: number; truthNote?: string }

interface Prepared {
  knots: number[];
  rows: CleanRow[];
  y: (number | null)[];
  vars: Record<string, (number | null)[]>;
  terms: Term[];
  colNames: string[];
  colTerm: string[];
}

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function prepare(rows: CleanRow[], m: ModelChoices): Prepared {
  const ageV = rows.map((r) => num(r.age));
  const ageObs = ageV.filter((v): v is number => v !== null && v < 200);
  const knots = rcsKnots(ageObs, 4);
  const terms: Term[] = [];
  const vars: Record<string, (number | null)[]> = {};
  const log = m.outcome === 'log';
  const per = (truth: number) => (log ? truth : undefined);
  if (m.age !== 'omit') {
    vars.age = ageV;
    if (m.age === 'linear') terms.push({ key: 'age', label: 'Age (per year)', cols: ['age'], truth: per(TRUE_LOG_LOS.age10 / 10) });
    else terms.push({ key: 'age', label: 'Age (spline, 4 knots)', cols: ['age', 'age′', 'age″'], truthNote: 'non-linear term' });
  }
  if (m.sex) { vars.male = rows.map((r) => (r.sex === 'M' ? 1 : r.sex === 'F' ? 0 : null)); terms.push({ key: 'male', label: 'Male sex', cols: ['male'], truth: per(TRUE_LOG_LOS.male) }); }
  if (m.bmi !== 'omit') {
    vars.bmi = rows.map((r) => num(r.bmi));
    terms.push({ key: 'bmi', label: m.bmi === 'obese' ? 'BMI ≥ 30 (vs < 30)' : 'BMI (per kg/m²)', cols: ['bmi'], truth: per(0), truthNote: 'no direct effect in the generating model' });
  }
  if (m.diabetes) { vars.diabetes = rows.map((r) => r.diabetes); terms.push({ key: 'diabetes', label: 'Diabetes', cols: ['diabetes'], truth: per(TRUE_LOG_LOS.diabetes) }); }
  if (m.hypertension) { vars.hypertension = rows.map((r) => r.hypertension); terms.push({ key: 'hypertension', label: 'Hypertension', cols: ['hypertension'], truth: per(TRUE_LOG_LOS.hypertension) }); }
  if (m.hemoglobin) { vars.hemoglobin = rows.map((r) => num(r.hemoglobin)); terms.push({ key: 'hemoglobin', label: 'Hemoglobin (per g/dL)', cols: ['hemoglobin'], truth: per(TRUE_LOG_LOS.hemoglobin) }); }
  if (m.creatinine !== 'omit') {
    vars.creatinine = rows.map((r) => num(r.creatinine));
    terms.push({ key: 'creatinine', label: m.creatinine === 'log' ? 'log creatinine' : 'Creatinine (per mg/dL)', cols: ['creatinine'], truth: m.creatinine === 'log' ? per(TRUE_LOG_LOS.logCreatinine) : undefined, truthNote: m.creatinine === 'raw' ? 'truth is linear in log creatinine' : undefined });
  }
  if (m.egfr) { vars.egfr = rows.map((r) => num(r.egfr)); terms.push({ key: 'egfr', label: 'eGFR (per mL/min)', cols: ['egfr'], truth: per(0), truthNote: 'no effect given creatinine' }); }
  if (m.smoking) { vars.smoker = rows.map((r) => (r.smoking === null ? null : r.smoking === 'current' ? 1 : 0)); terms.push({ key: 'smoker', label: 'Current smoker', cols: ['smoker'], truth: per(TRUE_LOG_LOS.currentSmoker) }); }
  if (m.site) {
    vars.siteB = rows.map((r) => (r.site === 'B' ? 1 : 0));
    vars.siteC = rows.map((r) => (r.site === 'C' ? 1 : 0));
    terms.push({ key: 'site', label: 'Site B / C (vs A)', cols: ['siteB', 'siteC'], truth: per(TRUE_LOG_LOS.siteC), truthNote: 'site C; site B truth 0' });
  }
  if (m.sbp) { vars.sbp = rows.map((r) => num(r.sbp)); terms.push({ key: 'sbp', label: 'Systolic BP (per mmHg)', cols: ['sbp'], truth: per(0) }); }
  const y = rows.map((r) => {
    const v = num(r.los_days);
    if (v === null) return null;
    if (log) return v > 0 ? Math.log(v) : null;
    return v;
  });
  const colNames: string[] = [];
  const colTerm: string[] = [];
  terms.forEach((t) => t.cols.forEach((c) => { colNames.push(c); colTerm.push(t.key); }));
  return { knots, rows, y, vars, terms, colNames, colTerm };
}

/** Build the design matrix row for one observation given completed variable values. */
function designRow(v: Record<string, number>, m: ModelChoices, knots: number[]): number[] {
  const row = [1];
  if (m.age === 'linear') row.push(v.age);
  if (m.age === 'spline') row.push(...rcsBasis(v.age, knots));
  if (m.sex) row.push(v.male);
  if (m.bmi === 'continuous') row.push(v.bmi);
  if (m.bmi === 'obese') row.push(v.bmi >= 30 ? 1 : 0);
  if (m.diabetes) row.push(v.diabetes);
  if (m.hypertension) row.push(v.hypertension);
  if (m.hemoglobin) row.push(v.hemoglobin);
  if (m.creatinine === 'log') row.push(Math.log(Math.max(v.creatinine, 1e-3)));
  if (m.creatinine === 'raw') row.push(v.creatinine);
  if (m.egfr) row.push(v.egfr);
  if (m.smoking) row.push(v.smoker);
  if (m.site) row.push(v.siteB, v.siteC);
  if (m.sbp) row.push(v.sbp);
  return row;
}

export interface CoefRow { term: string; label: string; estimate: number; se: number; lo: number; hi: number; p: number; truth?: number; truthNote?: string }

export interface PipelineResult {
  cleaningLog: string[];
  nRaw: number;
  nClean: number;
  nAnalysed: number;
  nMissingOutcome: number;
  missingByVar: { name: string; n: number }[];
  completeCases: number;
  coefs: CoefRow[];
  fit: OLSFit;
  vifs: { term: string; vif: number }[];
  r2: number;
  apparentR2: number;
  correctedR2: number;
  calibrationSlope: number;
  residualSkew: number;
  m: number;
  issues: { severity: 'major' | 'minor'; text: string }[];
  score: number;
  knots: number[];
}

export function runPipeline(ch: PipelineChoices, seed = 2025): PipelineResult {
  const raw = messyExtract().rows;
  const { rows, log: cleaningLog } = applyCleaning(raw, ch.cleaning);
  const m = ch.model;
  const prep = prepare(rows, m);
  const knots = prep.knots;
  const rng = new Rng(`pipeline-${seed}`);
  const varNames = Object.keys(prep.vars);
  // Rows with an observed outcome are analysed; outcomes are never imputed.
  const okY = prep.y.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
  const nMissingOutcome = prep.y.length - okY.length;
  const missingByVar = varNames.map((nm) => ({ name: nm, n: okY.filter((i) => prep.vars[nm][i] === null).length })).filter((x) => x.n > 0);
  const complete = okY.filter((i) => varNames.every((nm) => prep.vars[nm][i] !== null));
  const names = ['(Intercept)', ...prep.colNames];

  const fitOn = (idx: number[], values: Record<string, number[] | (number | null)[]>) => {
    const X = idx.map((i) => designRow(Object.fromEntries(varNames.map((nm) => [nm, values[nm][i] as number])), m, knots));
    const y = idx.map((i) => prep.y[i] as number);
    return { X, y, fit: fitOLS(X, y, names) };
  };

  let coefs: CoefRow[];
  let fit: OLSFit;
  let analysedIdx: number[];
  let analysedValues: Record<string, (number | null)[]> = prep.vars;
  let nImp = 1;
  const level = 0.95;

  if (ch.missing === 'mi' && missingByVar.length > 0) {
    nImp = 10;
    const incomplete: MiceVariable[] = missingByVar.map(({ name }) => ({
      name,
      values: okY.map((i) => prep.vars[name][i]),
      method: ['male', 'smoker', 'diabetes', 'hypertension', 'siteB', 'siteC'].includes(name) ? 'logreg' : 'pmm',
    }));
    const completeVars = [
      { name: 'outcome', values: okY.map((i) => prep.y[i] as number) },
      ...varNames.filter((nm) => !missingByVar.some((x) => x.name === nm)).map((nm) => ({ name: nm, values: okY.map((i) => prep.vars[nm][i] as number) })),
    ];
    // Auxiliary variable: site (predicts missingness of BMI) even if not in the analysis model.
    if (!varNames.includes('siteC')) completeVars.push({ name: 'siteC_aux', values: okY.map((i) => (rows[i].site === 'C' ? 1 : 0)) });
    const imps = mice(incomplete, completeVars, nImp, rng, 8);
    const ests: number[][] = [], vars: number[][] = [];
    let firstFit: OLSFit | null = null;
    imps.forEach((imp) => {
      const values: Record<string, number[]> = {};
      varNames.forEach((nm) => { values[nm] = okY.map((i, k) => (imp[nm] ? imp[nm][k] : (prep.vars[nm][i] as number))); });
      const X = okY.map((_, k) => designRow(Object.fromEntries(varNames.map((nm) => [nm, values[nm][k]])), m, knots));
      const y = okY.map((i) => prep.y[i] as number);
      const f = fitOLS(X, y, names);
      if (!firstFit) firstFit = f;
      const tab = coefTable(f, ch.robust ? 'HC3' : 'classical');
      ests.push(tab.map((t) => t.estimate));
      vars.push(tab.map((t) => t.se ** 2));
    });
    fit = firstFit!;
    analysedIdx = okY;
    coefs = names.map((nm, j) => {
      const pooled = rubinsRules(ests.map((e) => e[j]), vars.map((v) => v[j]), fit.dfResid, level);
      return { term: nm, label: nm, estimate: pooled.estimate, se: pooled.se, lo: pooled.ciLow, hi: pooled.ciHigh, p: pooled.p };
    });
  } else {
    let idx = complete;
    if (ch.missing === 'mean') {
      idx = okY;
      analysedValues = {};
      varNames.forEach((nm) => {
        const obs = okY.map((i) => prep.vars[nm][i]).filter((v): v is number => v !== null);
        const mu = mean(obs);
        analysedValues[nm] = prep.vars[nm].map((v) => (v === null ? mu : v));
      });
    }
    const r = fitOn(idx, analysedValues);
    fit = r.fit;
    analysedIdx = idx;
    const tab = coefTable(fit, ch.robust ? 'HC3' : 'classical', level);
    coefs = tab.map((t) => ({ term: t.name, label: t.name, estimate: t.estimate, se: t.se, lo: t.ciLow, hi: t.ciHigh, p: t.p }));
  }

  // Attach labels and truth to the first column of each term.
  const out: CoefRow[] = coefs.map((c) => {
    const k = prep.colNames.indexOf(c.term);
    const term = k >= 0 ? prep.terms.find((t) => t.key === prep.colTerm[k]) : undefined;
    const label = term ? (term.cols.length > 1 ? `${term.label}: ${c.term}` : term.label) : c.term;
    let truth = term && term.cols[0] === c.term ? term.truth : undefined;
    if (term?.key === 'site') truth = c.term === 'siteB' ? (m.outcome === 'log' ? 0 : undefined) : term.truth;
    if (term?.key === 'bmi' && m.bmi === 'obese') truth = m.outcome === 'log' ? 0 : undefined;
    return { ...c, label, truth, truthNote: term?.truthNote };
  });

  // Collinearity on the analysed design (excluding intercept).
  const Xd = fit.X.map((r) => r.slice(1));
  const cols = prep.colNames.map((_, j) => Xd.map((r) => r[j]));
  const vv = cols.length > 1 ? vif(cols) : [1];
  const vifs = prep.colNames.map((nm, j) => ({ term: nm, vif: vv[j] }));

  // Bootstrap optimism for R² and calibration slope (on the analysed / first completed data).
  const X = fit.X, Y = fit.y;
  const B = 60;
  let optR2 = 0, optSlope = 0;
  const r2of = (coef: number[], Xe: number[][], Ye: number[]) => {
    const pred = Xe.map((r) => r.reduce((s, v, j) => s + v * coef[j], 0));
    const my = mean(Ye);
    const sse = Ye.reduce((s, v, i) => s + (v - pred[i]) ** 2, 0);
    const sst = Ye.reduce((s, v) => s + (v - my) ** 2, 0);
    const mp = mean(pred);
    const slope = pred.reduce((s, p, i) => s + (p - mp) * (Ye[i] - my), 0) / pred.reduce((s, p) => s + (p - mp) ** 2, 0);
    return { r2: 1 - sse / sst, slope };
  };
  const brng = new Rng(`pipeline-boot-${seed}`);
  for (let b = 0; b < B; b++) {
    const idx = brng.resampleIndices(X.length);
    const Xb = idx.map((i) => X[i]), Yb = idx.map((i) => Y[i]);
    try {
      const fb = fitOLS(Xb, Yb, names);
      const coefFull = names.map((_, j) => { const k = fb.keptColumns.indexOf(j); return k >= 0 ? fb.coef[k] : 0; });
      const onBoot = r2of(coefFull, Xb, Yb), onOrig = r2of(coefFull, X, Y);
      optR2 += onBoot.r2 - onOrig.r2;
      optSlope += onBoot.slope - onOrig.slope;
    } catch {
      /* singular bootstrap sample: skip */
    }
  }
  const apparentR2 = fit.r2;
  const correctedR2 = apparentR2 - optR2 / B;
  const calibrationSlope = 1 - optSlope / B;

  // Reviewer report
  const issues: PipelineResult['issues'] = [];
  const c = ch.cleaning;
  if (!c.dedupe) issues.push({ severity: 'major', text: 'Six exact duplicate admissions were analysed twice, inflating n and shrinking standard errors.' });
  if (c.conflicts === 'first') issues.push({ severity: 'minor', text: 'Conflicting duplicate records were resolved by file order, which is arbitrary and not reproducible across extracts.' });
  if (!c.convertCreatinine && m.creatinine !== 'omit') issues.push({ severity: 'major', text: 'Creatinine from site B is in µmol/L and was analysed as mg/dL; the creatinine coefficient is meaningless and confounded with site.' });
  if (!c.convertHemoglobin && m.hemoglobin) issues.push({ severity: 'major', text: 'Three hemoglobin values recorded in g/L (≈130) were analysed as g/dL.' });
  if (!c.sentinelsToNA && m.age !== 'omit') issues.push({ severity: 'major', text: 'Age = 999 sentinel codes were analysed as real ages.' });
  if (!c.harmoniseSex && m.sex) issues.push({ severity: 'major', text: 'Sex was not harmonised; most site B and C patients were not coded F/M and dropped out of the sex variable.' });
  if (c.smokingMissing === 'never' && m.smoking) issues.push({ severity: 'major', text: 'Missing smoking status was assumed to mean "never", misclassifying smokers.' });
  if (c.smokingMissing === 'category' && m.smoking) issues.push({ severity: 'minor', text: 'Missing smoking was treated as "not current" by the binary smoking variable (equivalent to a missing-indicator approach); consider imputation.' });
  if (c.dateErrors !== 'na') issues.push({ severity: c.dateErrors === 'keep' ? 'major' : 'minor', text: c.dateErrors === 'keep' ? 'Admissions with discharge before admission were kept with negative length of stay.' : 'Negative stays were "fixed" by taking absolute values without verification.' });
  if (!c.implausibleToNA && (m.bmi !== 'omit' || m.sbp)) issues.push({ severity: 'major', text: 'Implausible BMI/BP values (e.g., BMI 2.7, SBP > 1000) were analysed as real.' });
  if (c.extremes === 'delete') issues.push({ severity: 'major', text: 'Genuine patients with extreme but plausible values were deleted, biasing the sample toward healthier patients.' });
  if (m.outcome === 'raw') issues.push({ severity: 'major', text: `Length of stay was modelled on the raw scale; residuals are skewed (skewness ${skewness(fit.residuals).toFixed(2)}) and heteroscedastic. A log scale or log-link GLM fits the data.` });
  if (m.bmi === 'obese') issues.push({ severity: 'minor', text: 'BMI was dichotomized at 30, discarding information.' });
  if (m.creatinine !== 'omit' && m.egfr) issues.push({ severity: 'major', text: `Both creatinine and eGFR were included; eGFR is computed from creatinine, age and sex (VIF ${Math.max(...vifs.filter((v) => ['creatinine', 'egfr'].includes(v.term)).map((v) => v.vif)).toFixed(1)}). Their coefficients cannot be interpreted separately.` });
  if (m.creatinine === 'raw') issues.push({ severity: 'minor', text: 'Creatinine entered linearly although its relationship with log LOS is linear on the log scale.' });
  if (m.age === 'omit' || !m.diabetes || m.creatinine === 'omit' || !m.hemoglobin) issues.push({ severity: 'minor', text: 'Important prognostic factors (age, diabetes, hemoglobin, kidney function) were omitted; adjusted estimates may be confounded.' });
  if (!m.site) issues.push({ severity: 'minor', text: 'Site was not adjusted for, although case-mix and length of stay differ by site.' });
  if (ch.missing === 'mean') issues.push({ severity: 'major', text: 'Single mean imputation was used; standard errors are too small and associations attenuated.' });
  if (ch.missing === 'cca' && missingByVar.length) issues.push({ severity: 'minor', text: `Complete-case analysis discarded ${okY.length - complete.length} of ${okY.length} admissions (${((1 - complete.length / okY.length) * 100).toFixed(0)}%); justify why missingness is unrelated to the outcome, or use multiple imputation.` });
  if (!ch.robust) issues.push({ severity: 'minor', text: 'Classical standard errors were used; with heteroscedastic residuals HC3 SEs are safer.' });
  issues.push({ severity: 'minor', text: `${rows.length - new Set(rows.map((r) => r.patient_id)).size} patients contribute more than one admission; consider patient-clustered SEs or an index-admission rule.` });
  const score = Math.max(0, 100 - issues.reduce((s, i) => s + (i.severity === 'major' ? 12 : 4), 0) + 4);

  return {
    cleaningLog, nRaw: raw.length, nClean: rows.length, nAnalysed: analysedIdx.length, nMissingOutcome, missingByVar, completeCases: complete.length,
    coefs: out, fit, vifs, r2: fit.r2, apparentR2, correctedR2, calibrationSlope, residualSkew: skewness(fit.residuals), m: nImp, issues, score, knots,
  };
}

export function methodsText(ch: PipelineChoices, r: PipelineResult): string {
  const m = ch.model;
  const parts: string[] = [];
  parts.push(`We analysed a ${r.nRaw}-row extract of hospital admissions from three sites. ${r.cleaningLog.join(' ')} The analysis dataset contained ${r.nClean} admissions${r.nMissingOutcome ? `, of which ${r.nMissingOutcome} had no valid length of stay and were excluded` : ''}.`);
  const preds = [m.age !== 'omit' && (m.age === 'spline' ? 'age (restricted cubic spline, 4 knots)' : 'age'), m.sex && 'sex', m.bmi !== 'omit' && (m.bmi === 'obese' ? 'obesity (BMI ≥ 30)' : 'BMI'), m.diabetes && 'diabetes', m.hypertension && 'hypertension', m.hemoglobin && 'hemoglobin', m.creatinine !== 'omit' && (m.creatinine === 'log' ? 'log-transformed creatinine' : 'creatinine'), m.egfr && 'eGFR (CKD-EPI 2021)', m.smoking && 'current smoking', m.site && 'site', m.sbp && 'systolic blood pressure'].filter(Boolean);
  parts.push(`${m.outcome === 'log' ? 'Length of stay was log-transformed and modelled' : 'Length of stay (days) was modelled'} by linear regression on ${preds.join(', ')}.${m.outcome === 'log' ? ' Coefficients are reported as ratios of geometric means with 95% confidence intervals.' : ''}`);
  if (r.missingByVar.length) {
    const desc = r.missingByVar.map((v) => `${v.name} (${v.n})`).join(', ');
    if (ch.missing === 'mi') parts.push(`Missing values in ${desc} were multiply imputed by chained equations (${r.m} imputations; predictive mean matching for continuous and logistic regression for binary variables), with the outcome, all model covariates and site in the imputation models, assuming missing at random; estimates were pooled with Rubin's rules.`);
    if (ch.missing === 'cca') parts.push(`Analyses were restricted to the ${r.completeCases} admissions with complete data (missing: ${desc}).`);
    if (ch.missing === 'mean') parts.push(`Missing values (${desc}) were replaced by the variable mean.`);
  }
  parts.push(`Model assumptions were assessed with residual-versus-fitted, normal Q-Q, scale-location and leverage plots; influential observations were identified by Cook's distance. ${ch.robust ? 'HC3 heteroscedasticity-consistent standard errors were used.' : ''}`.trim());
  parts.push(`Optimism in R² and the calibration slope was estimated with ${60} bootstrap resamples.`);
  return parts.join(' ');
}

export function resultsText(ch: PipelineChoices, r: PipelineResult): string {
  const log = ch.model.outcome === 'log';
  const fmtEff = (c: CoefRow) => (log ? `${Math.exp(c.estimate).toFixed(2)} (95% CI ${Math.exp(c.lo).toFixed(2)}–${Math.exp(c.hi).toFixed(2)})` : `${c.estimate.toFixed(2)} days (95% CI ${c.lo.toFixed(2)} to ${c.hi.toFixed(2)})`);
  const d = r.coefs.find((c) => c.term === 'diabetes');
  const parts = [`${r.nAnalysed} admissions were analysed.`];
  if (d) parts.push(`Diabetes was associated with ${log ? 'a geometric-mean length of stay ratio of' : 'a difference in length of stay of'} ${fmtEff(d)}.`);
  parts.push(`The model explained ${(r.apparentR2 * 100).toFixed(1)}% of the variance (optimism-corrected ${(r.correctedR2 * 100).toFixed(1)}%; calibration slope ${r.calibrationSlope.toFixed(2)}).`);
  return parts.join(' ');
}

export function rScript(ch: PipelineChoices, r: PipelineResult): string {
  const m = ch.model;
  const c = ch.cleaning;
  const terms = [
    m.age === 'linear' && 'age', m.age === 'spline' && 'rcs(age, 4)', m.sex && 'sex', m.bmi === 'continuous' && 'bmi', m.bmi === 'obese' && 'I(bmi >= 30)',
    m.diabetes && 'diabetes', m.hypertension && 'hypertension', m.hemoglobin && 'hemoglobin', m.creatinine === 'log' && 'log(creatinine)', m.creatinine === 'raw' && 'creatinine',
    m.egfr && 'egfr', m.smoking && 'current_smoker', m.site && 'site', m.sbp && 'sbp',
  ].filter(Boolean).join(' + ');
  const y = m.outcome === 'log' ? 'log(los_days)' : 'los_days';
  const lines = [
    '# QuantLab capstone – generated analysis script',
    `# Generated ${new Date().toISOString().slice(0, 10)}; mirrors the choices made in the app.`,
    'library(dplyr); library(readr); library(rms); library(sandwich); library(lmtest)',
    ch.missing === 'mi' ? 'library(mice)' : '',
    'set.seed(2025)',
    '',
    'raw <- read_csv("data/raw/extract.csv", col_types = cols(.default = "c"))',
    'dat <- raw |>',
    c.dedupe ? '  distinct() |>' : '  # NOTE: duplicates not removed',
    '  mutate(across(c(age, bmi, sbp, dbp, heart_rate, hemoglobin, creatinine, egfr), as.numeric),',
    c.sentinelsToNA ? '         across(c(age, heart_rate), ~ na_if(.x, 999)),' : '',
    c.convertCreatinine ? '         creatinine = if_else(site == "B", creatinine / 88.4, creatinine),' : '',
    c.convertHemoglobin ? '         hemoglobin = if_else(hemoglobin > 60, hemoglobin / 10, hemoglobin),' : '',
    c.harmoniseSex ? '         sex = recode(tolower(sex), f = "F", female = "F", m = "M", male = "M"),' : '',
    c.implausibleToNA ? '         bmi = if_else(bmi < 10 | bmi > 80, NA_real_, bmi),' : '',
    `         smoking = ${c.smokingMissing === 'na' ? 'na_if(na_if(na_if(smoking, ""), "Unknown"), "NA")' : c.smokingMissing === 'never' ? 'if_else(smoking %in% c("", "Unknown", "NA"), "never", smoking)' : 'if_else(smoking %in% c("", "Unknown", "NA"), "unknown", smoking)'},`,
    '         current_smoker = as.integer(smoking == "current"),',
    '         los_days = as.numeric(difftime(as.POSIXct(discharge), as.POSIXct(admit), units = "days")),',
    c.dateErrors === 'na' ? '         los_days = if_else(los_days < 0, NA_real_, los_days))' : c.dateErrors === 'abs' ? '         los_days = abs(los_days))' : '         los_days = los_days)',
    'dat <- filter(dat, !is.na(los_days))',
    '',
    ch.missing === 'mi'
      ? [`imp <- mice(dat, m = ${Math.max(r.m, 40)}, method = "pmm", seed = 2025)   # outcome + site included as predictors`, `fit <- with(imp, lm(${y} ~ ${terms}))`, `summary(pool(fit), conf.int = TRUE${m.outcome === 'log' ? ', exponentiate = TRUE' : ''})`].join('\n')
      : ch.missing === 'mean'
        ? ['dat <- mutate(dat, across(where(is.numeric), ~ coalesce(.x, mean(.x, na.rm = TRUE))))   # not recommended', `fit <- lm(${y} ~ ${terms}, data = dat)`].join('\n')
        : [`fit <- lm(${y} ~ ${terms}, data = dat)   # complete cases`].join('\n'),
    ch.missing !== 'mi' ? (ch.robust ? 'coeftest(fit, vcov. = vcovHC(fit, type = "HC3"))' : 'summary(fit)') : '',
    ch.missing !== 'mi' ? 'par(mfrow = c(2, 2)); plot(fit)        # diagnostics' : '',
    ch.missing !== 'mi' ? 'car::vif(fit)' : '',
    '',
    '# Internal validation (bootstrap optimism)',
    `f_rms <- ols(${y} ~ ${terms}, data = ${ch.missing === 'mi' ? 'complete(imp, 1)' : 'dat'}, x = TRUE, y = TRUE)`,
    'validate(f_rms, B = 500)',
    'sessionInfo()',
  ];
  return lines.filter((l) => l !== '').join('\n');
}

