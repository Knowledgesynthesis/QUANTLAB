import type { Module } from '@/types';

export const modules: Module[] = [
  {
    id: 'raw-data',
    title: 'Raw Data Foundations',
    description: 'Learn to import, audit, and understand different types of messy data with data dictionaries.',
    icon: 'Database',
    route: '/raw-data',
    prerequisites: [],
    learningObjectives: [
      'Identify different types of messy data',
      'Import and audit synthetic datasets',
      'Create and use data dictionaries',
      'Understand data quality issues'
    ],
    estimatedTime: '30 minutes',
    difficulty: 'beginner'
  },
  {
    id: 'cleaning',
    title: 'Cleaning & Preprocessing',
    description: 'Master data cleaning techniques including deduplication, outlier handling, and transformations.',
    icon: 'Sparkles',
    route: '/cleaning',
    prerequisites: ['raw-data'],
    learningObjectives: [
      'Perform data deduplication',
      'Handle outliers appropriately',
      'Apply transformations (log, sqrt, winsorizing)',
      'Encode categorical variables'
    ],
    estimatedTime: '45 minutes',
    difficulty: 'beginner'
  },
  {
    id: 'missing-data',
    title: 'Missing Data & Imputation',
    description: 'Understand missingness mechanisms (MCAR/MAR/MNAR) and apply appropriate imputation strategies.',
    icon: 'AlertCircle',
    route: '/missing-data',
    prerequisites: ['cleaning'],
    learningObjectives: [
      'Classify missingness mechanisms',
      'Visualize missingness patterns',
      'Apply simple and multivariate imputation',
      'Understand imputation assumptions and pitfalls'
    ],
    estimatedTime: '60 minutes',
    difficulty: 'intermediate'
  },
  {
    id: 'diagnostics',
    title: 'Regression Diagnostics',
    description: 'Perform comprehensive regression diagnostics including residuals, leverage, and influence analysis.',
    icon: 'LineChart',
    route: '/diagnostics',
    prerequisites: ['missing-data'],
    learningObjectives: [
      'Interpret residual plots and QQ plots',
      'Identify influential observations',
      'Calculate and use Cook\'s distance',
      'Check for heteroscedasticity',
      'Apply appropriate remedies'
    ],
    estimatedTime: '60 minutes',
    difficulty: 'intermediate'
  },
  {
    id: 'multicollinearity',
    title: 'Multicollinearity Analysis',
    description: 'Detect and handle multicollinearity using VIF, correlation matrices, and condition indices.',
    icon: 'Network',
    route: '/multicollinearity',
    prerequisites: ['diagnostics'],
    learningObjectives: [
      'Explore correlation structures',
      'Calculate variance inflation factors',
      'Interpret condition indices',
      'Handle interactions and polynomial terms',
      'Address multicollinearity issues'
    ],
    estimatedTime: '45 minutes',
    difficulty: 'intermediate'
  },
  {
    id: 'validation',
    title: 'Validation & Reproducibility',
    description: 'Learn cross-validation, bootstrapping, and reproducibility best practices for research.',
    icon: 'CheckCircle',
    route: '/validation',
    prerequisites: ['multicollinearity'],
    learningObjectives: [
      'Implement train/validation/test splits',
      'Perform k-fold cross-validation',
      'Apply bootstrapping techniques',
      'Understand overfitting vs generalization',
      'Follow reproducibility standards',
      'Document methods appropriately'
    ],
    estimatedTime: '60 minutes',
    difficulty: 'advanced'
  },
  {
    id: 'pipeline',
    title: 'Integrated Pipeline Sandbox',
    description: 'Build complete end-to-end research data pipelines from cleaning to validation.',
    icon: 'Workflow',
    route: '/pipeline',
    prerequisites: ['validation'],
    learningObjectives: [
      'Design complete data analysis pipelines',
      'Apply all learned techniques systematically',
      'Generate manuscript-ready summaries',
      'Ensure reproducibility throughout'
    ],
    estimatedTime: '90 minutes',
    difficulty: 'advanced'
  }
];
