import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import Home from '@/pages/Home';

const ModulePage = lazy(() => import('@/pages/ModulePage'));
const LessonPage = lazy(() => import('@/pages/LessonPage'));
const Assessment = lazy(() => import('@/pages/Assessment'));
const Glossary = lazy(() => import('@/pages/Glossary'));
const References = lazy(() => import('@/pages/References'));
const About = lazy(() => import('@/pages/About'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/references" element={<References />} />
            <Route path="/about" element={<About />} />
            <Route path="/:moduleId" element={<ModulePage />} />
            <Route path="/:moduleId/:lessonSlug" element={<LessonPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  );
}
