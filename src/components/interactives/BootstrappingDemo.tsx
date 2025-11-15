import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { bootstrapSample, mean, std } from '@/lib/statistics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export function BootstrappingDemo() {
  const [numBootstraps, setNumBootstraps] = useState([100]);
  const [isRunning, setIsRunning] = useState(false);
  const [bootstrapResults, setBootstrapResults] = useState<number[]>([]);

  // Original sample data (simulated BMI values)
  const originalSample = useMemo(() => {
    const data: number[] = [];
    for (let i = 0; i < 50; i++) {
      // Generate realistic BMI distribution
      data.push(22 + Math.random() * 15 + (Math.random() - 0.5) * 8);
    }
    return data;
  }, []);

  const sampleMean = mean(originalSample);
  const sampleStd = std(originalSample);

  // Run bootstrap
  const runBootstrap = () => {
    setIsRunning(true);
    const results: number[] = [];

    // Simulate progressive bootstrap with animation effect
    let completed = 0;
    const interval = setInterval(() => {
      if (completed < numBootstraps[0]) {
        const bootstrapped = bootstrapSample(originalSample);
        results.push(mean(bootstrapped));
        completed++;

        if (completed % 10 === 0 || completed === numBootstraps[0]) {
          setBootstrapResults([...results]);
        }
      } else {
        setIsRunning(false);
        clearInterval(interval);
      }
    }, 50);
  };

  const resetBootstrap = () => {
    setBootstrapResults([]);
  };

  // Calculate bootstrap statistics
  const bootstrapMean = bootstrapResults.length > 0 ? mean(bootstrapResults) : 0;
  const bootstrapStd = bootstrapResults.length > 0 ? std(bootstrapResults) : 0;

  // 95% confidence interval (2.5th and 97.5th percentiles)
  const sorted = [...bootstrapResults].sort((a, b) => a - b);
  const ci95Lower = sorted[Math.floor(sorted.length * 0.025)] || 0;
  const ci95Upper = sorted[Math.floor(sorted.length * 0.975)] || 0;

  // Create histogram
  const createHistogram = (data: number[], bins: number = 20) => {
    if (data.length === 0) return [];

    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;

    const histogram = Array(bins).fill(0).map((_, i) => ({
      bin: min + i * binWidth + binWidth / 2,
      count: 0,
      label: (min + i * binWidth).toFixed(1)
    }));

    data.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      if (binIndex >= 0) histogram[binIndex].count++;
    });

    return histogram;
  };

  const histogram = createHistogram(bootstrapResults);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bootstrapping Demonstration</CardTitle>
          <CardDescription>
            Watch bootstrap resampling in action and see confidence intervals emerge
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Number of Bootstrap Samples: {numBootstraps[0]}</Label>
              <Slider
                value={numBootstraps}
                onValueChange={setNumBootstraps}
                min={50}
                max={1000}
                step={50}
                className="w-full"
                disabled={isRunning}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={runBootstrap}
                disabled={isRunning}
                className="flex-1"
              >
                {isRunning ? 'Running...' : 'Run Bootstrap'}
              </Button>
              <Button
                onClick={resetBootstrap}
                variant="outline"
                disabled={isRunning || bootstrapResults.length === 0}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Original Sample Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Original Sample Size</p>
              <p className="text-2xl font-bold">{originalSample.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sample Mean</p>
              <p className="text-2xl font-bold">{sampleMean.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sample Std Dev</p>
              <p className="text-2xl font-bold">{sampleStd.toFixed(2)}</p>
            </div>
          </div>

          {/* Bootstrap Progress */}
          {bootstrapResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Bootstrap Progress</Label>
                <Badge>
                  {bootstrapResults.length} / {numBootstraps[0]}
                </Badge>
              </div>
              <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(bootstrapResults.length / numBootstraps[0]) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Bootstrap Distribution */}
          {bootstrapResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Bootstrap Distribution of Means</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogram}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      label={{ value: 'Bootstrap Mean Values', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    {/* Mark confidence interval */}
                    <ReferenceLine
                      x={ci95Lower.toFixed(1)}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      label={{ value: '2.5%', position: 'top' }}
                    />
                    <ReferenceLine
                      x={ci95Upper.toFixed(1)}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      label={{ value: '97.5%', position: 'top' }}
                    />
                    <ReferenceLine
                      x={bootstrapMean.toFixed(1)}
                      stroke="#10b981"
                      strokeWidth={2}
                      label={{ value: 'Mean', position: 'top' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Bootstrap Results */}
          {bootstrapResults.length === numBootstraps[0] && (
            <div className="border rounded-lg p-4 bg-green-500/10 border-green-500/20">
              <h3 className="font-semibold mb-3 text-green-700 dark:text-green-400">Bootstrap Results</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bootstrap Mean</p>
                  <p className="text-2xl font-bold">{bootstrapMean.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Original: {sampleMean.toFixed(2)})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Standard Error (SE)</p>
                  <p className="text-2xl font-bold">{bootstrapStd.toFixed(3)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Uncertainty in the mean estimate
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">95% Confidence Interval</p>
                  <p className="text-2xl font-bold">
                    [{ci95Lower.toFixed(2)}, {ci95Upper.toFixed(2)}]
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    We're 95% confident the true population mean lies in this interval
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* How Bootstrap Works */}
          <div className="border-l-4 border-primary pl-4 space-y-2">
            <p className="font-semibold">How Bootstrapping Works</p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>
                <strong>Resample with replacement:</strong> Draw {originalSample.length} observations
                from original sample, allowing repeats
              </li>
              <li>
                <strong>Calculate statistic:</strong> Compute mean (or other statistic) for bootstrap
                sample
              </li>
              <li>
                <strong>Repeat many times:</strong> Typically 1000+ bootstrap samples
              </li>
              <li>
                <strong>Build distribution:</strong> The distribution of bootstrap statistics
                approximates the sampling distribution
              </li>
              <li>
                <strong>Get confidence interval:</strong> Use percentiles (2.5th and 97.5th for 95% CI)
              </li>
            </ol>
          </div>

          {/* Use Cases */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <p className="font-semibold mb-2">💡 When to Use Bootstrap</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Constructing confidence intervals without assuming normality</li>
              <li>Estimating standard errors for complex statistics</li>
              <li>Model validation (bootstrap optimism correction)</li>
              <li>Variable selection stability assessment</li>
              <li>Small sample sizes where asymptotic theory may not apply</li>
            </ul>
          </div>

          {/* Limitations */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
            <p className="font-semibold mb-2">⚠️ Limitations</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Assumes original sample is representative of population</li>
              <li>Can't correct for bias, only quantifies uncertainty</li>
              <li>Not reliable for very small samples (n &lt; 20)</li>
              <li>Computationally intensive for complex models</li>
              <li>Requires careful handling for dependent/clustered data</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
