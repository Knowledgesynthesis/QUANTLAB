import type { ModuleId } from './questions';

export interface LessonMeta {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  interactive?: string;
}

export interface ModuleMeta {
  id: ModuleId | 'pipeline';
  number: number;
  title: string;
  short: string;
  tagline: string;
  outcomes: string[];
  lessons: LessonMeta[];
}

export const modules: ModuleMeta[] = [
  {
    id: 'raw-data', number: 1, title: 'Raw Data Foundations', short: 'Audit',
    tagline: 'Know exactly what is in the extract before you touch it.',
    outcomes: [
      'Define the unit of analysis and recognise clustered rows',
      'Classify variables and anticipate the analysis each type needs',
      'Run a systematic audit that catches duplicates, unit errors, sentinels and logic violations',
      'Write a machine-readable data dictionary and an audit trail',
    ],
    lessons: [
      { slug: 'structure', title: 'Structure and unit of analysis', summary: 'Tidy data, one row per what, and why repeated rows break standard errors.', minutes: 8 },
      { slug: 'variables', title: 'Variable types and what they imply', summary: 'Measurement scales, units, time-to-event, and the information you lose by coarsening.', minutes: 8 },
      { slug: 'audit', title: 'Audit lab: find the problems', summary: 'Run real checks on a 607-row messy EHR extract and decide what to do with each finding.', minutes: 20, interactive: 'Audit lab' },
      { slug: 'dictionary', title: 'Data dictionary and audit trail', summary: 'Document every variable and every change so the analysis can be rebuilt from raw data.', minutes: 8, interactive: 'Dictionary export' },
    ],
  },
  {
    id: 'cleaning', number: 2, title: 'Cleaning & Preprocessing', short: 'Clean',
    tagline: 'Fix errors, keep the truth, and do not throw information away.',
    outcomes: [
      'Separate errors from genuine extreme values and choose robust detection rules',
      'Choose and interpret transformations on the right scale',
      'Explain and demonstrate the cost of dichotomizing continuous variables',
      'Encode categorical variables correctly',
    ],
    lessons: [
      { slug: 'errors-outliers', title: 'Errors versus outliers', summary: 'Why SD rules fail (masking), and robust alternatives.', minutes: 12, interactive: 'Outlier rules lab' },
      { slug: 'transformations', title: 'Transformations', summary: 'When to transform, what changes, and how to report on the original scale.', minutes: 12, interactive: 'Transformation lab' },
      { slug: 'dichotomizing', title: "Don't dichotomize", summary: 'Simulate the power lost by median splits and the false positives created by "optimal" cutpoints.', minutes: 12, interactive: 'Power simulation' },
      { slug: 'encoding', title: 'Encoding categorical variables', summary: 'Dummy coding, reference levels, the dummy-variable trap and ordinal variables.', minutes: 8, interactive: 'Design matrix' },
    ],
  },
  {
    id: 'missing-data', number: 3, title: 'Missing Data & Imputation', short: 'Missing',
    tagline: 'The mechanism, not the percentage, decides what works.',
    outcomes: [
      'Define MCAR, MAR and MNAR precisely and explain what can and cannot be tested',
      'Predict which methods are biased under which mechanism – and verify by simulation',
      'Specify, run and pool a multiple imputation correctly',
      'Plan an MNAR sensitivity analysis',
    ],
    lessons: [
      { slug: 'mechanisms', title: 'MCAR, MAR, MNAR – precisely', summary: 'Definitions in terms of what missingness depends on, with clinical examples.', minutes: 10 },
      { slug: 'simulator', title: 'Mechanism × method simulator', summary: 'Generate data, delete values by mechanism, and compare seven methods on bias and coverage.', minutes: 20, interactive: 'Missing-data simulator' },
      { slug: 'patterns', title: 'Exploring missingness', summary: 'Missingness maps, pattern tables and what comparisons between groups can show.', minutes: 10, interactive: 'Missingness map' },
      { slug: 'mi-practice', title: 'Multiple imputation done right', summary: 'Imputation model, number of imputations, pooling – with a Rubin\'s rules calculator.', minutes: 14, interactive: "Rubin's rules calculator" },
      { slug: 'sensitivity', title: 'MNAR sensitivity analysis', summary: 'Delta-adjusted imputation and tipping points.', minutes: 10, interactive: 'Tipping-point analysis' },
    ],
  },
  {
    id: 'diagnostics', number: 4, title: 'Regression Diagnostics', short: 'Diagnose',
    tagline: 'Check the model against the data, not against a checklist.',
    outcomes: [
      'Rank regression assumptions by what they actually affect',
      'Read the four standard diagnostic plots and recognise common failures',
      'Distinguish leverage, outliers and influence, and compute Cook\'s D and DFBETAS',
      'Use robust standard errors when variance is not constant',
    ],
    lessons: [
      { slug: 'assumptions', title: 'What the assumptions really are', summary: 'Ordered by importance, with what each one buys you.', minutes: 10 },
      { slug: 'residual-plots', title: 'Reading residual plots', summary: 'Six data-generating scenarios, four plots each, and a diagnosis challenge.', minutes: 15, interactive: 'Diagnostic plots + challenge' },
      { slug: 'influence', title: 'Leverage, outliers and influence', summary: 'Drag a point and watch hat values, studentized residuals, Cook\'s D and DFBETAS respond.', minutes: 15, interactive: 'Drag-a-point lab' },
      { slug: 'heteroscedasticity', title: 'Heteroscedasticity and robust SEs', summary: 'Simulate coverage of classical vs HC3 confidence intervals.', minutes: 12, interactive: 'Coverage simulation' },
    ],
  },
  {
    id: 'multicollinearity', number: 5, title: 'Multicollinearity', short: 'Collinearity',
    tagline: 'A precision problem – and often not a problem at all.',
    outcomes: [
      'Explain what collinearity does to estimates, SEs and predictions',
      'Compute and interpret VIF, GVIF and condition indices',
      'Show that mean-centering does not change inference for interactions',
      'Choose a response that fits the research goal',
    ],
    lessons: [
      { slug: 'concept', title: 'What collinearity does (and does not do)', summary: 'Simulate correlated predictors and watch the sampling distribution of each coefficient.', minutes: 12, interactive: 'Collinearity simulator' },
      { slug: 'diagnosing', title: 'VIF, GVIF and condition indices', summary: 'Diagnose a real model on the cohort and find which variables are involved.', minutes: 12, interactive: 'Cohort diagnostics' },
      { slug: 'centering', title: 'The centering myth', summary: 'Centering lowers VIF – and changes nothing that matters.', minutes: 8, interactive: 'Centering demo' },
      { slug: 'remedies', title: 'What to do, by research goal', summary: 'Causal, predictive and descriptive aims need different responses.', minutes: 10, interactive: 'Ridge path' },
    ],
  },
  {
    id: 'validation', number: 6, title: 'Validation & Model Performance', short: 'Validate',
    tagline: 'How good will the model be on the next patient?',
    outcomes: [
      'Measure discrimination, calibration and clinical utility – and know what each misses',
      'Quantify optimism and choose an efficient internal validation strategy',
      'Recognise and avoid data leakage in resampling',
      'Interpret bootstrap confidence intervals and plan sample size',
    ],
    lessons: [
      { slug: 'measures', title: 'Discrimination, calibration, utility', summary: 'Distort a model\'s predictions and see which metrics notice; build a decision curve.', minutes: 15, interactive: 'Performance lab' },
      { slug: 'overfitting', title: 'Overfitting and optimism', summary: 'Add noise predictors and watch apparent and true performance diverge.', minutes: 12, interactive: 'Overfitting simulator' },
      { slug: 'internal', title: 'Internal validation compared', summary: 'Split-sample vs cross-validation vs bootstrap, judged against the truth.', minutes: 15, interactive: 'Validation comparison' },
      { slug: 'leakage', title: 'Leakage: the wrong way to cross-validate', summary: 'Pure noise looks predictive when selection happens outside the folds.', minutes: 10, interactive: 'Leakage demo' },
      { slug: 'bootstrap', title: 'Bootstrap CIs and what 95% means', summary: 'Resampling in action and a 100-interval coverage experiment.', minutes: 12, interactive: 'Coverage experiment' },
      { slug: 'sample-size', title: 'Sample size and external validation', summary: 'Riley criteria calculator; transportability and recalibration.', minutes: 12, interactive: 'Sample-size calculator' },
    ],
  },
  {
    id: 'reproducibility', number: 7, title: 'Reproducibility & Reporting', short: 'Reproduce',
    tagline: 'Anyone with your data and code should get your numbers.',
    outcomes: [
      'Distinguish reproducibility from replicability and control randomness',
      'Organise a project that rebuilds from raw data with one command',
      'Recognise analytic flexibility and make it visible',
      'Choose the current reporting guideline and write a complete statistical methods section',
    ],
    lessons: [
      { slug: 'foundations', title: 'Reproducible vs replicable; randomness', summary: 'Seeds, RNG versions and what they do and do not guarantee.', minutes: 8, interactive: 'Seed demo' },
      { slug: 'workflow', title: 'A reproducible project', summary: 'Structure, version control, environments and pipelines – with a self-audit.', minutes: 12, interactive: 'Project self-audit' },
      { slug: 'forking-paths', title: 'Analytic flexibility: the multiverse', summary: 'Run every reasonable analysis of one dataset and see how many reach p < 0.05.', minutes: 12, interactive: 'Multiverse' },
      { slug: 'reporting', title: 'Reporting guidelines and methods sections', summary: 'Current guidelines (2024–2025 updates) and a spot-the-omission exercise.', minutes: 12, interactive: 'Methods critique' },
    ],
  },
  {
    id: 'pipeline', number: 8, title: 'Capstone: End-to-End Pipeline', short: 'Capstone',
    tagline: 'Every decision changes the numbers. See how.',
    outcomes: [
      'Take a messy extract to a validated, reported model',
      'See the downstream consequence of each cleaning, missing-data and modelling decision',
      'Compare your estimates with the known truth',
      'Export a reproducible methods section and R script',
    ],
    lessons: [
      { slug: 'capstone', title: 'Length-of-stay study', summary: 'Six steps from raw extract to manuscript, with a reviewer report on your choices.', minutes: 45, interactive: 'Full pipeline' },
    ],
  },
];

export const moduleById = new Map(modules.map((m) => [m.id, m]));

export function lessonKey(moduleId: string, slug: string) {
  return `${moduleId}/${slug}`;
}

export const allLessons = modules.flatMap((m) => m.lessons.map((l) => ({ module: m, lesson: l, key: lessonKey(m.id, l.slug) })));
