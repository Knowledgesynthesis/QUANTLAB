import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CircleCheck, Clock, FlaskConical } from 'lucide-react';
import { moduleById, lessonKey, modules } from '@/content/curriculum';
import { questions } from '@/content/questions';
import { useApp } from '@/store';
import { Badge, LinkButton } from '@/components/ui';
import NotFound from './NotFound';

export default function ModulePage() {
  const { moduleId = '' } = useParams();
  const m = moduleById.get(moduleId as never);
  const done = useApp((s) => s.completedLessons);
  if (!m) return <NotFound />;
  const firstOpen = m.lessons.find((l) => !done[lessonKey(m.id, l.slug)]) ?? m.lessons[0];
  const minutes = m.lessons.reduce((s, l) => s + l.minutes, 0);
  const nQ = questions.filter((q) => q.module === m.id).length;
  const nextModule = modules.find((x) => x.number === m.number + 1);
  return (
    <div>
      <p className="text-sm font-medium text-primary">Module {m.number}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{m.title}</h1>
      <p className="mt-2 text-muted-foreground">{m.tagline}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <Badge><Clock className="h-3 w-3" /> ~{minutes} min</Badge>
        <Badge>{m.lessons.length} lessons</Badge>
        {nQ > 0 && <Badge>{nQ} assessment questions</Badge>}
      </div>

      <section className="mt-6 rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="mb-2 font-semibold">After this module you can</h2>
        <ul className="space-y-1.5 text-sm">
          {m.outcomes.map((o) => (
            <li key={o} className="flex gap-2"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />{o}</li>
          ))}
        </ul>
      </section>

      <ol className="mt-6 space-y-2">
        {m.lessons.map((l, i) => {
          const isDone = !!done[lessonKey(m.id, l.slug)];
          return (
            <li key={l.slug}>
              <Link to={`/${m.id}/${l.slug}`} className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular">
                  {isDone ? <CircleCheck className="h-4 w-4 text-good-text" aria-label="completed" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{l.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{l.summary}</span>
                  <span className="mt-1.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{l.minutes} min</span>
                    {l.interactive && <span className="inline-flex items-center gap-1 text-primary"><FlaskConical className="h-3 w-3" />{l.interactive}</span>}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap gap-3">
        <LinkButton to={`/${m.id}/${firstOpen.slug}`}>
          {Object.keys(done).some((k) => k.startsWith(`${m.id}/`)) ? 'Continue' : 'Start module'} <ArrowRight className="h-4 w-4" />
        </LinkButton>
        {nQ > 0 && <LinkButton to={`/assessment?module=${m.id}`} variant="outline">Module questions</LinkButton>}
        {nextModule && <LinkButton to={`/${nextModule.id}`} variant="ghost">Next: {nextModule.title}</LinkButton>}
      </div>
    </div>
  );
}
