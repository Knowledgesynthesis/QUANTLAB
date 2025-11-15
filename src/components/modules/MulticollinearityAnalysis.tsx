import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';
import { MulticollinearityVisualizer } from '@/components/interactives/MulticollinearityVisualizer';

export function MulticollinearityAnalysis() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Network className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Multicollinearity Analysis</h1>
        </div>
        <p className="text-muted-foreground">
          Detect and handle multicollinearity using VIF, correlation matrices, and condition indices.
        </p>
        <div className="flex gap-2 mt-4">
          <Badge>Intermediate</Badge>
          <Badge variant="outline">45 minutes</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detection">Detection</TabsTrigger>
          <TabsTrigger value="vif">VIF Analysis</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="visualizer">Interactive Visualizer</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Understanding Multicollinearity</CardTitle>
              <CardDescription>
                When predictors are too correlated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What is Multicollinearity?</h3>
                <p className="text-sm text-muted-foreground">
                  Multicollinearity occurs when two or more predictor variables in a regression model
                  are highly correlated with each other. This makes it difficult to isolate the
                  individual effect of each predictor.
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">⚠️ Why It Matters</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Inflates standard errors → wider confidence intervals</li>
                  <li>Makes coefficients unstable (change dramatically with small data changes)</li>
                  <li>Coefficient signs may be unexpected or wrong</li>
                  <li>Makes it hard to determine which predictors are "truly" important</li>
                  <li>Doesn't affect overall model fit (R²) or predictions</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Common Sources in Clinical Research</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground mb-1">Definitional</p>
                    <p>Including both BMI and height/weight; systolic and diastolic BP</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground mb-1">Disease Progression</p>
                    <p>Multiple labs that change together (e.g., renal function markers)</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground mb-1">Shared Risk Factors</p>
                    <p>Age, diabetes, hypertension all correlated in cardiovascular studies</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium text-foreground mb-1">Polynomial Terms</p>
                    <p>Including X and X² creates high correlation</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">💡 Key Insight</p>
                <p className="text-sm text-muted-foreground">
                  Multicollinearity is a <strong>precision problem</strong>, not a bias problem.
                  Your coefficients are still unbiased, but they have large standard errors. If your
                  goal is prediction (not interpretation), multicollinearity may not matter.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detection Methods</CardTitle>
              <CardDescription>
                How to identify multicollinearity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">1. Correlation Matrix</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Examine pairwise correlations between predictors.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Rule of thumb:</strong> Correlations &gt; 0.8 or 0.9 suggest potential problems
                  </p>
                  <p className="text-xs text-yellow-500 mt-1">
                    ⚠️ Limitation: Only detects pairwise, not multivariate multicollinearity
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">2. Variance Inflation Factor (VIF)</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Quantifies how much variance of a coefficient is inflated due to correlation
                    with other predictors.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    VIF = 1 / (1 - R²ⱼ), where R²ⱼ is from regressing predictor j on all other predictors
                  </p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="font-medium">Interpretation:</p>
                    <ul className="list-disc list-inside ml-4 text-muted-foreground">
                      <li>VIF = 1: No correlation</li>
                      <li>VIF 1-5: Moderate correlation (usually OK)</li>
                      <li>VIF 5-10: High correlation (concerning)</li>
                      <li>VIF &gt; 10: Severe multicollinearity (action needed)</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">3. Condition Index</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Based on eigenvalues of correlation matrix. Detects patterns of dependency.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Rule of thumb:</strong> Condition index &gt; 30 indicates multicollinearity
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">4. Regression Symptoms</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Indirect signs in your regression output:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside ml-4 space-y-1">
                    <li>High R² but few significant predictors</li>
                    <li>Large changes in coefficients when adding/removing predictors</li>
                    <li>Coefficients with unexpected signs</li>
                    <li>Very large standard errors</li>
                  </ul>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-semibold mb-2">Example VIF Interpretation</p>
                <div className="font-mono text-xs space-y-1 bg-background p-3 rounded border">
                  <p>Predictor         VIF    Interpretation</p>
                  <p>-----------------------------------------</p>
                  <p>Age               1.8    ✅ No problem</p>
                  <p>BMI               2.3    ✅ No problem</p>
                  <p>Creatinine       12.4    ❌ Severe multicollinearity</p>
                  <p>eGFR             11.8    ❌ Severe multicollinearity</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Creatinine and eGFR are mathematically related (eGFR is calculated from creatinine),
                  so high VIF is expected. You should include only one of them in the model.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vif" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>VIF in Practice</CardTitle>
              <CardDescription>
                Step-by-step approach to using VIF
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  VIF is the most commonly used and most useful diagnostic for multicollinearity.
                  Here's how to use it systematically.
                </p>

                <div className="border-l-4 border-primary pl-4 space-y-2">
                  <p className="font-semibold">Step 1: Calculate VIF for All Predictors</p>
                  <p className="text-sm text-muted-foreground">
                    Most statistical software has built-in VIF functions:
                  </p>
                  <div className="bg-muted/30 p-3 rounded mt-2">
                    <p className="font-mono text-xs mb-1"># R</p>
                    <p className="font-mono text-xs">library(car)</p>
                    <p className="font-mono text-xs">vif(your_model)</p>
                    <p className="font-mono text-xs mt-2"># Python</p>
                    <p className="font-mono text-xs">from statsmodels.stats.outliers_influence import variance_inflation_factor</p>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4 space-y-2">
                  <p className="font-semibold">Step 2: Identify Problematic Variables</p>
                  <p className="text-sm text-muted-foreground">
                    Flag any variables with VIF &gt; 5 or 10 (depending on your threshold).
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4 space-y-2">
                  <p className="font-semibold">Step 3: Investigate Relationships</p>
                  <p className="text-sm text-muted-foreground">
                    Look at correlation matrix to see which variables are driving the high VIF.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4 space-y-2">
                  <p className="font-semibold">Step 4: Apply Solutions</p>
                  <p className="text-sm text-muted-foreground">
                    See Solutions tab for strategies.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4 space-y-2">
                  <p className="font-semibold">Step 5: Recalculate and Verify</p>
                  <p className="text-sm text-muted-foreground">
                    After making changes, recalculate VIF to ensure problems are resolved.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">⚠️ Special Cases</p>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>Categorical variables:</strong> If you have a categorical variable with
                    many levels (dummy coding), high VIF is expected and usually OK.
                  </p>
                  <p>
                    <strong>Interaction terms:</strong> X, Z, and X×Z will naturally be correlated.
                    Mean-center X and Z before creating interaction to reduce (but not eliminate) VIF.
                  </p>
                  <p>
                    <strong>Polynomial terms:</strong> X and X² are necessarily correlated.
                    Mean-center X before squaring to reduce VIF.
                  </p>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">✅ Reporting VIF</p>
                <p className="text-sm text-muted-foreground">
                  "We assessed multicollinearity using variance inflation factors (VIF). All
                  predictors had VIF &lt; 5, indicating no problematic collinearity (see Supplementary
                  Table X for VIF values)."
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solutions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Addressing Multicollinearity</CardTitle>
              <CardDescription>
                Strategies from simple to advanced
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">1. Remove Redundant Variables</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>When to use:</strong> Variables measure essentially the same thing
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>How:</strong> Keep the most reliable, clinically important, or easily
                    measured variable. Drop the others.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Example: If including both creatinine and eGFR, choose eGFR (clinically more interpretable)
                    or creatinine (directly measured).
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">2. Combine Correlated Variables</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>When to use:</strong> Multiple variables represent a single underlying construct
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>How:</strong> Create composite score or use principal component analysis (PCA)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Example: Combine multiple depression symptoms into total depression score
                  </p>
                  <p className="text-xs text-yellow-500 mt-1">
                    ⚠️ Caution: Interpretation becomes less specific
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">3. Center Variables (for Interactions/Polynomials)</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>When to use:</strong> High VIF due to interaction or polynomial terms
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>How:</strong> Subtract the mean from each predictor before creating
                    interactions or powers
                  </p>
                  <p className="text-xs text-muted-foreground">
                    X_centered = X - mean(X), then create X_centered × Z_centered or X_centered²
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">4. Increase Sample Size</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>When to use:</strong> If feasible and multicollinearity is moderate
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>How:</strong> Collect more data to reduce standard errors
                  </p>
                  <p className="text-xs text-muted-foreground">
                    More data won't eliminate multicollinearity but will reduce its impact on SE
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">5. Ridge Regression or LASSO</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>When to use:</strong> Prediction is the goal; severe multicollinearity persists
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>How:</strong> Penalized regression methods that shrink coefficients
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ridge regression specifically designed to handle multicollinearity
                  </p>
                  <p className="text-xs text-yellow-500 mt-1">
                    ⚠️ Caution: Coefficients are biased (but often better predictions)
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">6. Accept It (Sometimes)</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>When to use:</strong> Multicollinearity is scientifically unavoidable;
                    primary goal is overall model performance, not individual coefficient interpretation
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>How:</strong> Report VIF values, acknowledge limitations, interpret with caution
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Example: In comorbidity studies, age, diabetes, and hypertension are naturally
                    correlated. Focus on overall risk prediction rather than isolating individual effects.
                  </p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">❌ What NOT to Do</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Don't remove variables solely based on p-values</li>
                  <li>Don't use stepwise regression to "solve" multicollinearity</li>
                  <li>Don't ignore high VIF without justification</li>
                  <li>Don't claim independence of effects when VIF &gt; 10</li>
                </ul>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">💡 Decision Framework</p>
                <p className="text-sm text-muted-foreground mb-2">Ask yourself:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Is my goal inference (interpreting coefficients) or prediction?</li>
                  <li>Are the correlated variables measuring the same construct?</li>
                  <li>Is one variable more clinically meaningful than others?</li>
                  <li>What does subject-matter knowledge suggest?</li>
                </ol>
                <p className="text-sm text-muted-foreground mt-2">
                  Your answers will guide which solution is appropriate.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualizer">
          <MulticollinearityVisualizer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
