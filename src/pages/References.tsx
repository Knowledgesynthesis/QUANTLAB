import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { references, type Reference } from '@/content/references';
import { cn } from '@/lib/utils';

export default function References() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({ block: 'center' }), 50);
  }, [hash]);
  const topics = [...new Set(references.map((r) => r.topic))];
  const target = hash.slice(1);
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">References</h1>
      <p className="mt-2 text-muted-foreground">
        {references.length} sources cited in the lessons. Every DOI is checked against the DOI registry and its Crossref title by a script in the repository (<code className="text-xs">npm run verify:refs</code>).
      </p>
      {topics.map((t) => (
        <section key={t} className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">{t}</h2>
          <ol className="space-y-2">
            {references
              .filter((r) => r.topic === t)
              .sort((a, b) => a.authors.localeCompare(b.authors))
              .map((r: Reference) => (
                <li key={r.id} id={r.id} className={cn('rounded-lg border bg-card p-3 text-sm', target === r.id && 'border-primary ring-2 ring-primary/30')}>
                  <span className="font-medium">{r.authors}</span> ({r.year}). {r.title}. <span className="italic">{r.source}</span>.
                  {r.doi && (
                    <a href={`https://doi.org/${r.doi}`} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-0.5 text-primary hover:underline">
                      doi:{r.doi} <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  )}
                  {!r.doi && r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-0.5 text-primary hover:underline">
                      {r.url.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  )}
                  {r.note && <span className="mt-1 block text-xs text-muted-foreground">{r.note}</span>}
                </li>
              ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
