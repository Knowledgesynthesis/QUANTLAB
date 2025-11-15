import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DATASETS } from '@/data/syntheticData';
import { mean, median, std, imputeMean, imputeMedian } from '@/lib/statistics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type ImputationMethod = 'none' | 'mean' | 'median' | 'forward-fill';

export function ImputationPlayground() {
  const [selectedMethod, setSelectedMethod] = useState<ImputationMethod>('none');
  const [showComparison, setShowComparison] = useState(false);

  // Use dataset with MAR missingness for BMI
  const dataset = DATASETS.withMAR;

  const original = dataset.map(p => p.bmi).filter((v): v is number => v !== null);
  const originalWithNull = dataset.map(p => p.bmi);

  // Apply imputation
  const imputed = useMemo(() => {
    if (selectedMethod === 'none') return originalWithNull;
    if (selectedMethod === 'mean') return imputeMean(originalWithNull);
    if (selectedMethod === 'median') return imputeMedian(originalWithNull);

    // Forward fill (simple version)
    const result = [...originalWithNull];
    let lastValid = result.find(v => v !== null) || 25;
    for (let i = 0; i < result.length; i++) {
      if (result[i] === null) {
        result[i] = lastValid;
      } else {
        lastValid = result[i]!;
      }
    }
    return result;
  }, [selectedMethod]);

  const imputedNonNull = imputed.filter((v): v is number => v !== null);

  // Calculate statistics
  const stats = {
    original: {
      n: original.length,
      mean: mean(original),
      median: median(original),
      std: std(original),
      min: Math.min(...original),
      max: Math.max(...original)
    },
    imputed: {
      n: imputedNonNull.length,
      mean: mean(imputedNonNull),
      median: median(imputedNonNull),
      std: std(imputedNonNull),
      min: Math.min(...imputedNonNull),
      max: Math.max(...imputedNonNull)
    }
  };

  // Create histogram data
  const createHistogram = (data: number[], bins: number = 15) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;

    const histogram = Array(bins).fill(0).map((_, i) => ({
      bin: min + i * binWidth,
      count: 0,
      label: `${(min + i * binWidth).toFixed(1)}`
    }));

    data.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
      histogram[binIndex].count++;
    });

    return histogram;
  };

  const originalHist = createHistogram(original);
  const imputedHist = createHistogram(imputedNonNull);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Imputation Playground</CardTitle>
          <CardDescription>
            Compare different imputation methods and see their effect on data distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Method Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Imputation Method</label>
              <Select value={selectedMethod} onValueChange={(v: any) => setSelectedMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Keep Missing)</SelectItem>
                  <SelectItem value="mean">Mean Imputation</SelectItem>
                  <SelectItem value="median">Median Imputation</SelectItem>
                  <SelectItem value="forward-fill">Forward Fill</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => setShowComparison(!showComparison)}
                variant={showComparison ? 'default' : 'outline'}
                className="w-full"
              >
                {showComparison ? 'Hide' : 'Show'} Comparison
              </Button>
            </div>
          </div>

          {/* Missingness Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Original Complete</p>
              <p className="text-2xl font-bold">{stats.original.n}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Missing Values</p>
              <p className="text-2xl font-bold text-red-500">{dataset.length - stats.original.n}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">After Imputation</p>
              <p className="text-2xl font-bold text-green-500">{stats.imputed.n}</p>
            </div>
          </div>

          {/* Statistics Comparison */}
          {showComparison && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold">Statistic</th>
                    <th className="text-right p-3 font-semibold">Original (Complete)</th>
                    <th className="text-right p-3 font-semibold">After Imputation</th>
                    <th className="text-right p-3 font-semibold">Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">Mean</td>
                    <td className="p-3 text-right font-mono">{stats.original.mean.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">{stats.imputed.mean.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">
                      {(stats.imputed.mean - stats.original.mean).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Median</td>
                    <td className="p-3 text-right font-mono">{stats.original.median.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">{stats.imputed.median.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">
                      {(stats.imputed.median - stats.original.median).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Std Dev</td>
                    <td className="p-3 text-right font-mono">{stats.original.std.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">{stats.imputed.std.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">
                      {(stats.imputed.std - stats.original.std).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Min</td>
                    <td className="p-3 text-right font-mono">{stats.original.min.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">{stats.imputed.min.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">
                      {(stats.imputed.min - stats.original.min).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">Max</td>
                    <td className="p-3 text-right font-mono">{stats.original.max.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">{stats.imputed.max.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono">
                      {(stats.imputed.max - stats.original.max).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Distribution Comparison */}
          <div className="space-y-4">
            <h3 className="font-semibold">Distribution Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={originalHist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" label={{ value: 'BMI', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Original (Complete)" opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {selectedMethod !== 'none' && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={imputedHist}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" label={{ value: 'BMI', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#10b981" name="After Imputation" opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Method Explanation */}
          <div className="border-l-4 border-primary pl-4 space-y-2">
            <p className="font-semibold">About {selectedMethod === 'none' ? 'No Imputation' : selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1).replace('-', ' ')}</p>
            {selectedMethod === 'none' && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Complete Case Analysis:</strong> Only uses observations with no missing data.</p>
                <p className="text-red-500">⚠️ Reduces sample size and power. Biased unless MCAR.</p>
              </div>
            )}
            {selectedMethod === 'mean' && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Mean Imputation:</strong> Replace missing with the mean of observed values.</p>
                <p className="text-yellow-500">⚠️ Preserves mean but underestimates variance. Biases correlations toward zero.</p>
              </div>
            )}
            {selectedMethod === 'median' && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Median Imputation:</strong> Replace missing with the median of observed values.</p>
                <p className="text-yellow-500">⚠️ More robust to outliers than mean, but still underestimates variance.</p>
              </div>
            )}
            {selectedMethod === 'forward-fill' && (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Forward Fill:</strong> Carry forward the last observed value.</p>
                <p className="text-yellow-500">⚠️ Only appropriate for time series data. Creates artificial patterns.</p>
              </div>
            )}

            {selectedMethod !== 'none' && (
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded mt-2">
                <p className="text-sm font-medium mb-1">💡 Recommendation</p>
                <p className="text-sm text-muted-foreground">
                  For research, use <strong>multiple imputation</strong> instead of simple methods.
                  It properly accounts for uncertainty and provides valid standard errors.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
