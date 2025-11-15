import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart } from 'lucide-react';
import { DiagnosticDashboard } from '@/components/interactives/DiagnosticDashboard';

export function RegressionDiagnostics() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <LineChart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Regression Diagnostics</h1>
        </div>
        <p className="text-muted-foreground">
          Perform comprehensive regression diagnostics including residuals, leverage, and influence analysis.
        </p>
        <div className="flex gap-2 mt-4">
          <Badge>Intermediate</Badge>
          <Badge variant="outline">60 minutes</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="residuals">Residuals</TabsTrigger>
          <TabsTrigger value="influence">Influence</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="dashboard">Interactive Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Why Regression Diagnostics Matter</CardTitle>
              <CardDescription>
                Fitting a model is easy. Validating it is hard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Regression diagnostics help you assess whether your model assumptions are met and
                identify observations that unduly influence your results.
              </p>

              <div className="space-y-2">
                <h3 className="font-semibold">Core Assumptions of Linear Regression</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>Linearity:</strong> Relationship between X and Y is linear</li>
                  <li><strong>Independence:</strong> Observations are independent</li>
                  <li><strong>Homoscedasticity:</strong> Constant variance of residuals</li>
                  <li><strong>Normality:</strong> Residuals are normally distributed</li>
                  <li><strong>No multicollinearity:</strong> Predictors not highly correlated (see Multicollinearity module)</li>
                </ol>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">⚠️ Important</p>
                <p className="text-sm text-muted-foreground">
                  Violating assumptions doesn't always invalidate your model, but you need to
                  understand the violations and their implications. Some violations can be fixed
                  (transformation, robust SE), others mean you need a different model.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="residuals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Residual Analysis</CardTitle>
              <CardDescription>
                The foundation of regression diagnostics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">What are Residuals?</h3>
                  <p className="text-sm text-muted-foreground">
                    Residual = Observed Value - Predicted Value (e = y - ŷ)
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Residuals represent the "error" in your model—what your model failed to explain.
                    They should be random noise if your model is correctly specified.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold">Key Residual Plots</h3>

                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-medium text-sm mb-1">1. Residuals vs. Fitted Values</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Checks linearity and homoscedasticity.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>What to look for:</strong> Random scatter around zero, no patterns,
                      no funnel shape.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-medium text-sm mb-1">2. QQ Plot (Normal Q-Q)</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Checks normality of residuals.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>What to look for:</strong> Points falling along the diagonal line.
                      Deviations at tails indicate non-normality.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-medium text-sm mb-1">3. Scale-Location (Spread-Location)</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Checks homoscedasticity using standardized residuals.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>What to look for:</strong> Horizontal line with random scatter.
                      Upward/downward trend indicates heteroscedasticity.
                    </p>
                  </div>

                  <div className="border-l-4 border-primary pl-4">
                    <p className="font-medium text-sm mb-1">4. Residuals vs. Leverage</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Identifies influential observations (see Influence tab).
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>What to look for:</strong> Points beyond Cook's distance contours
                      (often shown as dashed lines).
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <p className="font-semibold mb-2">💡 Interpretation Tips</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Curved pattern → Non-linear relationship, try transformation or polynomial terms</li>
                    <li>Funnel shape → Heteroscedasticity, consider robust SE or transformation</li>
                    <li>Heavy tails in QQ → Non-normality, less critical for large samples</li>
                    <li>Labeled outliers → Investigate these observations individually</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="influence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Influence Diagnostics</CardTitle>
              <CardDescription>
                Not all observations are created equal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Some observations have outsized influence on regression coefficients. Identifying
                them helps you understand the stability of your results.
              </p>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">Leverage (Hat Values)</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Measures how far an observation's predictor values are from the mean of predictors.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Threshold:</strong> 2(p+1)/n or 3(p+1)/n, where p = # predictors, n = sample size
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Interpretation:</strong> High leverage = unusual X values, doesn't mean
                    influential (that depends on Y too).
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">Cook's Distance</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Measures how much regression coefficients change if observation is removed.
                    Combines leverage and residual size.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Threshold:</strong> D &gt; 4/n (conservative) or D &gt; 1 (liberal)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Interpretation:</strong> Large Cook's D = influential observation. Investigate!
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">DFBETAS</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Measures change in each specific regression coefficient if observation removed.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Threshold:</strong> |DFBETA| &gt; 2/√n
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Interpretation:</strong> Shows which coefficients are most affected by
                    each observation.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">Standardized Residuals</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Residuals divided by their standard error.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Threshold:</strong> |standardized residual| &gt; 2 or 3
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Interpretation:</strong> Identifies outliers in Y direction (unusual
                    outcome values given predictors).
                  </p>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">⚠️ What to Do With Influential Observations</p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li><strong>Investigate:</strong> Is it a data entry error? Biologically plausible?</li>
                  <li><strong>Don't automatically remove:</strong> Influential doesn't mean wrong</li>
                  <li><strong>Sensitivity analysis:</strong> Report results with and without influential observations</li>
                  <li><strong>Consider robust methods:</strong> If many influential points, use robust regression</li>
                  <li><strong>Document decisions:</strong> Clearly state what you did and why in methods</li>
                </ol>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">✅ Reporting in Manuscripts</p>
                <p className="text-sm text-muted-foreground">
                  "Regression diagnostics revealed [X] observations with Cook's distance &gt; 4/n.
                  Sensitivity analyses excluding these observations showed [similar/different]
                  results (see Supplementary Table X). We retained all observations in the primary
                  analysis as they represented plausible clinical scenarios."
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assumptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testing and Addressing Assumption Violations</CardTitle>
              <CardDescription>
                When assumptions fail, you have options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">Non-Linearity</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Detection:</strong> Curved pattern in residual vs. fitted plot
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Solutions:</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                    <li>Transform outcome or predictor (log, sqrt, etc.)</li>
                    <li>Add polynomial terms (X²)</li>
                    <li>Use splines or generalized additive models (GAMs)</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">Heteroscedasticity</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Detection:</strong> Funnel shape in residual plots; Breusch-Pagan test
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Solutions:</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                    <li>Robust (Huber-White) standard errors</li>
                    <li>Transform outcome (often log transformation helps)</li>
                    <li>Weighted least squares</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">Non-Normality of Residuals</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Detection:</strong> QQ plot deviations; Shapiro-Wilk test
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Solutions:</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                    <li>Often OK with large samples (Central Limit Theorem)</li>
                    <li>Transform outcome if severe</li>
                    <li>Use robust regression or non-parametric bootstrap</li>
                    <li>Consider generalized linear models if appropriate</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">Non-Independence</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Detection:</strong> Durbin-Watson test; domain knowledge (e.g., repeated measures)
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Solutions:</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside ml-4 space-y-1">
                    <li>Mixed-effects models (random effects for clusters)</li>
                    <li>GEE (generalized estimating equations)</li>
                    <li>Time series methods for temporal correlation</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">📊 Practical Approach</p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Always plot diagnostics, don't just rely on tests</li>
                  <li>Minor violations are often OK, especially with large samples</li>
                  <li>Try transformations first (simplest solution)</li>
                  <li>If violations persist, use robust methods or different model</li>
                  <li>Report any assumption violations and how you addressed them</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <DiagnosticDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
