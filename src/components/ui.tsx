import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { CircleAlert, CircleCheck, Info, Lightbulb, TriangleAlert, Copy, Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:brightness-110 shadow-sm',
  secondary: 'bg-muted text-foreground hover:bg-border/70',
  ghost: 'text-foreground hover:bg-muted',
  outline: 'border border-input bg-card text-foreground hover:bg-muted',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10',
};
const base =
  'inline-flex items-center justify-center rounded-lg font-medium transition-[background,filter,color] disabled:pointer-events-none disabled:opacity-50 select-none';

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export function LinkButton({ variant = 'primary', size = 'md', className, ...props }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

export function Card({ className, children, as: As = 'section' }: { className?: string; children: ReactNode; as?: 'section' | 'div' | 'article' }) {
  return <As className={cn('rounded-xl border bg-card p-4 sm:p-6', className)}>{children}</As>;
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'primary' | 'good' | 'warning' | 'critical'; className?: string }) {
  const tones = {
    neutral: 'bg-muted text-muted-foreground',
    primary: 'bg-primary-soft text-primary',
    good: 'bg-good-soft text-good-text',
    warning: 'bg-warning-soft text-warning-text',
    critical: 'bg-critical-soft text-critical-text',
  };
  return <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', tones[tone], className)}>{children}</span>;
}

type CalloutKind = 'key' | 'warning' | 'mistake' | 'tip' | 'report' | 'info';
const calloutMeta: Record<CalloutKind, { icon: typeof Info; label: string; cls: string; iconCls: string }> = {
  key: { icon: Lightbulb, label: 'Key point', cls: 'bg-primary-soft border-primary/30', iconCls: 'text-primary' },
  warning: { icon: TriangleAlert, label: 'Caution', cls: 'bg-warning-soft border-warning/40', iconCls: 'text-warning-text' },
  mistake: { icon: CircleAlert, label: 'Common mistake', cls: 'bg-critical-soft border-critical/30', iconCls: 'text-critical-text' },
  tip: { icon: CircleCheck, label: 'Good practice', cls: 'bg-good-soft border-good/30', iconCls: 'text-good-text' },
  report: { icon: FileText, label: 'In your manuscript', cls: 'bg-muted border-border', iconCls: 'text-muted-foreground' },
  info: { icon: Info, label: 'Note', cls: 'bg-info-soft border-primary/20', iconCls: 'text-primary' },
};

export function Callout({ kind = 'key', title, children, className }: { kind?: CalloutKind; title?: ReactNode; children: ReactNode; className?: string }) {
  const m = calloutMeta[kind];
  const Icon = m.icon;
  return (
    <div className={cn('rounded-xl border p-4 text-sm', m.cls, className)} role="note">
      <div className="mb-1.5 flex items-center gap-2 font-semibold">
        <Icon className={cn('h-4 w-4 shrink-0', m.iconCls)} aria-hidden />
        <span>{title ?? m.label}</span>
      </div>
      <div className="prose-ql text-foreground/90">{children}</div>
    </div>
  );
}

export function SliderField({
  label, value, onChange, min, max, step = 1, format, hint, disabled,
}: {
  label: ReactNode; value: number; onChange: (v: number) => void; min: number; max: number; step?: number;
  format?: (v: number) => string; hint?: ReactNode; disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        <output htmlFor={id} className="tabular text-sm font-semibold">{format ? format(value) : value}</output>
      </div>
      <input
        id={id}
        type="range"
        className="h-6 w-full cursor-pointer"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SelectField<T extends string>({
  label, value, onChange, options, hint,
}: {
  label: ReactNode; value: T; onChange: (v: T) => void; options: readonly { value: T; label: string }[]; hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Segmented control (radio group) – accessible, keyboard navigable. */
export function Segmented<T extends string>({
  label, value, onChange, options, className, size = 'md',
}: {
  label: string; value: T; onChange: (v: T) => void; options: readonly { value: T; label: ReactNode }[]; className?: string; size?: 'sm' | 'md';
}) {
  const name = useId();
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'flex-1 cursor-pointer whitespace-nowrap rounded-md text-center font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
              size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              value === o.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <input type="radio" className="sr-only" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Checkbox({ label, checked, onChange, hint, disabled }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; hint?: ReactNode; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]" />
      <label htmlFor={id} className="text-sm leading-snug">
        {label}
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </label>
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: 'good' | 'warning' | 'critical' }) {
  const toneCls = tone === 'good' ? 'text-good-text' : tone === 'warning' ? 'text-warning-text' : tone === 'critical' ? 'text-critical-text' : '';
  return (
    <div className="min-w-0 rounded-lg bg-muted/60 p-3">
      <div className="line-clamp-2 text-xs leading-tight text-muted-foreground">{label}</div>
      <div className={cn('tabular mt-0.5 text-xl font-semibold leading-tight', toneCls)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: readonly { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cn('scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            value === t.value ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function DataTable({ head, rows, className, caption, align, nowrap }: { head: ReactNode[]; rows: ReactNode[][]; className?: string; caption?: ReactNode; align?: ('l' | 'r' | 'c')[]; nowrap?: boolean }) {
  const a = (i: number) => (align?.[i] === 'r' ? 'text-right' : align?.[i] === 'c' ? 'text-center' : 'text-left');
  return (
    <div className={cn('overflow-x-auto rounded-lg border', className)}>
      <table className="tabular w-full text-sm">
        {caption && <caption className="px-3 pt-2 text-left text-xs text-muted-foreground">{caption}</caption>}
        <thead className="bg-muted/70">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className={cn('whitespace-nowrap px-3 py-2 font-semibold', a(i))}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((c, j) => (
                <td key={j} className={cn('px-3 py-1.5', nowrap && 'whitespace-nowrap', a(j))}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      aria-label={label}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="hidden sm:inline">{copied ? 'Copied' : label}</span>
    </Button>
  );
}

/** Code listing with optional R / Python variants. */
export function Code({ r, py, title }: { r?: string; py?: string; title?: string }) {
  const langs = [r ? ('R' as const) : null, py ? ('Python' as const) : null].filter(Boolean) as ('R' | 'Python')[];
  const [lang, setLang] = useState<'R' | 'Python'>(langs[0]);
  const text = lang === 'R' ? r! : py!;
  return (
    <div className="overflow-hidden rounded-xl border bg-muted/40">
      <div className="flex items-center justify-between gap-2 border-b px-2 py-1">
        <div className="flex items-center gap-1">
          {title && <span className="px-1 text-xs font-medium text-muted-foreground">{title}</span>}
          {langs.length > 1 &&
            langs.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={cn('rounded px-2 py-0.5 text-xs font-medium', lang === l ? 'bg-card shadow-sm' : 'text-muted-foreground')}
              >
                {l}
              </button>
            ))}
          {langs.length === 1 && <span className="px-1 text-xs text-muted-foreground">{langs[0]}</span>}
        </div>
        <CopyButton text={text} />
      </div>
      <pre className="overflow-x-auto p-3 text-[0.8rem] leading-relaxed"><code>{text}</code></pre>
    </div>
  );
}

/** Inline math-ish formula block (Unicode; no external renderer needed offline). */
export function Formula({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div className="my-2 overflow-x-auto rounded-lg bg-muted/60 px-4 py-3">
      <div className="whitespace-nowrap font-mono text-sm">{children}</div>
      {note && <div className="mt-1 text-xs text-muted-foreground">{note}</div>}
    </div>
  );
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return <h2 id={id} className="mt-8 mb-3 text-lg font-semibold tracking-tight first:mt-0 sm:text-xl">{children}</h2>;
}

export function Legend({ items }: { items: { color: string; label: ReactNode; dashed?: boolean; shape?: 'dot' | 'line' }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {it.shape === 'line' ? (
            <svg width="18" height="8" aria-hidden>
              <line x1="1" y1="4" x2="17" y2="4" stroke={it.color} strokeWidth="2" strokeDasharray={it.dashed ? '4 3' : undefined} strokeLinecap="round" />
            </svg>
          ) : (
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />
          )}
          {it.label}
        </span>
      ))}
    </div>
  );
}
