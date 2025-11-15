import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Generate synthetic data for transformation demo
const generateSkewedData = (n: number, transform: 'none' | 'log' | 'sqrt') => {
  const data = [];
  for (let i = 0; i < n; i++) {
    const raw = Math.exp(Math.random() * 3); // Positively skewed
    let value = raw;
    if (transform === 'log') value = Math.log(raw);
    if (transform === 'sqrt') value = Math.sqrt(raw);
    data.push({ x: i, raw, value });
  }
  return data;
};

export function CleaningPreprocessing() {
  const [transformType, setTransformType] = useState<'none' | 'log' | 'sqrt'>('none');
  const [winsorPercentile, setWinsorPercentile] = useState([95]);
  const [data, setData] = useState(() => generateSkewedData(100, 'none'));

  const handleTransformChange = (value: 'none' | 'log' | 'sqrt') => {
    setTransformType(value);
    setData(generateSkewedData(100, value));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Cleaning & Preprocessing</h1>
        </div>
        <p className="text-muted-foreground">
          Master data cleaning techniques including deduplication, outlier handling, and transformations.
        </p>
        <div className="flex gap-2 mt-4">
          <Badge>Beginner</Badge>
          <Badge variant="outline">45 minutes</Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deduplication">Deduplication</TabsTrigger>
          <TabsTrigger value="outliers">Outliers</TabsTrigger>
          <TabsTrigger value="transformations">Transformations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Cleaning Fundamentals</CardTitle>
              <CardDescription>
                Systematic approaches to preparing data for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Key Principles</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>Document everything:</strong> Every cleaning decision should be
                    documented and reproducible through code
                  </li>
                  <li>
                    <strong>Preserve the original:</strong> Never overwrite raw data files;
                    create cleaned versions with clear naming
                  </li>
                  <li>
                    <strong>Be conservative:</strong> When in doubt, err on the side of
                    retaining data rather than excluding it
                  </li>
                  <li>
                    <strong>Check your work:</strong> Compare distributions and summary
                    statistics before and after cleaning
                  </li>
                </ul>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Common Data Quality Issues</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">Structural Issues</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Duplicate records</li>
                      <li>Inconsistent formatting</li>
                      <li>Data entry errors</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Content Issues</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Outliers and impossible values</li>
                      <li>Missing data</li>
                      <li>Non-normal distributions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deduplication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deduplication Strategies</CardTitle>
              <CardDescription>
                Identifying and handling duplicate records
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Why Duplicates Occur</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Multiple data sources merged together</li>
                    <li>Data entry errors (same patient entered twice)</li>
                    <li>Database join issues creating Cartesian products</li>
                    <li>Repeated measures on same patient mishandled</li>
                  </ul>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold mb-2">Detection Strategy</h3>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                    <li>
                      <strong>Exact duplicates:</strong> All fields identical
                      <p className="ml-5 mt-1">Check with: <code className="bg-muted px-1 rounded">df.duplicated()</code> (Python/pandas)</p>
                    </li>
                    <li>
                      <strong>Key-based duplicates:</strong> Same patient ID, date, or identifier
                      <p className="ml-5 mt-1">Check with: <code className="bg-muted px-1 rounded">df.duplicated(subset=['id', 'date'])</code></p>
                    </li>
                    <li>
                      <strong>Fuzzy duplicates:</strong> Similar but not identical (e.g., "John Smith" vs "J. Smith")
                      <p className="ml-5 mt-1">Requires string matching algorithms</p>
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Handling Duplicates</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                      <p className="font-medium text-sm mb-1">✅ Good Approach</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Investigate why duplicates exist</li>
                        <li>Document how many found</li>
                        <li>Choose removal criteria systematically</li>
                        <li>Keep first/last based on logic</li>
                      </ul>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                      <p className="font-medium text-sm mb-1">❌ Bad Approach</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Delete without investigating</li>
                        <li>Random selection</li>
                        <li>Undocumented removal</li>
                        <li>Ignoring the problem</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">💡 Clinical Research Example</p>
                  <p className="text-sm text-muted-foreground">
                    A patient readmitted multiple times might appear as duplicates if you're analyzing
                    index admissions. You need to define which admission counts as "index" (first? most
                    recent? most severe?) and document this clearly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outlier Detection and Handling</CardTitle>
              <CardDescription>
                When to keep, transform, or exclude extreme values
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">⚠️ Critical Distinction</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Outliers ≠ Errors.</strong> An outlier is an extreme value that may be
                  real and informative. An error is an impossible or implausible value that should
                  be corrected or removed. Always investigate before removing.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">Detection Methods</h3>

                <div className="border-l-4 border-primary pl-4 space-y-2">
                  <p className="font-medium text-sm">1. Range-Based Rules</p>
                  <p className="text-sm text-muted-foreground">
                    Flag values outside biologically plausible ranges
                  </p>
                  <p className="text-xs text-muted-foreground ml-4">
                    Example: Age &lt; 0 or &gt; 120, systolic BP &lt; 50 or &gt; 300
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4 space-y-2">
                  <p className="font-medium text-sm">2. Statistical Rules (IQR Method)</p>
                  <p className="text-sm text-muted-foreground">
                    Values &lt; Q1 - 1.5×IQR or &gt; Q3 + 1.5×IQR
                  </p>
                  <p className="text-xs text-muted-foreground ml-4">
                    Where Q1 = 25th percentile, Q3 = 75th percentile, IQR = Q3 - Q1
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4 space-y-2">
                  <p className="font-medium text-sm">3. Z-score Method</p>
                  <p className="text-sm text-muted-foreground">
                    Values with |z-score| &gt; 3 (more than 3 standard deviations from mean)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Handling Strategies</h3>
                <div className="space-y-3">
                  <div className="bg-muted/30 p-3 rounded">
                    <p className="font-medium text-sm mb-1">Winsorization</p>
                    <p className="text-sm text-muted-foreground">
                      Cap extreme values at a specified percentile (e.g., 95th or 99th). Preserves
                      sample size while reducing influence of extremes.
                    </p>
                  </div>

                  <div className="bg-muted/30 p-3 rounded">
                    <p className="font-medium text-sm mb-1">Transformation</p>
                    <p className="text-sm text-muted-foreground">
                      Apply log, square root, or other transformations to reduce skewness and
                      compress extreme values (see Transformations tab).
                    </p>
                  </div>

                  <div className="bg-muted/30 p-3 rounded">
                    <p className="font-medium text-sm mb-1">Robust Methods</p>
                    <p className="text-sm text-muted-foreground">
                      Use statistical methods less sensitive to outliers (e.g., median instead of
                      mean, robust regression).
                    </p>
                  </div>

                  <div className="bg-muted/30 p-3 rounded">
                    <p className="font-medium text-sm mb-1">Exclusion (Last Resort)</p>
                    <p className="text-sm text-muted-foreground">
                      Only exclude if you can justify that values are errors, not real data.
                      Document clearly in methods.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Winsorization Percentile: {winsorPercentile[0]}%</Label>
                <Slider
                  value={winsorPercentile}
                  onValueChange={setWinsorPercentile}
                  min={90}
                  max={99}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Values above the {winsorPercentile[0]}th percentile would be capped at that value.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transformations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Transformations</CardTitle>
              <CardDescription>
                When and how to transform variables for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Why Transform?</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Reduce skewness to meet normality assumptions</li>
                  <li>Stabilize variance (homoscedasticity)</li>
                  <li>Make relationships more linear</li>
                  <li>Reduce influence of extreme values</li>
                </ul>
              </div>

              {/* Interactive Transformation Demo */}
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                <div>
                  <Label>Select Transformation</Label>
                  <Select value={transformType} onValueChange={(v: any) => handleTransformChange(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Raw Data)</SelectItem>
                      <SelectItem value="log">Log Transformation</SelectItem>
                      <SelectItem value="sqrt">Square Root Transformation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="x" label={{ value: 'Observation', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-sm text-muted-foreground">
                  {transformType === 'none' && 'Raw positively skewed data. Notice the extreme values.'}
                  {transformType === 'log' && 'Log transformation compresses the range and reduces right skewness.'}
                  {transformType === 'sqrt' && 'Square root transformation is less aggressive than log for mild skewness.'}
                </p>
              </div>

              {/* Common Transformations */}
              <div className="space-y-3">
                <h3 className="font-semibold">Common Transformations</h3>

                <div className="grid gap-3">
                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm mb-1">Log Transformation: log(x)</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Use for:</strong> Highly right-skewed data, multiplicative relationships
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Requires x &gt; 0. For data with zeros, use log(x + 1) or log(x + c)
                    </p>
                  </div>

                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm mb-1">Square Root: √x</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Use for:</strong> Count data, mild right skewness
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Less aggressive than log, works with x ≥ 0
                    </p>
                  </div>

                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm mb-1">Square: x²</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Use for:</strong> Left-skewed data (rare in clinical research)
                    </p>
                  </div>

                  <div className="border rounded-lg p-3">
                    <p className="font-medium text-sm mb-1">Reciprocal: 1/x</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Use for:</strong> Extreme right skewness, hyperbolic relationships
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Reverses order; requires x ≠ 0
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">⚠️ Important Cautions</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Interpretation changes after transformation (e.g., log(BMI) not same as BMI)</li>
                  <li>Report both original and transformed summaries in methods</li>
                  <li>Back-transform results for clinical interpretation when possible</li>
                  <li>Don't transform just to get p &lt; 0.05 — that's p-hacking!</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
