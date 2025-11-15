import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { kFoldSplit } from '@/lib/statistics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function CrossValidationSimulator() {
  const [kFolds, setKFolds] = useState([5]);
  const [dataSize, setDataSize] = useState([100]);
  const [simulationKey, setSimulationKey] = useState(0);

  const k = kFolds[0];
  const n = dataSize[0];

  // Generate k-fold splits
  const folds = useMemo(() => kFoldSplit(n, k), [n, k, simulationKey]);

  // Simulate performance metrics for each fold
  const foldResults = useMemo(() => {
    return folds.map((fold, i) => {
      const trainSize = n - fold.length;
      const testSize = fold.length;

      // Simulate realistic metrics with some variance
      const baseAccuracy = 0.75;
      const variance = 0.05;
      const accuracy = baseAccuracy + (Math.random() - 0.5) * variance;

      return {
        fold: i + 1,
        trainSize,
        testSize,
        accuracy: accuracy * 100,
        rmse: 2.5 + (Math.random() - 0.5) * 0.8
      };
    });
  }, [folds, n, k]);

  const avgAccuracy = foldResults.reduce((sum, r) => sum + r.accuracy, 0) / k;
  const stdAccuracy = Math.sqrt(
    foldResults.reduce((sum, r) => sum + Math.pow(r.accuracy - avgAccuracy, 2), 0) / k
  );

  const avgRMSE = foldResults.reduce((sum, r) => sum + r.rmse, 0) / k;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cross-Validation Simulator</CardTitle>
          <CardDescription>
            Visualize how k-fold cross-validation splits data and estimates performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Number of Folds (k): {k}</Label>
              <Slider
                value={kFolds}
                onValueChange={setKFolds}
                min={2}
                max={10}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Common choices: k=5 (faster) or k=10 (more stable)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Dataset Size (n): {n}</Label>
              <Slider
                value={dataSize}
                onValueChange={setDataSize}
                min={50}
                max={500}
                step={50}
                className="w-full"
              />
              <Button
                onClick={() => setSimulationKey(prev => prev + 1)}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Reshuffle
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Folds</p>
              <p className="text-2xl font-bold">{k}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Train Size (avg)</p>
              <p className="text-2xl font-bold">{Math.round(n * (k - 1) / k)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Test Size (each)</p>
              <p className="text-2xl font-bold">{Math.round(n / k)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Iterations</p>
              <Badge className="text-base mt-1">{k}</Badge>
            </div>
          </div>

          {/* Visual Representation of Folds */}
          <div className="space-y-2">
            <h3 className="font-semibold">Fold Splits Visualization</h3>
            <p className="text-sm text-muted-foreground">
              Each row shows one fold's train/test split. Test fold rotates each iteration.
            </p>
            <div className="space-y-2">
              {folds.map((_, foldIdx) => (
                <div key={foldIdx} className="space-y-1">
                  <div className="text-xs font-medium">Fold {foldIdx + 1}</div>
                  <div className="flex h-8 border rounded overflow-hidden">
                    {Array.from({ length: k }).map((_, partIdx) => (
                      <div
                        key={partIdx}
                        className={`flex-1 flex items-center justify-center text-xs font-semibold ${
                          partIdx === foldIdx
                            ? 'bg-red-500 text-white'
                            : 'bg-green-500/30'
                        }`}
                      >
                        {partIdx === foldIdx ? 'Test' : 'Train'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500/30 border" />
                <span>Training Set</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 border" />
                <span>Test Set</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-4">
            <h3 className="font-semibold">Simulated Performance by Fold</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={foldResults}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fold" label={{ value: 'Fold Number', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} domain={[60, 90]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="accuracy" fill="#3b82f6" name="Accuracy (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Results */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-3">Cross-Validation Results</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Mean Accuracy</p>
                <p className="text-2xl font-bold">{avgAccuracy.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ± {stdAccuracy.toFixed(2)}% (std dev)
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mean RMSE</p>
                <p className="text-2xl font-bold">{avgRMSE.toFixed(3)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Simulated values for demonstration
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Fold Results */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-semibold">Fold</th>
                  <th className="text-right p-3 font-semibold">Train Size</th>
                  <th className="text-right p-3 font-semibold">Test Size</th>
                  <th className="text-right p-3 font-semibold">Accuracy</th>
                  <th className="text-right p-3 font-semibold">RMSE</th>
                </tr>
              </thead>
              <tbody>
                {foldResults.map((result, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                    <td className="p-3">{result.fold}</td>
                    <td className="p-3 text-right">{result.trainSize}</td>
                    <td className="p-3 text-right">{result.testSize}</td>
                    <td className="p-3 text-right font-mono">{result.accuracy.toFixed(2)}%</td>
                    <td className="p-3 text-right font-mono">{result.rmse.toFixed(3)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 font-semibold bg-muted">
                  <td className="p-3" colSpan={3}>Average</td>
                  <td className="p-3 text-right font-mono">{avgAccuracy.toFixed(2)}%</td>
                  <td className="p-3 text-right font-mono">{avgRMSE.toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Educational Content */}
          <div className="border-l-4 border-primary pl-4 space-y-2">
            <p className="font-semibold">Why Cross-Validation?</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                <strong>More reliable than single train/test split:</strong> Every observation
                is used for both training and testing
              </li>
              <li>
                <strong>Reduces variance:</strong> Average over {k} folds gives more stable
                performance estimate
              </li>
              <li>
                <strong>Detects overfitting:</strong> Large gap between train and CV performance
                indicates overfitting
              </li>
              <li>
                <strong>Bias-variance tradeoff:</strong> Larger k = less bias, more variance;
                k=5 or k=10 usually optimal
              </li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <p className="font-semibold mb-2">💡 Best Practices</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Always set random seed for reproducibility</li>
              <li>Use stratified k-fold for imbalanced outcomes</li>
              <li>For time series, use time-based splits (not random)</li>
              <li>Report both mean and standard deviation of CV metrics</li>
              <li>Don't tune hyperparameters on test set - use nested CV</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
