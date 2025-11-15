// Core types for QuantLab

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  prerequisites: string[];
  learningObjectives: string[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface LessonContent {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  type: 'concept' | 'interactive' | 'assessment';
  order: number;
}

export interface DataPoint {
  id: string;
  [key: string]: any;
}

export interface SyntheticDataset {
  id: string;
  name: string;
  description: string;
  variables: Variable[];
  data: DataPoint[];
  missingnessPattern?: MissingnessPattern;
}

export interface Variable {
  name: string;
  type: 'continuous' | 'categorical' | 'binary';
  description: string;
  unit?: string;
  validRange?: [number, number];
  categories?: string[];
}

export interface MissingnessPattern {
  type: 'MCAR' | 'MAR' | 'MNAR';
  variables: string[];
  percentage: number;
  mechanism?: string;
}

export interface ImputationStrategy {
  method: 'mean' | 'median' | 'mode' | 'knn' | 'mice' | 'missForest';
  parameters?: Record<string, any>;
}

export interface RegressionDiagnostics {
  residuals: number[];
  fitted: number[];
  leverage: number[];
  cooksDistance: number[];
  standardizedResiduals: number[];
  dfbetas?: number[][];
}

export interface MulticollinearityMetrics {
  correlationMatrix: number[][];
  vif: Record<string, number>;
  conditionIndices: number[];
  eigenvalues: number[];
}

export interface ValidationResults {
  method: 'cross-validation' | 'bootstrap';
  folds?: number;
  iterations?: number;
  metrics: {
    rmse?: number;
    mae?: number;
    r2?: number;
    accuracy?: number;
    precision?: number;
    recall?: number;
    auc?: number;
  };
  confidence_intervals?: {
    lower: number;
    upper: number;
    level: number;
  };
}

export interface AssessmentQuestion {
  id: string;
  moduleId: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'scenario';
  options?: string[];
  correctAnswer: string | number;
  rationale: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
  relatedTerms: string[];
  examples?: string[];
}

export interface UserProgress {
  userId: string;
  completedModules: string[];
  completedLessons: string[];
  assessmentScores: Record<string, number>;
  lastAccessed: string;
}

export interface PipelineStep {
  id: string;
  name: string;
  type: 'clean' | 'transform' | 'impute' | 'model' | 'diagnose' | 'validate';
  config: Record<string, any>;
  order: number;
  completed: boolean;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  dataset: SyntheticDataset;
  results?: any;
}
