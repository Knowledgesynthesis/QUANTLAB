import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Award } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  rationale: string;
  module: string;
}

const sampleQuestions: Question[] = [
  {
    id: 1,
    question: 'A patient chart review study has 15% missing BMI values. BMI is missing more often in older patients. What is the most likely missingness mechanism?',
    options: ['MCAR (Missing Completely At Random)', 'MAR (Missing At Random)', 'MNAR (Missing Not At Random)', 'Cannot be determined'],
    correct: 1,
    rationale: 'This is MAR because missingness depends on an observed variable (age), not on the unobserved BMI value itself. If BMI were missing because higher BMI patients refused measurement, that would be MNAR.',
    module: 'Missing Data'
  },
  {
    id: 2,
    question: 'You find VIF = 15 for creatinine and VIF = 14 for eGFR in your model. What is the most appropriate action?',
    options: ['Remove both variables', 'Keep both and report the VIF', 'Remove the variable with higher VIF', 'Include only one of them based on clinical relevance'],
    correct: 3,
    rationale: 'Creatinine and eGFR are mathematically related (eGFR is calculated from creatinine). Including both creates severe multicollinearity. Choose one based on which is more clinically relevant to your research question.',
    module: 'Multicollinearity'
  },
  {
    id: 3,
    question: 'In residual vs. fitted plot, you observe a clear funnel shape (variance increases with fitted values). What assumption is violated?',
    options: ['Linearity', 'Independence', 'Homoscedasticity', 'Normality'],
    correct: 2,
    rationale: 'A funnel shape indicates heteroscedasticity—non-constant variance of residuals. This violates the homoscedasticity assumption. Solutions include robust standard errors, transformation, or weighted least squares.',
    module: 'Regression Diagnostics'
  },
  {
    id: 4,
    question: 'Why should you split your data into train/test sets BEFORE imputing missing values?',
    options: ['To save computational time', 'To prevent data leakage from test to training set', 'To ensure equal missingness in both sets', 'It doesn\'t matter when you split'],
    correct: 1,
    rationale: 'Imputing before splitting causes data leakage: information from the test set (via mean, median, or imputation model) influences training set imputation. Always split first, then impute training set, and apply the same imputation model to test set.',
    module: 'Validation'
  },
  {
    id: 5,
    question: 'Which transformation is most appropriate for highly right-skewed continuous data with no zero values?',
    options: ['Square root', 'Log transformation', 'Square', 'No transformation needed'],
    correct: 1,
    rationale: 'Log transformation is most effective for highly right-skewed data. Square root is for mild skewness. Log requires all values > 0; if zeros exist, use log(x+1) or log(x+c).',
    module: 'Data Cleaning'
  },
  {
    id: 6,
    question: 'You have outliers at 5 standard deviations from the mean for creatinine values. What should you do first?',
    options: ['Automatically remove them', 'Winsorize to 3 SD', 'Verify if they are data entry errors', 'Apply log transformation'],
    correct: 2,
    rationale: 'Always investigate outliers first. Extreme values might be data entry errors (e.g., 150 instead of 1.50), biologically implausible, or legitimate extreme cases. Never automatically remove without investigation.',
    module: 'Data Cleaning'
  },
  {
    id: 7,
    question: 'In a QQ plot, points deviate substantially from the diagonal line in both tails. Your sample size is 400. What should you do?',
    options: ['Transform the outcome variable immediately', 'Use robust standard errors', 'Ignore it - CLT applies with large n', 'Remove the extreme observations'],
    correct: 1,
    rationale: 'With n=400, the Central Limit Theorem helps, but heavy-tailed distributions can still affect inference. Robust (Huber-White) standard errors are the most appropriate solution, allowing valid inference without transformation.',
    module: 'Regression Diagnostics'
  },
  {
    id: 8,
    question: 'You calculate Cook\'s distance and find 8 observations with D > 4/n (where n=200). What is the correct interpretation?',
    options: ['Remove all 8 observations', 'These are outliers that must be excluded', 'These observations are influential and warrant investigation', 'The model is invalid'],
    correct: 2,
    rationale: 'Cook\'s D identifies influential observations, not necessarily errors. Investigate each one: are they plausible? Data errors? If legitimate, report results with and without them (sensitivity analysis).',
    module: 'Regression Diagnostics'
  },
  {
    id: 9,
    question: 'What is the main advantage of k-fold cross-validation over a single train/test split?',
    options: ['Faster computation', 'Uses all data for both training and testing', 'Always gives higher performance metrics', 'Eliminates the need for external validation'],
    correct: 1,
    rationale: 'k-fold CV uses each observation for testing exactly once, maximizing data use and providing more stable performance estimates by averaging across k folds. It doesn\'t replace external validation.',
    module: 'Validation'
  },
  {
    id: 10,
    question: 'You perform 5-fold cross-validation and get accuracy: [0.78, 0.81, 0.79, 0.92, 0.77]. What does the 0.92 in fold 4 suggest?',
    options: ['Fold 4 had better quality data', 'The model is unstable or fold 4 was lucky', 'This is normal variation', 'The model is overfitting'],
    correct: 1,
    rationale: 'Large variation across folds (especially one outlier) suggests instability. This could be due to small sample size, random split luck, or class imbalance. Investigate fold 4 composition and consider stratified k-fold.',
    module: 'Validation'
  },
  {
    id: 11,
    question: 'When should you use stratified k-fold cross-validation instead of regular k-fold?',
    options: ['Always - it\'s always better', 'When outcome is continuous', 'When outcome is imbalanced binary or categorical', 'When sample size is large'],
    correct: 2,
    rationale: 'Stratified k-fold ensures each fold has similar outcome proportions, critical for imbalanced data (e.g., 5% mortality). Regular k-fold might create folds with 0% or 10% mortality by chance.',
    module: 'Validation'
  },
  {
    id: 12,
    question: 'What is the purpose of bootstrap confidence intervals?',
    options: ['To improve model accuracy', 'To handle missing data', 'To estimate uncertainty without assuming normality', 'To detect outliers'],
    correct: 2,
    rationale: 'Bootstrap CIs use resampling to estimate the sampling distribution of a statistic without parametric assumptions. This is especially useful for complex statistics (e.g., AUC, median) where theoretical CIs are difficult.',
    module: 'Validation'
  },
  {
    id: 13,
    question: 'You use 1000 bootstrap samples to estimate a 95% CI. How do you construct the percentile CI?',
    options: ['Mean ± 1.96 × SD of bootstrap estimates', 'Min and max of bootstrap estimates', '2.5th and 97.5th percentiles of bootstrap distribution', 'Use only the middle 1000 estimates'],
    correct: 2,
    rationale: 'The percentile method takes the 2.5th and 97.5th percentiles of the bootstrap distribution as the 95% CI. This is non-parametric and doesn\'t assume normality.',
    module: 'Validation'
  },
  {
    id: 14,
    question: 'Why is setting a random seed important for reproducibility?',
    options: ['It improves model performance', 'It ensures identical results when code is re-run', 'It removes all randomness from analysis', 'It\'s only needed for simulations'],
    correct: 1,
    rationale: 'Setting a seed ensures that random processes (sampling, CV splits, imputation) produce identical results on re-run, making your analysis reproducible. Without it, results will vary each time.',
    module: 'Reproducibility'
  },
  {
    id: 15,
    question: 'Your dataset has perfect separation: all diabetic patients were readmitted, all non-diabetic were not. What will happen in logistic regression?',
    options: ['Perfect prediction with AUC = 1.0', 'Coefficients will be extremely large and unstable', 'The model will not converge', 'Both B and C'],
    correct: 3,
    rationale: 'Perfect separation causes convergence problems and infinite coefficient estimates. Solutions: collect more data, use penalized regression (Firth), or reconsider the predictor. This is a data problem, not a model problem.',
    module: 'Raw Data'
  },
  {
    id: 16,
    question: 'What does MNAR (Missing Not At Random) mean?',
    options: ['Missing data has no pattern', 'Missingness depends on observed variables', 'Missingness depends on the unobserved value itself', 'Missing data can be ignored'],
    correct: 2,
    rationale: 'MNAR means missingness depends on the value that would have been observed. Example: patients with higher depression scores are less likely to complete depression questionnaires. MNAR is problematic and cannot be handled by standard imputation.',
    module: 'Missing Data'
  },
  {
    id: 17,
    question: 'You have 30% missing data in a key predictor. Complete case analysis leaves you with only 100 observations. What is the risk?',
    options: ['Loss of statistical power and potential bias', 'Improved accuracy', 'No risk if missingness is MCAR', 'The model will be more generalizable'],
    correct: 0,
    rationale: 'Even with MCAR, complete case analysis loses power due to reduced sample size. If missingness is MAR or MNAR, results will be biased. With only 100 observations, you also risk overfitting.',
    module: 'Missing Data'
  },
  {
    id: 18,
    question: 'Which statement about mean imputation is TRUE?',
    options: ['It preserves the mean but underestimates variance', 'It should be used for all missing data', 'It accounts for uncertainty in missing values', 'It works best with MNAR data'],
    correct: 0,
    rationale: 'Mean imputation preserves the variable mean but artificially reduces variance and destroys correlations. It treats imputed values as known, ignoring uncertainty. Use only for MCAR with low missingness (<5%).',
    module: 'Missing Data'
  },
  {
    id: 19,
    question: 'Two predictors have correlation r = 0.85. What should you do?',
    options: ['Automatically remove one', 'Check VIF values in the full model', 'Use both - correlation doesn\'t matter', 'Transform both variables'],
    correct: 1,
    rationale: 'High correlation doesn\'t guarantee multicollinearity problems in regression. Check VIF in the full model context. If VIF < 5, both can be retained. Clinical judgment determines which to keep if VIF is high.',
    module: 'Multicollinearity'
  },
  {
    id: 20,
    question: 'What is the purpose of external validation for a prediction model?',
    options: ['To improve model accuracy', 'To test generalizability in a different population/setting', 'To replace internal validation', 'To increase sample size'],
    correct: 1,
    rationale: 'External validation tests whether the model works in different populations, time periods, or settings. This is the gold standard for prediction models (TRIPOD guidelines). Internal validation (CV) alone is insufficient.',
    module: 'Validation'
  }
];

export function AssessmentHub() {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const score = Object.entries(selectedAnswers).filter(
    ([id, answer]) => answer === sampleQuestions.find(q => q.id === parseInt(id))?.correct
  ).length;

  const percentage = Math.round((score / sampleQuestions.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Award className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Assessment Hub</h1>
        </div>
        <p className="text-muted-foreground">
          Test your understanding with scenario-based questions from all modules.
        </p>
      </div>

      <Tabs defaultValue="quiz" className="w-full">
        <TabsList>
          <TabsTrigger value="quiz">Practice Quiz</TabsTrigger>
          <TabsTrigger value="scenarios">Clinical Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="quiz" className="space-y-4">
          {!showResults ? (
            <>
              {sampleQuestions.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                        <Badge variant="outline" className="mt-2">{question.module}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="font-medium">{question.question}</p>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            checked={selectedAnswers[question.id] === optionIndex}
                            onChange={() => handleAnswer(question.id, optionIndex)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                onClick={handleSubmit}
                disabled={Object.keys(selectedAnswers).length !== sampleQuestions.length}
                className="w-full"
                size="lg"
              >
                Submit Answers
              </Button>
            </>
          ) : (
            <>
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Award className="h-6 w-6" />
                    Your Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="text-5xl font-bold text-primary">
                      {score} / {sampleQuestions.length}
                    </div>
                    <div className="text-2xl text-muted-foreground">
                      {percentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {percentage >= 80 && '🎉 Excellent! You have a strong understanding of the material.'}
                      {percentage >= 60 && percentage < 80 && '👍 Good work! Review the explanations below to strengthen your knowledge.'}
                      {percentage < 60 && '📚 Keep learning! Review the modules and try again.'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {sampleQuestions.map((question, index) => {
                const userAnswer = selectedAnswers[question.id];
                const isCorrect = userAnswer === question.correct;

                return (
                  <Card key={question.id} className={isCorrect ? 'border-green-500' : 'border-red-500'}>
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-1" />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                          <Badge variant="outline" className="mt-2">{question.module}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="font-medium">{question.question}</p>

                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isUserAnswer = userAnswer === optionIndex;
                          const isCorrectAnswer = question.correct === optionIndex;

                          return (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-lg border ${isCorrectAnswer ? 'bg-green-500/10 border-green-500' : isUserAnswer ? 'bg-red-500/10 border-red-500' : ''
                                }`}
                            >
                              <div className="flex items-center gap-2">
                                {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-green-500" />}
                                {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 text-red-500" />}
                                <span className="text-sm">{option}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                        <p className="font-semibold text-sm mb-2">💡 Explanation</p>
                        <p className="text-sm text-muted-foreground">{question.rationale}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <Button onClick={() => { setShowResults(false); setSelectedAnswers({}); }} className="w-full" size="lg">
                Try Again
              </Button>
            </>
          )}
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Research Scenarios</CardTitle>
              <CardDescription>
                Apply your knowledge to realistic research situations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <p className="font-semibold">Scenario 1: Retrospective Chart Review</p>
                <p className="text-sm text-muted-foreground">
                  You're analyzing a retrospective cohort of 500 patients with heart failure. Your
                  outcome is 30-day readmission. You notice that ejection fraction (EF) is missing
                  for 20% of patients, and missingness is higher in older patients and those with
                  preserved EF. How should you handle this?
                </p>
                <div className="border-l-4 border-primary pl-4 text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Consider:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>What is the likely missingness mechanism?</li>
                    <li>Is complete case analysis appropriate?</li>
                    <li>If imputing, which variables should be in the imputation model?</li>
                    <li>How would you conduct sensitivity analysis?</li>
                  </ul>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <p className="font-semibold">Scenario 2: Prediction Model Development</p>
                <p className="text-sm text-muted-foreground">
                  You're building a model to predict surgical site infection using 15 candidate
                  predictors in 300 patients. VIF analysis shows that BMI and weight have VIF &gt; 12.
                  Your initial model has AUC = 0.85 on the full dataset.
                </p>
                <div className="border-l-4 border-primary pl-4 text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Consider:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>How should you address the multicollinearity?</li>
                    <li>Is AUC = 0.85 on the full dataset impressive?</li>
                    <li>What validation strategy is appropriate for n=300?</li>
                    <li>What would optimism-corrected performance likely be?</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  These scenarios don't have single "right" answers. They require you to weigh
                  trade-offs, make assumptions explicit, and justify your decisions—just like
                  real research.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
