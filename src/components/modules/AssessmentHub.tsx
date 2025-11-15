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
