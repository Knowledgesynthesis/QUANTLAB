import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DATASETS } from '@/data/syntheticData';
import { linearRegression, leverage, cooksDistance, qqPlotData, standardize } from '@/lib/statistics';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine, Line } from 'recharts';

export function DiagnosticDashboard() {
  // Use clean dataset for regression
  const dataset = DATASETS.clean;

  // Regression: Predict LOS from age
  const x = dataset.map(p => p.age).filter((v): v is number => v !== null);
  const y = dataset.map(p => p.los_days).filter((v): v is number => v !== null);

  const regression = useMemo(() => linearRegression(x, y), []);
  const lev = useMemo(() => leverage(x), []);
  const mse = useMemo(() => {
    const sumSq = regression.residuals.reduce((sum, r) => sum + r * r, 0);
    return sumSq / (regression.residuals.length - 2);
  }, [regression]);

  const cooks = useMemo(() => cooksDistance(regression.residuals, lev, mse, 2), [regression, lev, mse]);
  const stdResiduals = useMemo(() => standardize(regression.residuals), [regression]);
  const qqData = useMemo(() => qqPlotData(stdResiduals), [stdResiduals]);

  // Prepare chart data
  const residualVsFitted = regression.fitted.map((fit, i) => ({
    fitted: fit,
    residual: regression.residuals[i],
    id: i + 1
  }));

  const leverageVsResidual = lev.map((l, i) => ({
    leverage: l,
    stdResidual: stdResiduals[i],
    cooks: cooks[i],
    id: i + 1
  }));

  const qqPlot = qqData.theoretical.map((theoretical, i) => ({
    theoretical,
    sample: qqData.sample[i]
  }));

  const scaleLocation = regression.fitted.map((fit, i) => ({
    fitted: fit,
    sqrtStdResidual: Math.sqrt(Math.abs(stdResiduals[i])),
    id: i + 1
  }));

  // Identify influential points
  const cooksCutoff = 4 / regression.residuals.length;
  const influentialPoints = cooks.filter(c => c > cooksCutoff).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Regression Diagnostics Dashboard</CardTitle>
          <CardDescription>
            Interactive diagnostic plots for regression assumptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Summary */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">R²</p>
              <p className="text-2xl font-bold">{regression.r2.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slope</p>
              <p className="text-2xl font-bold">{regression.slope.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">MSE</p>
              <p className="text-2xl font-bold">{mse.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Influential Points</p>
              <Badge className="text-base mt-1" variant={influentialPoints > 0 ? 'destructive' : 'secondary'}>
                {influentialPoints}
              </Badge>
            </div>
          </div>

          {/* Diagnostic Plots */}
          <Tabs defaultValue="residuals" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="residuals">Residuals vs Fitted</TabsTrigger>
              <TabsTrigger value="qq">Q-Q Plot</TabsTrigger>
              <TabsTrigger value="scale">Scale-Location</TabsTrigger>
              <TabsTrigger value="leverage">Leverage</TabsTrigger>
            </TabsList>

            <TabsContent value="residuals" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="fitted"
                      label={{ value: 'Fitted Values', position: 'insideBottom', offset: -5 }}
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    />
                    <YAxis
                      dataKey="residual"
                      label={{ value: 'Residuals', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                    <Scatter data={residualVsFitted} fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="font-semibold mb-2">Interpretation</p>
                <p className="text-sm text-muted-foreground">
                  <strong>What to look for:</strong> Random scatter around the horizontal line at 0.
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li><strong>Curved pattern:</strong> Non-linear relationship (try transformation or polynomial terms)</li>
                  <li><strong>Funnel shape:</strong> Heteroscedasticity (non-constant variance)</li>
                  <li><strong>Outliers:</strong> Points far from 0 need investigation</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="qq" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="theoretical"
                      label={{ value: 'Theoretical Quantiles', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      dataKey="sample"
                      label={{ value: 'Sample Quantiles', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Scatter data={qqPlot} fill="#10b981" />
                    {/* Reference line for perfect normality */}
                    <Line
                      data={qqPlot.map(d => ({ theoretical: d.theoretical, perfect: d.theoretical }))}
                      dataKey="perfect"
                      stroke="#666"
                      strokeDasharray="3 3"
                      dot={false}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="font-semibold mb-2">Interpretation</p>
                <p className="text-sm text-muted-foreground">
                  <strong>What to look for:</strong> Points should fall along the diagonal line.
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li><strong>S-shaped curve:</strong> Heavy tails (more extreme values than normal)</li>
                  <li><strong>Deviations at ends:</strong> Skewness or outliers</li>
                  <li><strong>Good fit:</strong> Points close to line indicate normal residuals</li>
                  <li className="text-muted-foreground/70 italic">Note: Minor deviations OK with large samples (CLT)</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="scale" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="fitted"
                      label={{ value: 'Fitted Values', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      dataKey="sqrtStdResidual"
                      label={{ value: '√|Standardized Residuals|', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Scatter data={scaleLocation} fill="#f59e0b" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p className="font-semibold mb-2">Interpretation</p>
                <p className="text-sm text-muted-foreground">
                  <strong>What to look for:</strong> Horizontal line with random scatter (homoscedasticity).
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li><strong>Upward/downward trend:</strong> Variance increases/decreases with fitted values</li>
                  <li><strong>Solutions:</strong> Robust standard errors, transformation (log/sqrt), weighted least squares</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="leverage" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="leverage"
                      label={{ value: 'Leverage', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis
                      dataKey="stdResidual"
                      label={{ value: 'Standardized Residuals', angle: -90, position: 'insideLeft' }}
                    />
                    <ZAxis dataKey="cooks" range={[50, 400]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded p-2 shadow">
                              <p className="text-sm">Patient #{data.id}</p>
                              <p className="text-sm">Leverage: {data.leverage.toFixed(3)}</p>
                              <p className="text-sm">Std Residual: {data.stdResidual.toFixed(2)}</p>
                              <p className="text-sm">Cook's D: {data.cooks.toFixed(3)}</p>
                              {data.cooks > cooksCutoff && (
                                <Badge variant="destructive" className="text-xs mt-1">Influential</Badge>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter
                      data={leverageVsResidual}
                      fill="#ef4444"
                      fillOpacity={0.6}
                    />
                    {/* Cook's distance contour lines */}
                    <ReferenceLine y={2} stroke="#666" strokeDasharray="3 3" />
                    <ReferenceLine y={-2} stroke="#666" strokeDasharray="3 3" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="border-l-4 border-primary pl-4 space-y-2">
                <p className="font-semibold">Interpretation</p>
                <p className="text-sm text-muted-foreground">
                  <strong>Leverage:</strong> How unusual the X values are. High leverage = extreme predictor values.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Cook's Distance:</strong> Overall influence on regression (size of bubbles).
                  D &gt; {cooksCutoff.toFixed(3)} suggests influential point.
                </p>
                <p className="text-sm text-yellow-500">
                  ⚠️ <strong>Found {influentialPoints} influential points.</strong> Investigate these observations.
                  Don't automatically remove - they may be valid data.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Summary */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <p className="font-semibold mb-2">📊 Diagnostic Summary</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Model: LOS (days) ~ Age</li>
              <li>• R² = {regression.r2.toFixed(3)} ({(regression.r2 * 100).toFixed(1)}% variance explained)</li>
              <li>• {influentialPoints === 0
                ? '✅ No highly influential observations detected'
                : `⚠️ ${influentialPoints} influential observations (Cook's D > ${cooksCutoff.toFixed(3)})`
              }</li>
              <li>• Always examine all four diagnostic plots before finalizing your model</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
