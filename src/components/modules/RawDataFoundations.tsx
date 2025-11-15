import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Database, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';

export function RawDataFoundations() {
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const updateProgress = useAppStore((state) => state.updateProgress);

  const markComplete = (section: string) => {
    setCompletedSections((prev) => new Set(prev).add(section));
    if (completedSections.size + 1 >= 3) {
      updateProgress('raw-data', true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Raw Data Foundations</h1>
        </div>
        <p className="text-muted-foreground">
          Learn to import, audit, and understand different types of messy data with data dictionaries.
        </p>
        <div className="flex gap-2 mt-4">
          <Badge>Beginner</Badge>
          <Badge variant="outline">30 minutes</Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="types">Data Types</TabsTrigger>
          <TabsTrigger value="audit">Data Audit</TabsTrigger>
          <TabsTrigger value="dictionary">Data Dictionary</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Module Overview</CardTitle>
              <CardDescription>
                Understanding raw data is the foundation of any robust analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Learning Objectives</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Identify different types of messy data and data quality issues</li>
                  <li>Import and audit synthetic datasets systematically</li>
                  <li>Create and use data dictionaries for documentation</li>
                  <li>Understand variable types and their implications for analysis</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Why This Matters</h3>
                <p className="text-sm text-muted-foreground">
                  Clinical research data is rarely clean. EHR extracts, registry data, and manually
                  collected data often contain missing values, outliers, inconsistent formatting,
                  and documentation gaps. Understanding how to systematically audit and document
                  raw data is critical for:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Identifying data quality issues early</li>
                  <li>Making informed decisions about cleaning strategies</li>
                  <li>Maintaining reproducibility and transparency</li>
                  <li>Communicating methods clearly in manuscripts</li>
                </ul>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold">Key Principle</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Never modify your raw data file.</strong> Always preserve the original
                  data and perform all transformations in documented, reproducible code. Create a
                  data dictionary that describes each variable in the raw data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Variable Types in Research Data</CardTitle>
              <CardDescription>
                Understanding variable types guides your statistical approach
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Continuous Variables */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Continuous Variables</h3>
                <p className="text-sm text-muted-foreground">
                  Numeric variables that can take any value within a range.
                </p>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Examples in Clinical Research:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Age (years), weight (kg), blood pressure (mmHg)</li>
                    <li>Laboratory values (creatinine, hemoglobin, glucose)</li>
                    <li>Time variables (length of stay, time to event)</li>
                  </ul>
                  <p className="text-sm text-muted-foreground italic mt-2">
                    ⚠️ Common issues: Outliers, measurement errors, missing values, need for
                    transformation
                  </p>
                </div>
              </div>

              {/* Categorical Variables */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Categorical Variables</h3>
                <p className="text-sm text-muted-foreground">
                  Variables with distinct categories (nominal or ordinal).
                </p>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Examples:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><strong>Nominal:</strong> Gender, race, diagnosis codes, treatment type</li>
                    <li><strong>Ordinal:</strong> Disease severity (mild/moderate/severe), pain scale (1-10)</li>
                  </ul>
                  <p className="text-sm text-muted-foreground italic mt-2">
                    ⚠️ Common issues: Inconsistent coding, typos, need for reference category
                    selection
                  </p>
                </div>
              </div>

              {/* Binary Variables */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Binary Variables</h3>
                <p className="text-sm text-muted-foreground">
                  Special case of categorical with only two levels.
                </p>
                <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Examples:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Outcome variables (alive/dead, readmitted/not readmitted)</li>
                    <li>Exposures (treatment/control, smoker/non-smoker)</li>
                  </ul>
                  <p className="text-sm text-muted-foreground italic mt-2">
                    ⚠️ Common issues: Which level is coded as 0 vs 1? Missing = distinct category?
                  </p>
                </div>
              </div>

              <Button onClick={() => markComplete('types')} className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Section Complete
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Systematic Data Audit Process</CardTitle>
              <CardDescription>
                A checklist approach to understanding your raw data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4 space-y-2">
                  <h3 className="font-semibold">Step 1: Basic Structure</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>How many observations (rows)?</li>
                    <li>How many variables (columns)?</li>
                    <li>What is the unit of observation (patient, encounter, lab result)?</li>
                    <li>Are there duplicate rows?</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4 space-y-2">
                  <h3 className="font-semibold">Step 2: Variable Inspection</h3>
                  <p className="text-sm text-muted-foreground">
                    For each variable, document:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Type (continuous, categorical, binary, date/time)</li>
                    <li>Missingness (how many missing? what percentage?)</li>
                    <li>Range (min, max, mean, median for continuous)</li>
                    <li>Distribution (categories and counts for categorical)</li>
                    <li>Unexpected values (e.g., age = 999, negative values)</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4 space-y-2">
                  <h3 className="font-semibold">Step 3: Relationships</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Are there logical inconsistencies? (e.g., male patient with pregnancy)</li>
                    <li>Do dates make sense? (discharge before admission?)</li>
                    <li>Are there expected correlations present?</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4 space-y-2">
                  <h3 className="font-semibold">Step 4: Documentation</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Is there existing documentation?</li>
                    <li>Are variable names clear or coded?</li>
                    <li>Are units specified?</li>
                    <li>Create a data dictionary (see next tab)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">💡 Reproducibility Tip</p>
                <p className="text-sm text-muted-foreground">
                  Write code to perform this audit systematically. In R, use <code className="bg-muted px-1 rounded">summary()</code>,{' '}
                  <code className="bg-muted px-1 rounded">str()</code>, and{' '}
                  <code className="bg-muted px-1 rounded">skimr::skim()</code>. In Python, use{' '}
                  <code className="bg-muted px-1 rounded">df.info()</code>,{' '}
                  <code className="bg-muted px-1 rounded">df.describe()</code>.
                </p>
              </div>

              <Button onClick={() => markComplete('audit')} className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Section Complete
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dictionary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Creating a Data Dictionary</CardTitle>
              <CardDescription>
                Essential documentation for reproducible research
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A data dictionary is a structured document that describes each variable in your
                dataset. It's essential for transparency and reproducibility.
              </p>

              <div className="space-y-2">
                <h3 className="font-semibold">Essential Elements</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Column</th>
                        <th className="text-left p-2 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b">
                        <td className="p-2 font-medium">Variable Name</td>
                        <td className="p-2">Exact name as appears in dataset</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Description</td>
                        <td className="p-2">Clear, concise description of what the variable measures</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Type</td>
                        <td className="p-2">Continuous, categorical (nominal/ordinal), binary, date</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Units</td>
                        <td className="p-2">For continuous variables (e.g., years, mg/dL, mmHg)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Valid Range/Categories</td>
                        <td className="p-2">Expected values or category labels</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Missing Values</td>
                        <td className="p-2">How missing data is coded (NA, -999, blank?)</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Source</td>
                        <td className="p-2">Where the data came from (EHR, lab, survey, etc.)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">Example Data Dictionary Entry</h3>
                <div className="text-sm space-y-1 font-mono bg-background p-3 rounded border">
                  <p><strong>Variable:</strong> age_years</p>
                  <p><strong>Description:</strong> Patient age at time of admission</p>
                  <p><strong>Type:</strong> Continuous</p>
                  <p><strong>Units:</strong> Years</p>
                  <p><strong>Valid Range:</strong> 18-110</p>
                  <p><strong>Missing:</strong> Coded as NA</p>
                  <p><strong>Source:</strong> EHR demographics table</p>
                  <p><strong>Notes:</strong> Age calculated from date of birth; 3 values &gt;100 flagged for review</p>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">✅ Best Practice</p>
                <p className="text-sm text-muted-foreground">
                  Create your data dictionary as a CSV or spreadsheet that lives with your analysis
                  code. Update it as you learn more about the data. Include it in your study
                  documentation and reference it in your methods section.
                </p>
              </div>

              <Button onClick={() => markComplete('dictionary')} className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Section Complete
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
