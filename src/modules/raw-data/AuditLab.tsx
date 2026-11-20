import { useMemo, useState } from 'react';
import { CircleCheck, CircleX, Download, RotateCcw } from 'lucide-react';
import { messyExtract, type AuditCheckId, type PlantedIssue } from '@/data/messy';
import { bySiteCheck, categoryCheck, crossFieldCheck, rangeCheck, structureCheck } from '@/data/audit';
import { useApp } from '@/store';
import { Button, Callout, Code, DataTable, Stat, Tabs, Badge } from '@/components/ui';
import { Cite, Lab, P, Takeaways, CheckYourself } from '@/components/learning';
import { cn, downloadText, fmt } from '@/lib/utils';

const checks: { value: AuditCheckId; label: string }[] = [
  { value: 'structure', label: '1 · Structure' },
  { value: 'ranges', label: '2 · Ranges' },
  { value: 'categories', label: '3 · Categories' },
  { value: 'by-site', label: '4 · By source' },
  { value: 'cross-field', label: '5 · Cross-field logic' },
];

function IssueCard({ issue }: { issue: PlantedIssue }) {
  const chosen = useApp((s) => s.auditLog[issue.id]);
  const set = useApp((s) => s.setAuditAction);
  const opt = issue.options.find((o) => o.id === chosen);
  return (
    <div className={cn('rounded-xl border p-4', opt?.correct && 'border-good/50', opt && !opt.correct && 'border-critical/40')}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="font-semibold">{issue.title}</span>
        <Badge>{issue.variable}</Badge>
        {issue.rows.length > 0 && issue.rows.length <= 12 && <Badge>rows {issue.rows.join(', ')}</Badge>}
      </div>
      <p className="mb-3 text-sm text-muted-foreground">{issue.finding}</p>
      <fieldset className="space-y-1.5">
        <legend className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Your action</legend>
        {issue.options.map((o) => (
          <label key={o.id} className={cn('flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm', chosen === o.id && (o.correct ? 'border-good/60 bg-good-soft' : 'border-critical/50 bg-critical-soft'))}>
            <input type="radio" name={issue.id} className="mt-0.5" checked={chosen === o.id} onChange={() => set(issue.id, o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </fieldset>
      {opt && (
        <p className={cn('mt-2 flex gap-1.5 text-sm', opt.correct ? 'text-good-text' : 'text-critical-text')} aria-live="polite">
          {opt.correct ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0" />}
          <span className="text-foreground/90">{opt.feedback}</span>
        </p>
      )}
    </div>
  );
}

export default function AuditLab() {
  const { rows, issues } = useMemo(() => messyExtract(), []);
  const [check, setCheck] = useState<AuditCheckId>('structure');
  const log = useApp((s) => s.auditLog);
  const resetAudit = useApp((s) => s.resetAudit);
  const s = useMemo(() => structureCheck(rows), [rows]);
  const ranges = useMemo(() => rangeCheck(rows), [rows]);
  const cats = useMemo(() => categoryCheck(rows), [rows]);
  const sites = useMemo(() => bySiteCheck(rows), [rows]);
  const cross = useMemo(() => crossFieldCheck(rows), [rows]);
  const correct = issues.filter((i) => i.options.find((o) => o.id === log[i.id])?.correct).length;
  const answered = issues.filter((i) => log[i.id]).length;

  const exportLog = () => {
    const lines = ['issue,variable,rows_affected,action,appropriate'];
    for (const i of issues) {
      const o = i.options.find((x) => x.id === log[i.id]);
      lines.push([i.title, i.variable, i.rows.length || 'all', o ? `"${o.label.replace(/"/g, "'")}"` : '', o ? (o.correct ? 'yes' : 'no') : ''].join(','));
    }
    downloadText('audit-log.csv', lines.join('\n'), 'text/csv');
  };

  return (
    <div>
      <P>
        Below is a raw extract of {rows.length} admission rows from three hospitals, built from the synthetic cohort with a dozen realistic problems planted in it.
        Run the five checks in order. Each check is computed live; under it are the findings it reveals. Decide what to do with each one.
        Data cleaning is detection, diagnosis and editing, and every edit is documented <Cite ids="vandenbroeck2005" />.
      </P>

      <Lab title="The extract" description="First 8 rows (scroll sideways on small screens)">
        <DataTable
          head={['row', 'admission_id', 'patient_id', 'site', 'admit', 'discharge', 'age', 'sex', 'bmi', 'smoking', 'sbp', 'dbp', 'hr', 'hb', 'creat', 'egfr', 'los']}
          rows={rows.slice(0, 8).map((r) => [r.row, r.admission_id, r.patient_id, r.site, r.admit.replace('T', ' '), r.discharge.replace('T', ' '), r.age ?? 'NA', r.sex, r.bmi ?? 'NA', r.smoking || '""', r.sbp ?? 'NA', r.dbp ?? 'NA', r.heart_rate ?? 'NA', r.hemoglobin ?? 'NA', r.creatinine ?? 'NA', r.egfr ?? 'NA', r.los_days ?? 'NA'])}
          className="text-xs"
          nowrap
        />
      </Lab>

      <div className="sticky top-14 z-10 -mx-4 border-b bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-between gap-3">
          <Tabs value={check} onChange={setCheck} tabs={checks} className="min-w-0 flex-1" />
          <span className="shrink-0 text-xs tabular text-muted-foreground">{correct}/{issues.length} correct · {answered} answered</span>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {check === 'structure' && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Rows" value={s.rows} />
              <Stat label="Unique admission IDs" value={s.uniqueAdmissionIds} tone={s.uniqueAdmissionIds < s.rows ? 'warning' : undefined} />
              <Stat label="Exact duplicate rows" value={s.exactDuplicates} tone={s.exactDuplicates ? 'critical' : 'good'} />
              <Stat label="IDs with conflicting rows" value={s.conflictingIds.length} tone={s.conflictingIds.length ? 'critical' : 'good'} />
            </div>
            <p className="text-sm text-muted-foreground">
              {s.rows} rows but only {s.uniqueAdmissionIds} admission IDs: {s.rows - s.uniqueAdmissionIds} extra rows. Separate the identical copies from rows
              that share an ID but disagree ({s.conflictingIds.join(', ')}).
            </p>
          </>
        )}
        {check === 'ranges' && (
          <DataTable
            head={['Variable', 'Plausible', 'n', 'Missing', 'Min', 'P1', 'Median', 'P99', 'Max', 'Outside', '= 999']}
            align={['l', 'l', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r']}
            rows={ranges.map((r) => [
              <span className="font-mono">{r.variable}</span>, `${r.range} ${r.unit}`, r.n, r.missing, fmt(r.min, 1), fmt(r.p1, 1), fmt(r.median, 1), fmt(r.p99, 1), fmt(r.max, 1),
              r.outside ? <span className="font-semibold text-critical-text">{r.outside}</span> : 0,
              r.eq999 ? <span className="font-semibold text-critical-text">{r.eq999}</span> : 0,
            ])}
            className="text-xs"
          />
        )}
        {check === 'categories' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {cats.map((c) => (
              <div key={c.variable} className="rounded-lg border p-3">
                <p className="mb-1.5 font-mono text-sm font-semibold">{c.variable}</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.levels.map(([lvl, n]) => (
                    <Badge key={lvl}><span className="font-mono">{lvl === '' ? '""' : lvl}</span> <span className="tabular opacity-70">{n}</span></Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {check === 'by-site' && (
          <>
            <DataTable
              head={['Site', 'n', 'Creatinine', 'eGFR', 'Hemoglobin', 'BMI', 'Age', 'LOS']}
              align={['l', 'r', 'r', 'r', 'r', 'r', 'r', 'r']}
              rows={sites.map((r) => [r.site, r.n, fmt(r.creatinine as number, 2), fmt(r.egfr as number, 0), fmt(r.hemoglobin as number, 1), fmt(r.bmi as number, 1), fmt(r.age as number, 0), fmt(r.los_days as number, 1)])}
              caption="Medians by site (sentinel 999 excluded)"
            />
            <p className="text-sm text-muted-foreground">Comparing distributions across sources catches systematic problems (units, coding, calibration of devices) that range checks on pooled data hide.</p>
          </>
        )}
        {check === 'cross-field' && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Discharge before admit" value={cross.dischargeBeforeAdmit.length} tone={cross.dischargeBeforeAdmit.length ? 'critical' : 'good'} />
              <Stat label="DBP ≥ SBP" value={cross.dbpGeSbp.length} tone={cross.dbpGeSbp.length ? 'critical' : 'good'} />
              <Stat label="SBP > 300" value={cross.sbpImpossible.length} tone={cross.sbpImpossible.length ? 'critical' : 'good'} />
              <Stat label="eGFR ≠ CKD-EPI(creatinine)" value={cross.egfrMismatch.length} tone="warning" />
            </div>
            <DataTable
              head={['Site', 'eGFR inconsistent with creatinine (assuming mg/dL)']}
              rows={cross.mismatchBySite.map((m) => [m.site, `${m.n} of ${m.of}`])}
            />
            <p className="text-sm text-muted-foreground">
              Recomputing a derived variable from its inputs is a strong consistency check: nearly every site-B row disagrees, confirming the creatinine unit problem found in check 4.
            </p>
          </>
        )}

        <h3 className="pt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Findings from this check</h3>
        {issues.filter((i) => i.check === check).map((i) => <IssueCard key={i.id} issue={i} />)}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        <div className="flex-1 text-sm">
          <span className="font-semibold">{correct} of {issues.length}</span> findings handled appropriately. {answered < issues.length && `${issues.length - answered} still open across the five checks.`}
        </div>
        <Button variant="outline" size="sm" onClick={exportLog}><Download className="h-4 w-4" /> Audit log (CSV)</Button>
        <Button variant="ghost" size="sm" onClick={resetAudit}><RotateCcw className="h-4 w-4" /> Reset</Button>
      </div>

      <Callout kind="key" className="mt-6" title="Errors are fixed or set missing; real extremes are kept">
        Every planted problem here is either an <strong>error</strong> (impossible, inconsistent or mis-coded) or a <strong>real extreme</strong>. Errors are corrected
        from the source or set to missing; extremes stay and are handled in modelling. Deleting real patients because they are unusual is one of the commonest
        and least visible sources of bias.
      </Callout>

      <h2 className="mt-8 mb-3 text-lg font-semibold">The same audit in code</h2>
      <Code
        r={`library(dplyr); library(skimr)\nraw <- readr::read_csv("data/raw/extract.csv", col_types = readr::cols(.default = "c"))  # read as text first\nskim(raw)                                      # types, missingness, ranges\nraw |> count(admission_id) |> filter(n > 1)    # duplicate keys\nraw |> distinct() |> nrow()                    # exact duplicates removed\nraw |> count(site, sex)                        # coding by source\nraw |> group_by(site) |> summarise(across(c(creatinine, egfr), ~ median(as.numeric(.x), na.rm = TRUE)))\nraw |> filter(as.POSIXct(discharge) < as.POSIXct(admit))   # logic violations`}
        py={`import pandas as pd\nraw = pd.read_csv("data/raw/extract.csv", dtype=str)       # read as text first\nraw.describe(include="all").T\nraw[raw.duplicated("admission_id", keep=False)]          # duplicate keys\nlen(raw) - len(raw.drop_duplicates())                   # exact duplicates\nraw.groupby("site")["sex"].value_counts()\nnum = raw.assign(creatinine=pd.to_numeric(raw.creatinine), egfr=pd.to_numeric(raw.egfr))\nnum.groupby("site")[["creatinine", "egfr"]].median()\nraw[pd.to_datetime(raw.discharge) < pd.to_datetime(raw.admit)]`}
      />
      <Takeaways
        items={[
          'Audit in a fixed order: structure → ranges → categories → by source → cross-field logic.',
          'Read raw files as text first so sentinel codes and stray strings are visible.',
          'Comparing sources and recomputing derived variables catch errors that range checks miss.',
          'Every action goes into a scripted, counted audit log.',
        ]}
      />
      <CheckYourself ids={['rd-sentinel', 'rd-units']} />
    </div>
  );
}
