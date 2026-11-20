import { Link } from 'react-router-dom';
import { ArrowRight, CircleCheck, Microscope, Sigma, BookMarked, Target } from 'lucide-react';
import { modules, lessonKey, allLessons } from '@/content/curriculum';
import { references } from '@/content/references';
import { questions } from '@/content/questions';
import { useApp } from '@/store';
import { LinkButton } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function Home() {
  const done = useApp((s) => s.completedLessons);
  const last = useApp((s) => s.lastLesson);
  const next = allLessons.find((l) => !done[l.key]);
  const resume = last ? allLessons.find((l) => l.key === last) : null;
  const target = resume && !done[resume.key] ? resume : next;

  return (
    <div className="space-y-10">
      <section className="pt-2">
        <p className="mb-2 text-sm font-medium text-primary">Research data methods for clinician-scientists</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">From messy extract to defensible manuscript.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Eight modules covering the decisions that most often go wrong in clinical research analyses: auditing raw data, cleaning, missing data,
          regression diagnostics, collinearity, validation and reproducibility. Every number on screen is computed live from a synthetic cohort
          whose true data-generating model is known, so you can see the bias of each choice, not just read about it.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {target && (
            <LinkButton to={`/${target.module.id}/${target.lesson.slug}`} size="lg">
              {Object.keys(done).length ? 'Continue' : 'Start'}: {target.lesson.title} <ArrowRight className="h-4 w-4" />
            </LinkButton>
          )}
          <LinkButton to="/assessment" variant="outline" size="lg">Test yourself</LinkButton>
        </div>
      </section>

      <section aria-labelledby="pipeline-map">
        <h2 id="pipeline-map" className="mb-3 text-lg font-semibold">The pipeline</h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {modules.map((m) => {
            const n = m.lessons.filter((l) => done[lessonKey(m.id, l.slug)]).length;
            const complete = n === m.lessons.length;
            return (
              <li key={m.id}>
                <Link to={`/${m.id}`} className="group flex h-full gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/50">
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular', complete ? 'bg-good-soft text-good-text' : 'bg-primary-soft text-primary')}>
                    {complete ? <CircleCheck className="h-4 w-4" /> : m.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold group-hover:text-primary">{m.title}</span>
                      <span className="tabular text-xs text-muted-foreground">{n}/{m.lessons.length}</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{m.tagline}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="How QuantLab works">
        {[
          { icon: Microscope, title: 'Real computation', body: 'OLS with full influence diagnostics, HC3 SEs, VIF/GVIF, logistic regression, LOWESS, MICE with Rubin\'s rules and bootstrap validation run in the browser. The engine is tested against statsmodels and SciPy.' },
          { icon: Target, title: 'Known truth', body: 'The synthetic cohort comes from a specified model, so labs report bias and confidence-interval coverage of each method against the true values.' },
          { icon: Sigma, title: 'Current methods', body: 'TRIPOD+AI (2024), PROBAST+AI (2025), CONSORT 2025, CKD-EPI 2021, Riley sample-size criteria, HC3, TARMOS and current software idioms.' },
          { icon: BookMarked, title: 'Cited claims', body: `${references.length} references, each DOI checked against the registry. ${questions.length} scenario questions with explained answers.` },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border bg-card p-4">
            <div className="mb-1.5 flex items-center gap-2 font-semibold">
              <Icon className="h-4 w-4 text-primary" aria-hidden /> {title}
            </div>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
