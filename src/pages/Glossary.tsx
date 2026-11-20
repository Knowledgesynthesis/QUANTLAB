import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { glossary } from '@/content/glossary';
import { moduleById } from '@/content/curriculum';

export default function Glossary() {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return [...glossary]
      .filter((g) => !s || g.term.toLowerCase().includes(s) || g.definition.toLowerCase().includes(s))
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [q]);
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Glossary</h1>
      <p className="mt-2 text-muted-foreground">{glossary.length} terms, each linked to the lesson that teaches it.</p>
      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search terms and definitions"
          aria-label="Search glossary"
          className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm"
        />
      </div>
      <dl className="mt-5 divide-y rounded-xl border bg-card">
        {list.map((g) => {
          const m = g.module ? moduleById.get(g.module as never) : undefined;
          const l = m?.lessons.find((x) => x.slug === g.lesson);
          return (
            <div key={g.term} className="p-4" id={g.term.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>
              <dt className="font-semibold">{g.term}</dt>
              <dd className="mt-1 text-sm text-foreground/90">{g.definition}</dd>
              {m && l && (
                <dd className="mt-1.5 text-xs">
                  <Link to={`/${m.id}/${l.slug}`} className="text-primary underline-offset-2 hover:underline">
                    Module {m.number} · {l.title}
                  </Link>
                </dd>
              )}
            </div>
          );
        })}
        {list.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No matching terms.</p>}
      </dl>
    </div>
  );
}
