import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, RotateCcw, Wand2, CircleAlert, CircleCheck, Info } from 'lucide-react';
import type { CleaningChoices } from '@/data/audit';
import { Button, Callout, Checkbox, Code, DataTable, Segmented, Stat, CopyButton } from '@/components/ui';
import { Cite, Lab, P } from '@/components/learning';
import { cn, defer, downloadText, fmt, fmtP } from '@/lib/utils';
import { DiagnosticPanel } from '@/modules/diagnostics/plots';
import { defaultChoices, methodsText, recommendedChoices, resultsText, rScript, runPipeline, type ModelChoices, type PipelineChoices, type PipelineResult } from './engine';

const STORAGE = 'quantlab-capstone-v1';
const steps = ['Clean', 'Model', 'Missing data', 'Fit & diagnose', 'Validate', 'Report'] as const;

function load(): PipelineChoices {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return { ...defaultChoices, ...JSON.parse(raw) };
  } catch { /* storage unavailable */ }
  return defaultChoices;
}

function YesNo({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return <Checkbox label={label} checked={value} onChange={onChange} hint={hint} />;
}

function CleanStep({ c, set }: { c: CleaningChoices; set: (c: CleaningChoices) => void }) {
  const u = <K extends keyof CleaningChoices>(k: K, v: CleaningChoices[K]) => set({ ...c, [k]: v });
  return (
    <div className="space-y-4">
      <P>The extract from Module 1. Decide how each known problem is handled. (Revisit the Audit lab if unsure.)</P>
      <div className="grid gap-3 sm:grid-cols-2">
        <YesNo label="Remove exact duplicate rows" value={c.dedupe} onChange={(v) => u('dedupe', v)} />
        <YesNo label="Convert site-B creatinine from µmol/L" value={c.convertCreatinine} onChange={(v) => u('convertCreatinine', v)} />
        <YesNo label="Convert hemoglobin > 60 from g/L to g/dL" value={c.convertHemoglobin} onChange={(v) => u('convertHemoglobin', v)} />
        <YesNo label="Recode sentinel 999 to missing" value={c.sentinelsToNA} onChange={(v) => u('sentinelsToNA', v)} />
        <YesNo label="Harmonise sex codes to F/M" value={c.harmoniseSex} onChange={(v) => u('harmoniseSex', v)} />
        <YesNo label="Set impossible BMI/BP values to missing" value={c.implausibleToNA} onChange={(v) => u('implausibleToNA', v)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmented size="sm" label="Conflicting duplicate records" value={c.conflicts} onChange={(v) => u('conflicts', v)} options={[{ value: 'missing', label: 'Set value missing' }, { value: 'first', label: 'Keep first row' }]} />
        <Segmented size="sm" label="Smoking coded '', 'Unknown', 'NA'" value={c.smokingMissing} onChange={(v) => u('smokingMissing', v)} options={[{ value: 'na', label: 'Missing' }, { value: 'category', label: '"Unknown" level' }, { value: 'never', label: 'Never smoker' }]} />
        <Segmented size="sm" label="Discharge before admission" value={c.dateErrors} onChange={(v) => u('dateErrors', v)} options={[{ value: 'na', label: 'LOS missing' }, { value: 'abs', label: '|LOS|' }, { value: 'keep', label: 'Keep' }]} />
        <Segmented size="sm" label="Extreme but plausible patients" value={c.extremes} onChange={(v) => u('extremes', v)} options={[{ value: 'keep', label: 'Keep' }, { value: 'delete', label: 'Delete' }]} />
      </div>
    </div>
  );
}

function ModelStep({ m, set }: { m: ModelChoices; set: (m: ModelChoices) => void }) {
  const u = <K extends keyof ModelChoices>(k: K, v: ModelChoices[K]) => set({ ...m, [k]: v });
  return (
    <div className="space-y-4">
      <P>Question: which patient factors are associated with length of stay? Choose the outcome scale, the covariates and their functional form.</P>
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmented label="Outcome" value={m.outcome} onChange={(v) => u('outcome', v)} options={[{ value: 'raw', label: 'LOS (days)' }, { value: 'log', label: 'log(LOS)' }]} />
        <Segmented label="Age" value={m.age} onChange={(v) => u('age', v)} options={[{ value: 'linear', label: 'Linear' }, { value: 'spline', label: 'Spline' }, { value: 'omit', label: 'Omit' }]} />
        <Segmented label="BMI" value={m.bmi} onChange={(v) => u('bmi', v)} options={[{ value: 'continuous', label: 'Continuous' }, { value: 'obese', label: '≥ 30 vs < 30' }, { value: 'omit', label: 'Omit' }]} />
        <Segmented label="Creatinine" value={m.creatinine} onChange={(v) => u('creatinine', v)} options={[{ value: 'log', label: 'log' }, { value: 'raw', label: 'Raw' }, { value: 'omit', label: 'Omit' }]} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <YesNo label="Sex" value={m.sex} onChange={(v) => u('sex', v)} />
        <YesNo label="Diabetes" value={m.diabetes} onChange={(v) => u('diabetes', v)} />
        <YesNo label="Hypertension" value={m.hypertension} onChange={(v) => u('hypertension', v)} />
        <YesNo label="Hemoglobin" value={m.hemoglobin} onChange={(v) => u('hemoglobin', v)} />
        <YesNo label="eGFR" value={m.egfr} onChange={(v) => u('egfr', v)} />
        <YesNo label="Current smoker" value={m.smoking} onChange={(v) => u('smoking', v)} />
        <YesNo label="Site" value={m.site} onChange={(v) => u('site', v)} />
        <YesNo label="Systolic BP" value={m.sbp} onChange={(v) => u('sbp', v)} />
      </div>
    </div>
  );
}

export default function Capstone() {
  const [ch, setCh] = useState<PipelineChoices>(load);
  const [step, setStep] = useState(0);
  const [res, setRes] = useState<PipelineResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify(ch)); } catch { /* ignore */ }
    let cancelled = false;
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const r = await defer(() => runPipeline(ch));
        if (!cancelled) { setRes(r); setErr(null); }
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 150);
    return () => { cancelled = true; clearTimeout(t); };
  }, [ch]);

  const log = ch.model.outcome === 'log';
  const methods = res ? methodsText(ch, res) : '';
  const results = res ? resultsText(ch, res) : '';
  const script = res ? rScript(ch, res) : '';
  const major = res?.issues.filter((i) => i.severity === 'major') ?? [];
  const minor = res?.issues.filter((i) => i.severity === 'minor') ?? [];
  const exportReport = () => {
    if (!res) return;
    const md = [
      '# Length-of-stay analysis – QuantLab capstone', '', `Rigor score: ${res.score}/100`, '', '## Methods', methods, '', '## Results', results, '',
      '| Term | Estimate | 95% CI | p |', '|---|---|---|---|',
      ...res.coefs.map((c) => `| ${c.label} | ${log && c.term !== '(Intercept)' ? Math.exp(c.estimate).toFixed(3) : c.estimate.toFixed(3)} | ${log && c.term !== '(Intercept)' ? `${Math.exp(c.lo).toFixed(3)}–${Math.exp(c.hi).toFixed(3)}` : `${c.lo.toFixed(3)} to ${c.hi.toFixed(3)}`} | ${fmtP(c.p)} |`),
      '', '## Reviewer comments', ...res.issues.map((i) => `- **${i.severity}**: ${i.text}`),
    ].join('\n');
    downloadText('capstone-report.md', md, 'text/markdown');
  };

  return (
    <div>
      <P>
        Seven earlier modules, one dataset. Take the messy extract from Module 1 to a reported analysis of length of stay. Each choice is run live through cleaning, missing-data
        handling, model fitting, diagnostics and bootstrap validation, and the generating model is known, so you can compare your estimates with the truth. A reviewer report
        grades the defensibility of your choices.
      </P>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setCh(defaultChoices)}><RotateCcw className="h-4 w-4" /> Start naive</Button>
        <Button size="sm" variant="outline" onClick={() => setCh(recommendedChoices)}><Wand2 className="h-4 w-4" /> Load recommended choices</Button>
      </div>

      <div className="sticky top-14 z-10 -mx-4 border-b bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <ol className="scrollbar-none flex gap-1 overflow-x-auto">
          {steps.map((s, i) => (
            <li key={s}>
              <button type="button" onClick={() => setStep(i)} aria-current={step === i ? 'step' : undefined} className={cn('flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm', step === i ? 'bg-primary-soft font-medium text-primary' : 'text-muted-foreground hover:bg-muted')}>
                <span className="tabular text-xs">{i + 1}</span>{s}
              </button>
            </li>
          ))}
          <li className="ml-auto flex shrink-0 items-center gap-2 pl-2 text-xs text-muted-foreground">
            {busy ? 'Computing…' : res ? <>Score <span className={cn('font-semibold tabular', res.score >= 80 ? 'text-good-text' : res.score >= 50 ? 'text-warning-text' : 'text-critical-text')}>{res.score}</span></> : null}
          </li>
        </ol>
      </div>

      <Lab title={`Step ${step + 1}: ${steps[step]}`}>
        {err && <Callout kind="mistake" title="This combination cannot be fitted">{err}</Callout>}
        {step === 0 && (
          <>
            <CleanStep c={ch.cleaning} set={(cleaning) => setCh({ ...ch, cleaning })} />
            {res && (
              <ol className="space-y-1 rounded-lg bg-muted/60 p-3 text-sm">
                {res.cleaningLog.map((l, i) => <li key={i}>{l}</li>)}
                <li className="font-semibold">{res.nRaw} raw rows → {res.nClean} admissions.</li>
              </ol>
            )}
          </>
        )}
        {step === 1 && <ModelStep m={ch.model} set={(model) => setCh({ ...ch, model })} />}
        {step === 2 && (
          <div className="space-y-4">
            <Segmented label="Missing covariate values" value={ch.missing} onChange={(missing) => setCh({ ...ch, missing })} options={[{ value: 'cca', label: 'Complete cases' }, { value: 'mean', label: 'Mean imputation' }, { value: 'mi', label: 'Multiple imputation' }]} />
            <Checkbox label="Use HC3 robust standard errors" checked={ch.robust} onChange={(robust) => setCh({ ...ch, robust })} />
            {res && (
              <>
                <DataTable head={['Variable in model', 'Missing (among rows with an outcome)']} align={['l', 'r']} rows={res.missingByVar.length ? res.missingByVar.map((v) => [v.name, v.n]) : [['none', 0]]} />
                <p className="text-sm text-muted-foreground">
                  Complete cases: {res.completeCases}. {ch.missing === 'mi' ? `MI uses ${res.m} imputations here for speed (use ≥ 40 in practice); the outcome and site are in the imputation models.` : ''} Rows without a valid outcome
                  ({res.nMissingOutcome}) are excluded; outcomes are not imputed.
                </p>
              </>
            )}
          </div>
        )}
        {step === 3 && res && (
          <div className="space-y-4">
            <DataTable
              caption={log ? 'Coefficients on the log scale; ratio = exp(estimate). Truth = value in the data-generating model.' : 'Coefficients in days. The generating model is on the log scale, so the truth is not directly comparable.'}
              head={['Term', 'Estimate', log ? 'Ratio' : 'SE', '95% CI', 'p', 'Truth']}
              align={['l', 'r', 'r', 'r', 'r', 'r']}
              rows={res.coefs.filter((c) => c.term !== '(Intercept)').map((c) => {
                const covers = c.truth === undefined || (c.lo <= c.truth && c.truth <= c.hi);
                return [
                  c.label, fmt(c.estimate, 3), log ? fmt(Math.exp(c.estimate), 3) : fmt(c.se, 3), `${fmt(c.lo, 3)} to ${fmt(c.hi, 3)}`, fmtP(c.p),
                  c.truth === undefined ? <span className="text-xs text-muted-foreground">{c.truthNote ?? '—'}</span> : <span className={covers ? 'text-good-text' : 'font-semibold text-critical-text'}>{fmt(c.truth, 3)}</span>,
                ];
              })}
            />
            <DataTable head={['Column', 'VIF']} align={['l', 'r']} rows={res.vifs.map((v) => [v.term, <span className={v.vif > 10 ? 'font-semibold text-critical-text' : v.vif > 5 ? 'text-warning-text' : ''}>{fmt(v.vif, 2)}</span>])} />
            <DiagnosticPanel fit={res.fit} height={210} />
            <p className="text-xs text-muted-foreground">Diagnostics shown for {ch.missing === 'mi' ? 'the first imputed dataset' : 'the analysed data'}. Residual skewness: {fmt(res.residualSkew, 2)}.</p>
          </div>
        )}
        {step === 4 && res && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Apparent R²" value={fmt(res.apparentR2, 3)} />
              <Stat label="Optimism-corrected R²" value={fmt(res.correctedR2, 3)} />
              <Stat label="Calibration slope (bootstrap)" value={fmt(res.calibrationSlope, 3)} tone={res.calibrationSlope < 0.9 ? 'warning' : 'good'} />
            </div>
            <P>
              For an explanatory model, optimism is small when the number of parameters is modest relative to n; it grows quickly with spline terms, interactions and
              screened variables. The calibration slope tells you how much predictions should shrink <Cite ids="harrell2015,steyerberg2019" />.
            </P>
          </div>
        )}
        {step === 5 && res && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Rigor score" value={`${res.score}/100`} tone={res.score >= 80 ? 'good' : res.score >= 50 ? 'warning' : 'critical'} />
              <Stat label="Major issues" value={major.length} tone={major.length ? 'critical' : 'good'} />
              <Stat label="Minor issues" value={minor.length} />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Reviewer report</h4>
              {res.issues.map((i, k) => (
                <p key={k} className={cn('flex gap-2 rounded-lg border p-2.5 text-sm', i.severity === 'major' ? 'border-critical/40 bg-critical-soft' : 'bg-muted/50')}>
                  {i.severity === 'major' ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-critical-text" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span><strong>{i.severity === 'major' ? 'Major' : 'Minor'}.</strong> {i.text}</span>
                </p>
              ))}
              {major.length === 0 && <p className="flex items-center gap-2 text-sm text-good-text"><CircleCheck className="h-4 w-4" /> No major issues. This analysis is defensible.</p>}
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-1 flex items-center justify-between"><h4 className="text-sm font-semibold">Statistical methods (generated)</h4><CopyButton text={methods} /></div>
              <p className="text-sm leading-relaxed">{methods}</p>
              <h4 className="mt-3 mb-1 text-sm font-semibold">Results (generated)</h4>
              <p className="text-sm leading-relaxed">{results}</p>
            </div>
            <Code title="analysis.R (mirrors your choices)" r={script} />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportReport}><Download className="h-4 w-4" /> Report (.md)</Button>
              <Button variant="outline" onClick={() => downloadText('analysis.R', script)}><Download className="h-4 w-4" /> Script (.R)</Button>
            </div>
          </div>
        )}
        {!res && !err && <p className="text-sm text-muted-foreground">Computing…</p>}
        <div className="flex justify-between border-t pt-4">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ArrowLeft className="h-4 w-4" /> Back</Button>
          <Button disabled={step === steps.length - 1} onClick={() => setStep((s) => s + 1)}>Next <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </Lab>
      <Callout kind="key" title="Try this">
        Start naive and fix one problem at a time, watching the diabetes estimate and the reviewer score. Then load the recommended choices and switch only the outcome to raw LOS,
        or only the missing-data method to mean imputation, to isolate what each decision does.
      </Callout>
    </div>
  );
}
