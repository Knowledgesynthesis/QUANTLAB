import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './components/modules/Home';
import { RawDataFoundations } from './components/modules/RawDataFoundations';
import { CleaningPreprocessing } from './components/modules/CleaningPreprocessing';
import { MissingDataImputation } from './components/modules/MissingDataImputation';
import { RegressionDiagnostics } from './components/modules/RegressionDiagnostics';
import { MulticollinearityAnalysis } from './components/modules/MulticollinearityAnalysis';
import { ValidationReproducibility } from './components/modules/ValidationReproducibility';
import { PipelineSandbox } from './components/modules/PipelineSandbox';
import { AssessmentHub } from './components/modules/AssessmentHub';
import { Glossary } from './components/modules/Glossary';
import { useAppStore } from './store';

function App() {
  const darkMode = useAppStore((state) => state.darkMode);

  // Sync dark mode with HTML element class
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/raw-data" element={<RawDataFoundations />} />
          <Route path="/cleaning" element={<CleaningPreprocessing />} />
          <Route path="/missing-data" element={<MissingDataImputation />} />
          <Route path="/diagnostics" element={<RegressionDiagnostics />} />
          <Route path="/multicollinearity" element={<MulticollinearityAnalysis />} />
          <Route path="/validation" element={<ValidationReproducibility />} />
          <Route path="/pipeline" element={<PipelineSandbox />} />
          <Route path="/assessment" element={<AssessmentHub />} />
          <Route path="/glossary" element={<Glossary />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
