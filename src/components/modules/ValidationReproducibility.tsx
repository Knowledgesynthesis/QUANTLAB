import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { CrossValidationSimulator } from '@/components/interactives/CrossValidationSimulator';
import { BootstrappingDemo } from '@/components/interactives/BootstrappingDemo';

export function ValidationReproducibility() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Validation & Reproducibility</h1>
        </div>
        <p className="text-muted-foreground">
          Learn cross-validation, bootstrapping, and reproducibility best practices for research.
        </p>
        <div className="flex gap-2 mt-4">
          <Badge>Advanced</Badge>
          <Badge variant="outline">60 minutes</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cross-validation">Cross-Validation</TabsTrigger>
          <TabsTrigger value="bootstrap">Bootstrapping</TabsTrigger>
          <TabsTrigger value="reproducibility">Reproducibility</TabsTrigger>
          <TabsTrigger value="cv-simulator">CV Simulator</TabsTrigger>
          <TabsTrigger value="bootstrap-demo">Bootstrap Demo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Validation and Reproducible Research</CardTitle>
              <CardDescription>
                Ensuring your findings are robust and reproducible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Why Validation Matters</h3>
                <p className="text-sm text-muted-foreground">
                  Any model can fit your data well, but will it work on <strong>new</strong> data?
                  Validation quantifies how well your model generalizes beyond your sample.
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">⚠️ The Overfitting Problem</p>
                <p className="text-sm text-muted-foreground">
                  Models can become too tailored to your specific dataset, capturing noise instead
                  of signal. This leads to excellent performance on training data but poor
                  performance on new data—a critical failure in clinical prediction models.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Core Concepts</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded p-3">
                    <p className="font-medium mb-1">Training Error</p>
                    <p className="text-sm text-muted-foreground">
                      Model performance on the data used to build it. Always optimistic.
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium mb-1">Test Error</p>
                    <p className="text-sm text-muted-foreground">
                      Model performance on unseen data. The true measure of generalization.
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium mb-1">Bias-Variance Tradeoff</p>
                    <p className="text-sm text-muted-foreground">
                      Simple models: high bias, low variance. Complex models: low bias, high variance.
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="font-medium mb-1">Generalizability</p>
                    <p className="text-sm text-muted-foreground">
                      How well the model performs in different settings, populations, or time periods.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cross-validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Validation Strategies</CardTitle>
              <CardDescription>
                Systematically assessing model performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">Hold-Out Validation (Train/Test Split)</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Randomly split data into training (typically 70-80%) and test (20-30%) sets.
                  </p>
                  <div className="bg-muted/30 p-3 rounded mt-2">
                    <p className="text-xs mb-1"><strong>Advantages:</strong></p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      <li>Simple and fast</li>
                      <li>Mimics real-world scenario (train on existing, test on new)</li>
                    </ul>
                    <p className="text-xs mt-2"><strong>Disadvantages:</strong></p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      <li>Results depend on the specific split</li>
                      <li>Wastes data (test set not used for training)</li>
                      <li>High variance with small datasets</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">K-Fold Cross-Validation</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Split data into k equal folds. Train on k-1 folds, test on the remaining fold.
                    Repeat k times, rotating which fold is held out.
                  </p>
                  <div className="bg-muted/30 p-3 rounded mt-2">
                    <p className="text-xs mb-1"><strong>Common choices:</strong></p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      <li>k=5: Good balance, less computational cost</li>
                      <li>k=10: Standard choice, more stable estimates</li>
                      <li>k=n (Leave-One-Out): Maximum data use, high computational cost</li>
                    </ul>
                    <p className="text-xs mt-2"><strong>Final performance:</strong></p>
                    <p className="text-xs text-muted-foreground">Average performance across all k folds</p>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">Stratified K-Fold</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Like k-fold, but ensures each fold has similar proportions of outcome classes.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>When to use:</strong> Imbalanced outcomes (e.g., rare events like mortality)
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">Temporal Validation</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Train on earlier time period, test on later time period.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>When to use:</strong> When data has temporal structure or you want to
                    simulate prospective validation
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">External Validation</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Test model on completely different dataset (different hospital, different time
                    period, different population).
                  </p>
                  <p className="text-xs text-green-500">
                    ✅ Gold standard for clinical prediction models (required by TRIPOD guidelines)
                  </p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">💡 Practical Recommendations</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Use 10-fold cross-validation as default for internal validation</li>
                  <li>Always set random seed for reproducibility</li>
                  <li>For small datasets (&lt;100 observations), consider leave-one-out or bootstrap</li>
                  <li>For clinical prediction models, external validation is essential</li>
                  <li>Report both training and test performance</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bootstrap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bootstrapping</CardTitle>
              <CardDescription>
                Resampling methods for robust inference
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">What is Bootstrapping?</h3>
                <p className="text-sm text-muted-foreground">
                  Bootstrapping involves repeatedly sampling (with replacement) from your observed
                  data to create many "bootstrap samples." For each sample, you refit your model and
                  calculate statistics, building up a distribution of results.
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-sm">Bootstrap Algorithm</p>
                <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1 ml-2">
                  <li>Randomly sample n observations with replacement from your data of size n</li>
                  <li>Fit your model to this bootstrap sample</li>
                  <li>Calculate and save the statistic of interest (e.g., coefficient, AUC)</li>
                  <li>Repeat steps 1-3 many times (typically 1000-10000 iterations)</li>
                  <li>Use the distribution of saved statistics for inference</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Common Uses in Clinical Research</h3>

                <div className="border rounded p-3">
                  <p className="font-medium text-sm mb-1">1. Confidence Intervals</p>
                  <p className="text-sm text-muted-foreground">
                    Construct CIs without assuming normality. Use percentile method: 2.5th and
                    97.5th percentiles of bootstrap distribution = 95% CI.
                  </p>
                </div>

                <div className="border rounded p-3">
                  <p className="font-medium text-sm mb-1">2. Model Validation (Bootstrap Optimism)</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Quantify optimism: difference between apparent (training) and bootstrap performance.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    For each bootstrap sample: (1) fit model to bootstrap sample, (2) test on
                    bootstrap sample (optimistic), (3) test on original data (less optimistic),
                    (4) optimism = difference. Average optimism across bootstraps.
                  </p>
                </div>

                <div className="border rounded p-3">
                  <p className="font-medium text-sm mb-1">3. Variable Selection Stability</p>
                  <p className="text-sm text-muted-foreground">
                    Count how often each variable is selected across bootstrap samples. Variables
                    selected in &gt;80% of samples are considered stable.
                  </p>
                </div>

                <div className="border rounded p-3">
                  <p className="font-medium text-sm mb-1">4. Handling Small Samples</p>
                  <p className="text-sm text-muted-foreground">
                    Bootstrap can provide more reliable SEs and CIs than normal approximations when
                    sample size is small or distribution is non-normal.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">⚠️ Limitations</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Computationally intensive (need many iterations)</li>
                  <li>Assumes your sample is representative of population</li>
                  <li>Can't correct for bias, only quantify uncertainty</li>
                  <li>Not suitable for very small samples (n &lt; 20)</li>
                  <li>Complex for clustered/hierarchical data</li>
                </ul>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">✅ Reporting Bootstrap Results</p>
                <p className="text-sm text-muted-foreground">
                  "We used 1000 bootstrap samples to estimate 95% confidence intervals for model
                  performance metrics. The optimism-corrected AUC was 0.78 (95% CI: 0.72-0.84)."
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reproducibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reproducibility Best Practices</CardTitle>
              <CardDescription>
                Making your research transparent and replicable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">💡 What is Reproducibility?</p>
                <p className="text-sm text-muted-foreground">
                  Reproducibility means that another researcher, using your data and code, can
                  obtain the same results. This is distinct from <em>replicability</em> (obtaining
                  similar findings with new data).
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Essential Reproducibility Practices</h3>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">1. Version Control (Git)</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Track all changes to code over time</li>
                    <li>Document why changes were made</li>
                    <li>Easy to revert if needed</li>
                    <li>Collaborate without overwriting each other's work</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">2. Set Random Seeds</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Any random process (sampling, cross-validation, bootstrapping) should use a seed.
                  </p>
                  <div className="bg-muted/30 p-2 rounded mt-1">
                    <p className="font-mono text-xs"># R: set.seed(123)</p>
                    <p className="font-mono text-xs"># Python: np.random.seed(123)</p>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">3. Document Your Environment</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>R: Use <code className="bg-muted px-1 rounded">renv</code> or <code className="bg-muted px-1 rounded">sessionInfo()</code></li>
                    <li>Python: Use virtual environments and <code className="bg-muted px-1 rounded">requirements.txt</code></li>
                    <li>Document software versions, OS, package versions</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">4. Literate Programming</p>
                  <p className="text-sm text-muted-foreground">
                    Use R Markdown, Jupyter notebooks, or Quarto to combine code, output, and
                    narrative in a single document.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">5. Organize Your Project</p>
                  <div className="bg-muted/30 p-3 rounded mt-2">
                    <p className="text-xs font-semibold mb-2">Recommended structure:</p>
                    <pre className="text-xs text-muted-foreground font-mono">
{`project/
├── data/
│   ├── raw/          # Never modify
│   └── processed/    # Cleaned data
├── code/
│   ├── 01-clean.R
│   ├── 02-analyze.R
│   └── 03-figures.R
├── results/
│   ├── figures/
│   └── tables/
├── docs/
│   └── data-dictionary.csv
└── README.md         # Project overview`}
                    </pre>
                  </div>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">6. Write Clear Code</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Use meaningful variable names (not x1, x2, x3)</li>
                    <li>Add comments explaining <em>why</em>, not just <em>what</em></li>
                    <li>Break complex analyses into logical steps</li>
                    <li>Use consistent style (tidyverse, PEP8, etc.)</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <p className="font-semibold mb-2">7. Share Data and Code (When Possible)</p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Deposit code on GitHub/GitLab</li>
                    <li>Deposit de-identified data on repositories (Figshare, Dryad, OSF)</li>
                    <li>If data can't be shared, share synthetic data with same structure</li>
                    <li>Always share code, even if data is restricted</li>
                  </ul>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                <p className="font-semibold mb-2">✅ Reproducibility Checklist for Manuscripts</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>☐ Code is well-commented and organized</li>
                  <li>☐ Random seeds are set and documented</li>
                  <li>☐ Software versions are reported</li>
                  <li>☐ Data dictionary is included</li>
                  <li>☐ Preprocessing steps are documented</li>
                  <li>☐ Statistical analysis plan matches what was done</li>
                  <li>☐ Code and/or data are deposited in repository</li>
                  <li>☐ Figures can be regenerated from code</li>
                </ul>
              </div>

              <div className="space-y-2 mt-4">
                <h3 className="font-semibold">Reporting Guidelines</h3>
                <p className="text-sm text-muted-foreground">
                  Follow field-specific guidelines for transparent reporting:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>STROBE:</strong> Observational studies</li>
                  <li><strong>TRIPOD:</strong> Prediction models</li>
                  <li><strong>CONSORT:</strong> Randomized trials</li>
                  <li><strong>PROBAST:</strong> Prediction model bias assessment</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  See <a href="https://www.equator-network.org" className="underline">EQUATOR Network</a> for comprehensive list
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cv-simulator">
          <CrossValidationSimulator />
        </TabsContent>

        <TabsContent value="bootstrap-demo">
          <BootstrappingDemo />
        </TabsContent>
      </Tabs>
    </div>
  );
}
