import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type Loader = () => Promise<{ default: ComponentType }>;

const loaders: Record<string, Loader> = {
  'raw-data/structure': () => import('./raw-data/Structure'),
  'raw-data/variables': () => import('./raw-data/Variables'),
  'raw-data/audit': () => import('./raw-data/AuditLab'),
  'raw-data/dictionary': () => import('./raw-data/Dictionary'),
  'cleaning/errors-outliers': () => import('./cleaning/ErrorsOutliers'),
  'cleaning/transformations': () => import('./cleaning/Transformations'),
  'cleaning/dichotomizing': () => import('./cleaning/Dichotomizing'),
  'cleaning/encoding': () => import('./cleaning/Encoding'),
  'missing-data/mechanisms': () => import('./missing-data/Mechanisms'),
  'missing-data/simulator': () => import('./missing-data/Simulator'),
  'missing-data/patterns': () => import('./missing-data/Patterns'),
  'missing-data/mi-practice': () => import('./missing-data/MIPractice'),
  'missing-data/sensitivity': () => import('./missing-data/Sensitivity'),
  'diagnostics/assumptions': () => import('./diagnostics/Assumptions'),
  'diagnostics/residual-plots': () => import('./diagnostics/ResidualPlots'),
  'diagnostics/influence': () => import('./diagnostics/Influence'),
  'diagnostics/heteroscedasticity': () => import('./diagnostics/Heteroscedasticity'),
  'multicollinearity/concept': () => import('./multicollinearity/Concept'),
  'multicollinearity/diagnosing': () => import('./multicollinearity/Diagnosing'),
  'multicollinearity/centering': () => import('./multicollinearity/Centering'),
  'multicollinearity/remedies': () => import('./multicollinearity/Remedies'),
  'validation/measures': () => import('./validation/Measures'),
  'validation/overfitting': () => import('./validation/Overfitting'),
  'validation/internal': () => import('./validation/Internal'),
  'validation/leakage': () => import('./validation/Leakage'),
  'validation/bootstrap': () => import('./validation/Bootstrap'),
  'validation/sample-size': () => import('./validation/SampleSize'),
  'reproducibility/foundations': () => import('./reproducibility/Foundations'),
  'reproducibility/workflow': () => import('./reproducibility/Workflow'),
  'reproducibility/forking-paths': () => import('./reproducibility/ForkingPaths'),
  'reproducibility/reporting': () => import('./reproducibility/Reporting'),
  'pipeline/capstone': () => import('./pipeline/Capstone'),
};

export const lessonKeys = Object.keys(loaders);

export const lessonComponents: Record<string, LazyExoticComponent<ComponentType>> = Object.fromEntries(
  Object.entries(loaders).map(([k, l]) => [k, lazy(l)]),
);
