import { Suspense, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CircleCheck, Clock, FlaskConical } from 'lucide-react';
import { allLessons, moduleById, lessonKey } from '@/content/curriculum';
import { lessonComponents } from '@/modules/registry';
import { useApp } from '@/store';
import { Badge, Button, LinkButton } from '@/components/ui';
import NotFound from './NotFound';

export default function LessonPage() {
  const { moduleId = '', lessonSlug = '' } = useParams();
  const m = moduleById.get(moduleId as never);
  const lesson = m?.lessons.find((l) => l.slug === lessonSlug);
  const key = lessonKey(moduleId, lessonSlug);
  const done = useApp((s) => !!s.completedLessons[key]);
  const toggle = useApp((s) => s.toggleLesson);
  const setLast = useApp((s) => s.setLastLesson);
  useEffect(() => {
    if (lesson) setLast(key);
  }, [key, lesson, setLast]);
  useEffect(() => {
    if (lesson) document.title = `${lesson.title} · QuantLab`;
    return () => { document.title = 'QuantLab — Research Data Methods for Clinician-Scientists'; };
  }, [lesson]);

  if (!m || !lesson) return <NotFound />;
  const Component = lessonComponents[key];
  const idx = allLessons.findIndex((l) => l.key === key);
  const prev = allLessons[idx - 1];
  const next = allLessons[idx + 1];
  const li = m.lessons.indexOf(lesson);

  return (
    <article>
      <nav className="mb-3 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to={`/${m.id}`} className="hover:text-foreground">Module {m.number} · {m.title}</Link>
        <span className="mx-1.5">/</span>
        <span>Lesson {li + 1} of {m.lessons.length}</span>
      </nav>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{lesson.title}</h1>
      <p className="mt-2 text-muted-foreground">{lesson.summary}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge><Clock className="h-3 w-3" /> {lesson.minutes} min</Badge>
        {lesson.interactive && <Badge tone="primary"><FlaskConical className="h-3 w-3" /> {lesson.interactive}</Badge>}
        {done && <Badge tone="good"><CircleCheck className="h-3 w-3" /> Completed</Badge>}
      </div>
      <hr className="my-6" />
      <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Loading lesson…</div>}>
        {Component ? <Component /> : <p>Lesson content missing.</p>}
      </Suspense>

      <div className="mt-10 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button variant={done ? 'outline' : 'primary'} onClick={() => toggle(key)} aria-pressed={done}>
          <CircleCheck className="h-4 w-4" /> {done ? 'Completed – mark as not done' : 'Mark lesson complete'}
        </Button>
        <div className="flex gap-2">
          {prev && (
            <LinkButton to={`/${prev.module.id}/${prev.lesson.slug}`} variant="ghost" aria-label={`Previous: ${prev.lesson.title}`}>
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
            </LinkButton>
          )}
          {next && (
            <LinkButton
              to={`/${next.module.id}/${next.lesson.slug}`}
              onClick={() => { if (!done) toggle(key, true); }}
              aria-label={`Next: ${next.lesson.title}`}
            >
              Next: <span className="max-w-[12rem] truncate sm:max-w-xs">{next.lesson.title}</span> <ArrowRight className="h-4 w-4" />
            </LinkButton>
          )}
        </div>
      </div>
    </article>
  );
}
