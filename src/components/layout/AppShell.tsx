import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Monitor, CircleCheck, ChevronDown, FlaskConical } from 'lucide-react';
import { modules, lessonKey } from '@/content/curriculum';
import { useApp, applyTheme, type Theme } from '@/store';
import { cn } from '@/lib/utils';

function ThemeToggle() {
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);
  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const fn = () => applyTheme('system');
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [theme]);
  const next: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={() => setTheme(next[theme])}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
      aria-label={`Theme: ${theme}. Switch to ${next[theme]}.`}
      title={`Theme: ${theme}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function Progress() {
  const done = useApp((s) => s.completedLessons);
  const total = modules.reduce((s, m) => s + m.lessons.length, 0);
  const n = modules.reduce((s, m) => s + m.lessons.filter((l) => done[lessonKey(m.id, l.slug)]).length, 0);
  const pct = Math.round((n / total) * 100);
  return (
    <div className="px-3 pb-3">
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>Progress</span>
        <span className="tabular">{n}/{total} lessons</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress">
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const done = useApp((s) => s.completedLessons);
  const activeModule = pathname.split('/')[1];
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <nav aria-label="Course" className="space-y-0.5 px-2 pb-6">
      {modules.map((m) => {
        const isActive = activeModule === m.id;
        const expanded = open[m.id] ?? isActive;
        const nDone = m.lessons.filter((l) => done[lessonKey(m.id, l.slug)]).length;
        const complete = nDone === m.lessons.length;
        return (
          <div key={m.id}>
            <div className={cn('flex items-center rounded-lg', isActive && 'bg-muted')}>
              <Link to={`/${m.id}`} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-sm">
                <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular', complete ? 'bg-good-soft text-good-text' : 'bg-muted text-muted-foreground', isActive && !complete && 'bg-primary text-primary-foreground')}>
                  {complete ? <CircleCheck className="h-3.5 w-3.5" /> : m.number}
                </span>
                <span className={cn('truncate', isActive ? 'font-semibold' : 'text-foreground/90')}>{m.title}</span>
              </Link>
              <button
                type="button"
                className="mr-1 rounded-md p-1.5 text-muted-foreground hover:bg-border/60"
                aria-label={`${expanded ? 'Collapse' : 'Expand'} ${m.title}`}
                aria-expanded={expanded}
                onClick={() => setOpen((o) => ({ ...o, [m.id]: !expanded }))}
              >
                <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
              </button>
            </div>
            {expanded && (
              <ul className="mb-1 ml-5 border-l pl-3">
                {m.lessons.map((l) => {
                  const key = lessonKey(m.id, l.slug);
                  return (
                    <li key={l.slug}>
                      <NavLink
                        to={`/${m.id}/${l.slug}`}
                        onClick={onNavigate}
                        className={({ isActive: a }) => cn('flex items-center gap-2 rounded-md px-2 py-1.5 text-[0.82rem] leading-snug', a ? 'bg-primary-soft font-medium text-primary' : 'text-muted-foreground hover:text-foreground')}
                      >
                        <span className="flex-1">{l.title}</span>
                        {done[key] && <CircleCheck className="h-3.5 w-3.5 shrink-0 text-good-text" aria-label="completed" />}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
      <div className="mt-3 space-y-0.5 border-t pt-3">
        {[
          ['/assessment', 'Assessment'],
          ['/glossary', 'Glossary'],
          ['/references', 'References'],
          ['/about', 'About & methods'],
        ].map(([to, label]) => (
          <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => cn('block rounded-lg px-3 py-2 text-sm', isActive ? 'bg-primary-soft font-medium text-primary' : 'text-foreground/90 hover:bg-muted')}>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setDrawer(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawer]);

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-card focus:px-3 focus:py-2 focus:shadow">Skip to content</a>
      <header className="sticky top-0 z-40 border-b bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/75">
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted lg:hidden" aria-label="Open course menu" onClick={() => setDrawer(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <FlaskConical className="h-5 w-5 text-primary" aria-hidden />
            <span>QuantLab</span>
          </Link>
          <div className="flex-1" />
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Utilities">
            <NavLink to="/assessment" className={({ isActive }) => cn('rounded-lg px-3 py-2 text-sm', isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>Assessment</NavLink>
            <NavLink to="/glossary" className={({ isActive }) => cn('rounded-lg px-3 py-2 text-sm', isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>Glossary</NavLink>
            <NavLink to="/references" className={({ isActive }) => cn('rounded-lg px-3 py-2 text-sm', isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>References</NavLink>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r bg-surface pt-4 lg:block">
          <Progress />
          <SideNav />
        </aside>

        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Course menu">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col overflow-y-auto bg-surface shadow-xl">
              <div className="flex h-14 items-center justify-between border-b px-3">
                <span className="font-semibold">Course</span>
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted" aria-label="Close menu" onClick={() => setDrawer(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="pt-3">
                <Progress />
                <SideNav onNavigate={() => setDrawer(false)} />
              </div>
            </div>
          </div>
        )}

        <main id="main" className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</div>
          <footer className="mx-auto max-w-4xl px-4 pb-10 text-xs text-muted-foreground sm:px-6 lg:px-10">
            All datasets are synthetic and generated in your browser from fixed seeds. <Link to="/about" className="underline">Methods</Link>.
          </footer>
        </main>
      </div>
    </div>
  );
}
