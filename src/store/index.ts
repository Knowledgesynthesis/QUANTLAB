import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

export interface QuizRecord {
  correct: boolean;
  attempts: number;
  at: string;
}

interface AppState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  completedLessons: Record<string, string>;
  toggleLesson: (key: string, done?: boolean) => void;
  quiz: Record<string, QuizRecord>;
  recordAnswer: (questionId: string, correct: boolean) => void;
  resetQuiz: () => void;
  lastLesson: string | null;
  setLastLesson: (key: string) => void;
  auditLog: Record<string, string>;
  setAuditAction: (issueId: string, action: string) => void;
  resetAudit: () => void;
  resetAll: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      completedLessons: {},
      toggleLesson: (key, done) =>
        set((s) => {
          const next = { ...s.completedLessons };
          const isDone = done ?? !next[key];
          if (isDone) next[key] = new Date().toISOString();
          else delete next[key];
          return { completedLessons: next };
        }),
      quiz: {},
      recordAnswer: (id, correct) =>
        set((s) => {
          const prev = s.quiz[id];
          return {
            quiz: {
              ...s.quiz,
              [id]: { correct, attempts: (prev?.attempts ?? 0) + 1, at: new Date().toISOString() },
            },
          };
        }),
      resetQuiz: () => set({ quiz: {} }),
      lastLesson: null,
      setLastLesson: (key) => set({ lastLesson: key }),
      auditLog: {},
      setAuditAction: (issueId, action) => set((s) => ({ auditLog: { ...s.auditLog, [issueId]: action } })),
      resetAudit: () => set({ auditLog: {} }),
      resetAll: () => set({ completedLessons: {}, quiz: {}, lastLesson: null, auditLog: {} }),
    }),
    { name: 'quantlab-v2', version: 2 },
  ),
);

export function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#1a1a19' : '#fcfcfb');
}
