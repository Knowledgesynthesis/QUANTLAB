import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheck, CircleX, ListChecks } from 'lucide-react';
import { refById } from '@/content/references';
import { questionById } from '@/content/questions';
import { useApp } from '@/store';
import { Rng } from '@/lib/stats/random';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

export function shortCite(id: string): string {
  const r = refById.get(id);
  if (!r) return id;
  const first = r.authors.split(',')[0].trim().split(' ')[0];
  const many = r.authors.includes(',');
  return `${first}${many ? ' et al.' : ''} ${r.year}`;
}

/** Author–year citation(s) linking to the References page. */
export function Cite({ ids }: { ids: string }) {
  const list = ids.split(',').map((s) => s.trim()).filter(Boolean);
  return (
    <span className="whitespace-nowrap text-[0.85em] text-muted-foreground">
      (
      {list.map((id, i) => (
        <span key={id}>
          {i > 0 && '; '}
          <Link to={`/references#${id}`} className="underline decoration-dotted underline-offset-2 hover:text-primary" title={refById.get(id)?.title}>
            {shortCite(id)}
          </Link>
        </span>
      ))}
      )
    </span>
  );
}

/** Deterministic option order per question (so the answer is not always "A"). */
export function shuffledOrder(id: string, n: number, salt = 0): number[] {
  return new Rng(`${id}-${salt}`).shuffle(Array.from({ length: n }, (_, i) => i));
}

/** A single question with immediate feedback; records the result. */
export function QuestionCard({ id, index, salt = 0, compact }: { id: string; index?: number; salt?: number; compact?: boolean }) {
  const q = questionById.get(id);
  const record = useApp((s) => s.recordAnswer);
  const [chosen, setChosen] = useState<number | null>(null);
  const order = useMemo(() => (q ? shuffledOrder(q.id, q.options.length, salt) : []), [q, salt]);
  if (!q) return null;
  const answered = chosen !== null;
  const correct = chosen === q.answer;
  return (
    <div className={cn('rounded-xl border bg-card', compact ? 'p-4' : 'p-4 sm:p-5')}>
      <p className="mb-3 font-medium leading-snug">
        {index !== undefined && <span className="mr-1.5 text-muted-foreground">{index}.</span>}
        {q.stem}
      </p>
      <div className="space-y-2" role="radiogroup" aria-label="Answer options">
        {order.map((oi, k) => {
          const isAnswer = oi === q.answer;
          const isChosen = oi === chosen;
          return (
            <button
              key={oi}
              type="button"
              role="radio"
              aria-checked={isChosen}
              disabled={answered}
              onClick={() => {
                setChosen(oi);
                record(q.id, oi === q.answer);
              }}
              className={cn(
                'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                !answered && 'hover:border-primary/60 hover:bg-primary-soft/40',
                answered && isAnswer && 'border-good/60 bg-good-soft',
                answered && isChosen && !isAnswer && 'border-critical/50 bg-critical-soft',
                answered && !isAnswer && !isChosen && 'opacity-60',
              )}
            >
              <span className="mt-px font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + k)}</span>
              <span className="flex-1">{q.options[oi]}</span>
              {answered && isAnswer && <CircleCheck className="h-4 w-4 shrink-0 text-good-text" aria-label="Correct answer" />}
              {answered && isChosen && !isAnswer && <CircleX className="h-4 w-4 shrink-0 text-critical-text" aria-label="Your answer" />}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-3 rounded-lg bg-muted/70 p-3 text-sm" aria-live="polite">
          <p className={cn('mb-1 font-semibold', correct ? 'text-good-text' : 'text-critical-text')}>{correct ? 'Correct.' : 'Not quite.'}</p>
          <p className="text-foreground/90">{q.rationale}</p>
          {q.refs && q.refs.length > 0 && (
            <p className="mt-1.5">
              <Cite ids={q.refs.join(',')} />
            </p>
          )}
          <Button size="sm" variant="ghost" className="mt-2 -ml-2" onClick={() => setChosen(null)}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

/** "Check yourself" block at the end of a lesson. */
export function CheckYourself({ ids }: { ids: string[] }) {
  return (
    <section className="mt-10" aria-labelledby="check-yourself">
      <h2 id="check-yourself" className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <ListChecks className="h-5 w-5 text-primary" aria-hidden /> Check yourself
      </h2>
      <div className="space-y-3">
        {ids.map((id, i) => (
          <QuestionCard key={id} id={id} index={i + 1} compact />
        ))}
      </div>
    </section>
  );
}

export function Takeaways({ items }: { items: ReactNode[] }) {
  return (
    <section className="mt-8 rounded-xl border border-primary/25 bg-primary-soft/50 p-4 sm:p-5">
      <h2 className="mb-2 text-base font-semibold">Takeaways</h2>
      <ul className="space-y-1.5 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Container for an interactive lab with a title bar. */
export function Lab({ title, children, actions, description }: { title: string; children: ReactNode; actions?: ReactNode; description?: ReactNode }) {
  return (
    <section className="my-6 rounded-2xl border bg-card shadow-sm" aria-label={title}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      <div className="space-y-5 p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="prose-ql mb-3 text-[0.95rem] text-foreground/90">{children}</p>;
}

export function Ul({ children }: { children: ReactNode }) {
  return <ul className="prose-ql mb-3 text-[0.95rem] text-foreground/90">{children}</ul>;
}

export function Ol({ children }: { children: ReactNode }) {
  return <ol className="prose-ql mb-3 text-[0.95rem] text-foreground/90">{children}</ol>;
}
