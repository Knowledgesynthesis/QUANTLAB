import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { MissingnessMapExplorer } from '@/components/interactives/MissingnessMapExplorer';
import { ImputationPlayground } from '@/components/interactives/ImputationPlayground';

export function MissingDataImputation() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Missing Data & Imputation</h1>
        </div>
        <p className="text-muted-foreground">
          Understand missingness mechanisms (MCAR/MAR/MNAR) and apply appropriate imputation strategies.
        </p>
        <div className="flex gap-2 mt-4">
          <Badge>Intermediate</Badge>
          <Badge variant="outline">60 minutes</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mechanisms">Mechanisms</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="pitfalls">Pitfalls</TabsTrigger>
          <TabsTrigger value="explorer">Missingness Map</TabsTrigger>
          <TabsTrigger value="imputation">Imputation Lab</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Understanding Missing Data</CardTitle>
              <CardDescription>Why missing data matters in clinical research</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Missing data is nearly universal in clinical research. How you handle it can
                dramatically affect your study's validity, power, and interpretation.
              </p>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">⚠️ Key Insight</p>
                <p className="text-sm text-muted-foreground">
                  The <strong>mechanism</strong> of missingness (why data is missing) determines
                  which imputation methods are valid. Misclassifying the mechanism can lead to
                  biased results.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Three Missingness Mechanisms</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="font-medium">MCAR - Missing Completely At Random</p>
                    <p className="text-sm text-muted-foreground">
                      Missingness is unrelated to observed or unobserved data. Rare in practice.
                    </p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <p className="font-medium">MAR - Missing At Random</p>
                    <p className="text-sm text-muted-foreground">
                      Missingness depends on observed data but not on the missing values themselves.
                      Most common assumption.
                    </p>
                  </div>
                  <div className="border-l-4 border-red-500 pl-4">
                    <p className="font-medium">MNAR - Missing Not At Random</p>
                    <p className="text-sm text-muted-foreground">
                      Missingness depends on the unobserved missing values. Most problematic.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mechanisms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Classifying Missingness Mechanisms</CardTitle>
              <CardDescription>Examples from clinical research</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                  <p className="font-semibold mb-2">MCAR Example</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Scenario:</strong> Lab values missing because vials were randomly
                    dropped during transport.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    The missingness has nothing to do with patient characteristics or lab values—it's
                    truly random. Complete case analysis (listwise deletion) is unbiased under MCAR.
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                  <p className="font-semibold mb-2">MAR Example</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Scenario:</strong> Older patients are more likely to have missing BMI
                    because they can't stand for measurement.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Missingness depends on age (observed), not on BMI itself (unobserved). If we
                    include age in our imputation model, MAR assumption may be reasonable.
                  </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                  <p className="font-semibold mb-2">MNAR Example</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Scenario:</strong> Patients with higher depression scores are less
                    likely to complete depression questionnaires.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Missingness depends on the unobserved value itself (the depression score we're
                    trying to measure). This is problematic and requires sensitivity analyses.
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <p className="font-semibold mb-2">💡 Testing for MCAR</p>
                  <p className="text-sm text-muted-foreground">
                    Little's MCAR test compares observed data patterns. However, you <strong>cannot</strong> statistically
                    distinguish MAR from MNAR using observed data alone. You need subject-matter expertise.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Imputation Strategies</CardTitle>
              <CardDescription>From simple to sophisticated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">1. Complete Case Analysis (Listwise Deletion)</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Remove any observation with any missing data.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-green-500 mb-1">✅ Advantages</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        <li>Simple to implement</li>
                        <li>Unbiased under MCAR</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-500 mb-1">❌ Disadvantages</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        <li>Loses power and information</li>
                        <li>Biased under MAR/MNAR</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">2. Simple Imputation</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Replace missing with mean, median, or mode.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-green-500 mb-1">✅ Advantages</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        <li>Preserves sample size</li>
                        <li>Easy to implement</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-500 mb-1">❌ Disadvantages</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        <li>Distorts distributions</li>
                        <li>Underestimates variance</li>
                        <li>Biases correlations toward zero</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">3. Multiple Imputation (MI)</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Generate multiple imputed datasets, analyze each, pool results.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-green-500 mb-1">✅ Advantages</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        <li>Gold standard under MAR</li>
                        <li>Preserves uncertainty</li>
                        <li>Valid standard errors</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-yellow-500 mb-1">⚠️ Considerations</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        <li>More complex</li>
                        <li>Requires MAR assumption</li>
                        <li>Need proper pooling (Rubin's rules)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="font-semibold mb-2">4. Maximum Likelihood (ML/FIML)</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Directly estimate parameters using all available data.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-green-500 mb-1">✅ Advantages</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        <li>Efficient under MAR</li>
                        <li>Single analysis</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-yellow-500 mb-1">⚠️ Considerations</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        <li>Limited to some models</li>
                        <li>Requires specialized software</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">📊 Recommendation for Clinical Research</p>
                <p className="text-sm text-muted-foreground">
                  Use <strong>multiple imputation</strong> as your primary approach when &gt;5%
                  missingness exists. Always conduct sensitivity analyses comparing complete case
                  and imputed results. Report both in your manuscript.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pitfalls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Common Pitfalls and Best Practices</CardTitle>
              <CardDescription>Avoid these mistakes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                  <p className="font-semibold mb-2">❌ Pitfall #1: Impute First, Split Later</p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Wrong:</strong> Impute on full dataset, then split into train/test.
                    This causes data leakage!
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Right:</strong> Split first, then impute training set, apply same
                    imputation model to test set.
                  </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                  <p className="font-semibold mb-2">❌ Pitfall #2: Forget Variables That Predict Missingness</p>
                  <p className="text-sm text-muted-foreground">
                    For MAR assumption to hold, include variables related to missingness in your
                    imputation model, even if not in your analysis model.
                  </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                  <p className="font-semibold mb-2">❌ Pitfall #3: Too Few Imputations</p>
                  <p className="text-sm text-muted-foreground">
                    Old guidance: m = 5 imputations. Modern recommendation: m ≥ % missingness (e.g.,
                    20% missing → 20+ imputations).
                  </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                  <p className="font-semibold mb-2">❌ Pitfall #4: Impute the Outcome in Prediction Models</p>
                  <p className="text-sm text-muted-foreground">
                    In prediction models, you typically should <strong>not</strong> impute the
                    outcome variable—only predictors. Observations with missing outcomes are usually
                    excluded.
                  </p>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                  <p className="font-semibold mb-2">✅ Best Practice Checklist</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Report % missing for each variable</li>
                    <li>Describe missingness patterns visually (missingness map)</li>
                    <li>State your assumed mechanism (MCAR/MAR/MNAR) and justify</li>
                    <li>Describe imputation method in detail</li>
                    <li>Conduct sensitivity analyses</li>
                    <li>Report whether results differ between complete case and imputed</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explorer">
          <MissingnessMapExplorer />
        </TabsContent>

        <TabsContent value="imputation">
          <ImputationPlayground />
        </TabsContent>
      </Tabs>
    </div>
  );
}
