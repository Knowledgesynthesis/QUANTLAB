import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, RotateCcw, CircleCheck, CircleX } from 'lucide-react';
import { questions, type Question } from '@/content/questions';
import { modules } from '@/content/curriculum';
import { useApp } from '@/store';
import { QuestionCard, Cite, shuffledOrder } from '@/components/learning';
import { Button, Card, SelectField, Tabs, Badge } from '@/components/ui';
import { Rng } from '@/lib/stats/random';
import { cn, pct } from '@/lib/utils';

const moduleOptions = [
  { value: 'all', label: 'All modules' },
  ...modules.filter((m) => m.id !== 'pipeline').map((m) => ({ value: m.id, label: `${m.number}. ${m.title}` })),
];

function Mastery() {
  const quiz = useApp((s) => s.quiz);
  const reset = useApp((s) => s.resetQuiz);
  const rows = modules.filter((m) => m.id !== 'pipeline').map((m) => {
    const qs = questions.filter((q) => q.module === m.id);
    const attempted = qs.filter((q) => quiz[q.id]);
    const correct = attempted.filter((q) => quiz[q.id].correct);
    return { m, total: qs.length, attempted: attempted.length, correct: correct.length };
  });
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Mastery by module</h2>
        <Button size="sm" variant="ghost" onClick={reset}><RotateCcw className="h-4 w-4" /> Reset</Button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Based on your most recent answer to each question. A question counts as mastered when your latest attempt was correct.</p>
      <div className="space-y-2.5">
        {rows.map((r) => {
          const share = r.correct / r.total;
          return (
            <div key={r.m.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{r.m.number}. {r.m.title}</span>
                <span className="tabular text-muted-foreground">{r.correct}/{r.total}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full', share >= 0.8 ? 'bg-good' : 'bg-primary')} style={{ width: pct(share) }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Practice({ moduleFilter }: { moduleFilter: string }) {
  const quiz = useApp((s) => s.quiz);
  const [onlyMissed, setOnlyMissed] = useState(false);
  const list = questions.filter((q) => (moduleFilter === 'all' || q.module === moduleFilter) && (!onlyMissed || (quiz[q.id] && !quiz[q.id].correct)));
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={onlyMissed} onChange={(e) => setOnlyMissed(e.target.checked)} className="h-4 w-4" />
        Only questions I got wrong last time
      </label>
      {list.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nothing here – no missed questions in this selection.</p>}
      {list.map((q, i) => (
        <QuestionCard key={q.id} id={q.id} index={i + 1} />
      ))}
    </div>
  );
}

function Exam({ moduleFilter }: { moduleFilter: string }) {
  const record = useApp((s) => s.recordAnswer);
  const [seed, setSeed] = useState(1);
  const pool = questions.filter((q) => moduleFilter === 'all' || q.module === moduleFilter);
  const exam: Question[] = useMemo(() => new Rng(`exam-${seed}-${moduleFilter}`).shuffle(pool).slice(0, Math.min(20, pool.length)), [seed, moduleFilter, pool]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = exam.filter((q) => answers[q.id] === q.answer).length;
  const restart = () => { setSeed((s) => s + 1); setAnswers({}); setSubmitted(false); };

  return (
    <div className="space-y-4">
      {submitted && (
        <Card className="text-center">
          <Award className="mx-auto h-8 w-8 text-primary" aria-hidden />
          <p className="mt-2 text-3xl font-bold tabular">{score} / {exam.length}</p>
          <p className="text-sm text-muted-foreground">{pct(score / exam.length)} · review the explanations below</p>
          <Button className="mt-4" onClick={restart}><RotateCcw className="h-4 w-4" /> New exam</Button>
        </Card>
      )}
      {exam.map((q, i) => {
        const order = shuffledOrder(q.id, q.options.length, seed);
        const chosen = answers[q.id];
        return (
          <div key={q.id} className="rounded-xl border bg-card p-4 sm:p-5">
            <p className="mb-3 font-medium"><span className="mr-1.5 text-muted-foreground">{i + 1}.</span>{q.stem}</p>
            <div className="space-y-2">
              {order.map((oi, k) => {
                const isChosen = chosen === oi;
                const isAnswer = q.answer === oi;
                return (
                  <label
                    key={oi}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm',
                      !submitted && isChosen && 'border-primary bg-primary-soft/60',
                      submitted && isAnswer && 'border-good/60 bg-good-soft',
                      submitted && isChosen && !isAnswer && 'border-critical/50 bg-critical-soft',
                    )}
                  >
                    <input type="radio" className="mt-1" name={`exam-${q.id}`} disabled={submitted} checked={isChosen} onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))} />
                    <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + k)}</span>
                    <span className="flex-1">{q.options[oi]}</span>
                    {submitted && isAnswer && <CircleCheck className="h-4 w-4 text-good-text" aria-label="Correct answer" />}
                    {submitted && isChosen && !isAnswer && <CircleX className="h-4 w-4 text-critical-text" aria-label="Your answer" />}
                  </label>
                );
              })}
            </div>
            {submitted && (
              <div className="mt-3 rounded-lg bg-muted/70 p-3 text-sm">
                {q.rationale} {q.refs && <Cite ids={q.refs.join(',')} />}
              </div>
            )}
          </div>
        );
      })}
      {!submitted && (
        <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
          <span className="text-sm text-muted-foreground tabular">{Object.keys(answers).length}/{exam.length} answered</span>
          <Button
            disabled={Object.keys(answers).length < exam.length}
            onClick={() => {
              exam.forEach((q) => record(q.id, answers[q.id] === q.answer));
              setSubmitted(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Submit exam
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Assessment() {
  const [params, setParams] = useSearchParams();
  const moduleFilter = params.get('module') ?? 'all';
  const [mode, setMode] = useState<'practice' | 'exam' | 'mastery'>('practice');
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Assessment</h1>
      <p className="mt-2 text-muted-foreground">
        {questions.length} scenario questions. Practice mode explains each answer immediately; the mock exam draws up to 20 questions and explains them after you submit.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <SelectField label="Module" value={moduleFilter} onChange={(v) => setParams(v === 'all' ? {} : { module: v })} options={moduleOptions} />
        <Tabs value={mode} onChange={setMode} tabs={[{ value: 'practice', label: 'Practice' }, { value: 'exam', label: 'Mock exam' }, { value: 'mastery', label: 'Mastery' }]} />
      </div>
      <div className="mt-5">
        {mode === 'practice' && <Practice moduleFilter={moduleFilter} />}
        {mode === 'exam' && <Exam key={moduleFilter} moduleFilter={moduleFilter} />}
        {mode === 'mastery' && <Mastery />}
      </div>
      <p className="mt-6 text-xs text-muted-foreground"><Badge>Tip</Badge> Answers are stored only in this browser.</p>
    </div>
  );
}
