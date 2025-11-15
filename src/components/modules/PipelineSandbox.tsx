import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Workflow } from 'lucide-react';
import { PipelineBuilder } from '@/components/interactives/PipelineBuilder';

export function PipelineSandbox() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Workflow className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Integrated Pipeline Sandbox</h1>
        </div>
        <p className="text-muted-foreground">
          Build complete end-to-end research data pipelines from cleaning to validation.
        </p>
        <div className="flex gap-2 mt-4">
          <Badge>Advanced</Badge>
          <Badge variant="outline">90 minutes</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Pipeline Overview</TabsTrigger>
          <TabsTrigger value="builder">Interactive Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
        <CardHeader>
          <CardTitle>Build Your Research Pipeline</CardTitle>
          <CardDescription>
            Apply everything you've learned in a comprehensive workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold">End-to-End Research Data Pipeline</h3>
            <p className="text-sm text-muted-foreground">
              This module brings together all the concepts from previous modules into a unified,
              systematic workflow that mirrors real-world clinical research.
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4 space-y-2">
              <p className="font-semibold">Step 1: Raw Data Audit</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Import and inspect synthetic dataset</li>
                <li>Document variable types and ranges</li>
                <li>Create data dictionary</li>
                <li>Identify quality issues</li>
              </ul>
            </div>

            <div className="border-l-4 border-primary pl-4 space-y-2">
              <p className="font-semibold">Step 2: Data Cleaning</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Remove duplicates</li>
                <li>Handle outliers systematically</li>
                <li>Apply necessary transformations</li>
                <li>Encode categorical variables</li>
              </ul>
            </div>

            <div className="border-l-4 border-primary pl-4 space-y-2">
              <p className="font-semibold">Step 3: Missing Data Analysis</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Assess missingness patterns</li>
                <li>Classify mechanisms (MCAR/MAR/MNAR)</li>
                <li>Select and apply imputation strategy</li>
                <li>Validate imputation results</li>
              </ul>
            </div>

            <div className="border-l-4 border-primary pl-4 space-y-2">
              <p className="font-semibold">Step 4: Model Building</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Specify analysis model</li>
                <li>Check for multicollinearity</li>
                <li>Fit initial model</li>
                <li>Examine coefficients and p-values</li>
              </ul>
            </div>

            <div className="border-l-4 border-primary pl-4 space-y-2">
              <p className="font-semibold">Step 5: Regression Diagnostics</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Create residual plots</li>
                <li>Assess assumptions (linearity, homoscedasticity, normality)</li>
                <li>Identify influential observations</li>
                <li>Apply remedies if needed</li>
              </ul>
            </div>

            <div className="border-l-4 border-primary pl-4 space-y-2">
              <p className="font-semibold">Step 6: Model Validation</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Perform cross-validation or bootstrap</li>
                <li>Calculate optimism-corrected performance</li>
                <li>Assess calibration and discrimination</li>
                <li>Conduct sensitivity analyses</li>
              </ul>
            </div>

            <div className="border-l-4 border-primary pl-4 space-y-2">
              <p className="font-semibold">Step 7: Documentation & Reporting</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Generate manuscript-ready tables</li>
                <li>Create publication-quality figures</li>
                <li>Document all decisions and assumptions</li>
                <li>Prepare reproducible code</li>
              </ul>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
            <p className="font-semibold mb-2">✅ Learning Objectives</p>
            <p className="text-sm text-muted-foreground mb-2">
              By completing this pipeline, you will:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Integrate all learned techniques into a cohesive workflow</li>
              <li>Make evidence-based decisions at each analysis step</li>
              <li>Produce transparent, reproducible research outputs</li>
              <li>Generate manuscript-ready summaries</li>
              <li>Understand the interconnections between different analysis steps</li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <p className="font-semibold mb-2">💡 Real-World Application</p>
            <p className="text-sm text-muted-foreground">
              This pipeline reflects best practices for clinical research data analysis. The
              systematic approach ensures rigor, transparency, and reproducibility—essential
              for publication in peer-reviewed journals and for clinical decision-making.
            </p>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="builder">
          <PipelineBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
