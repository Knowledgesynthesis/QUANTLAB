import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DATASETS } from '@/data/syntheticData';
import { correlationMatrix, calculateVIF } from '@/lib/statistics';

export function MulticollinearityVisualizer() {
  const dataset = DATASETS.clean;

  // Select numeric predictors (exclude outcome variable readmitted)
  const variables = ['age', 'bmi', 'systolic_bp', 'creatinine', 'egfr'] as const;
  const variableNames = variables.map(v => v.replace('_', ' '));

  // Extract data
  const data = useMemo(() => {
    return variables.map(variable =>
      dataset.map(p => p[variable]).filter((v): v is number => v !== null)
    );
  }, []);

  // Calculate correlation matrix
  const corrMatrix = useMemo(() => correlationMatrix(data), [data]);

  // Calculate VIF
  const vifValues = useMemo(() => calculateVIF(data), [data]);

  // VIF interpretation
  const getVIFStatus = (vif: number) => {
    if (vif < 5) return { label: 'OK', color: 'bg-green-500/10 text-green-500 border-green-500/20' };
    if (vif < 10) return { label: 'Moderate', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
    return { label: 'Severe', color: 'bg-red-500/10 text-red-500 border-red-500/20' };
  };

  // Get color for correlation value
  const getCorrelationColor = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue < 0.3) return 'rgba(59, 130, 246, 0.1)'; // Low correlation - blue
    if (absValue < 0.7) return 'rgba(245, 158, 11, 0.3)'; // Medium - orange
    return 'rgba(239, 68, 68, 0.5)'; // High - red
  };

  const problemCount = vifValues.filter(v => v >= 10).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Multicollinearity Visualizer</CardTitle>
          <CardDescription>
            Explore correlations and calculate VIF for your predictors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Variables</p>
              <p className="text-2xl font-bold">{variables.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Severe Issues (VIF &gt; 10)</p>
              <Badge className="text-base mt-1" variant={problemCount > 0 ? 'destructive' : 'secondary'}>
                {problemCount}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High Correlations (&gt; 0.7)</p>
              <Badge className="text-base mt-1" variant="secondary">
                {corrMatrix.flatMap((row, i) =>
                  row.slice(i + 1).filter(v => Math.abs(v) > 0.7)
                ).length}
              </Badge>
            </div>
          </div>

          {/* Correlation Heatmap */}
          <div className="space-y-2">
            <h3 className="font-semibold">Correlation Matrix</h3>
            <div className="overflow-x-auto">
              <table className="border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-xs font-semibold border"></th>
                    {variableNames.map((name, i) => (
                      <th key={i} className="p-2 text-xs font-semibold border text-center min-w-[80px]">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {corrMatrix.map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 text-xs font-semibold border bg-muted">
                        {variableNames[i]}
                      </td>
                      {row.map((value, j) => (
                        <td
                          key={j}
                          className="p-2 text-center border relative"
                          style={{
                            backgroundColor: getCorrelationColor(value)
                          }}
                        >
                          <span className="font-mono text-xs font-semibold">
                            {value.toFixed(2)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 border" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }} />
                <span>Low (&lt; 0.3)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 border" style={{ backgroundColor: 'rgba(245, 158, 11, 0.3)' }} />
                <span>Medium (0.3-0.7)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 border" style={{ backgroundColor: 'rgba(239, 68, 68, 0.5)' }} />
                <span>High (&gt; 0.7)</span>
              </div>
            </div>
          </div>

          {/* VIF Table */}
          <div className="space-y-2">
            <h3 className="font-semibold">Variance Inflation Factor (VIF)</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold">Variable</th>
                    <th className="text-right p-3 font-semibold">VIF</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  {variables.map((variable, i) => {
                    const vif = vifValues[i];
                    const status = getVIFStatus(vif);
                    return (
                      <tr key={variable} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                        <td className="p-3 font-mono text-sm">{variable}</td>
                        <td className="p-3 text-right font-mono font-bold">
                          {vif.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={status.color}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {vif < 5 && 'No multicollinearity concern'}
                          {vif >= 5 && vif < 10 && 'Moderate collinearity - monitor'}
                          {vif >= 10 && 'Severe collinearity - action needed'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explanation */}
          <div className="border-l-4 border-primary pl-4 space-y-2">
            <p className="font-semibold">Understanding VIF</p>
            <p className="text-sm text-muted-foreground">
              VIF measures how much the variance of a coefficient is inflated due to correlation with other predictors.
            </p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>VIF = 1:</strong> No correlation with other predictors</p>
              <p><strong>VIF 1-5:</strong> Moderate correlation (usually acceptable)</p>
              <p><strong>VIF 5-10:</strong> High correlation (concerning, monitor closely)</p>
              <p><strong>VIF &gt; 10:</strong> Severe multicollinearity (action required)</p>
            </div>
          </div>

          {/* Key Finding */}
          {problemCount > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
              <p className="font-semibold mb-2 text-red-500">⚠️ Multicollinearity Detected</p>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Creatinine and eGFR</strong> have VIF &gt; 10. This is expected because eGFR is
                calculated from creatinine—they're mathematically related.
              </p>
              <p className="text-sm font-semibold">Recommended Action:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside ml-2 space-y-1">
                <li>Include only ONE of: creatinine OR eGFR (not both)</li>
                <li>Choose based on clinical relevance and interpretability</li>
                <li>eGFR preferred for clinical interpretation (kidney function stage)</li>
                <li>Creatinine preferred if it's directly measured (less derived)</li>
              </ul>
            </div>
          )}

          {problemCount === 0 && (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
              <p className="font-semibold mb-2 text-green-500">✅ No Severe Multicollinearity</p>
              <p className="text-sm text-muted-foreground">
                All VIF values are below 10, indicating acceptable levels of correlation among
                predictors. You can proceed with your regression analysis.
              </p>
            </div>
          )}

          {/* Educational Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <p className="font-semibold mb-2">💡 Key Insights</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Multicollinearity inflates standard errors but doesn't bias coefficients</li>
              <li>It makes it hard to isolate individual predictor effects</li>
              <li>Doesn't affect overall model fit (R²) or predictions</li>
              <li>If goal is prediction (not interpretation), moderate VIF may be acceptable</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
