import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DATASETS } from '@/data/syntheticData';

export function MissingnessMapExplorer() {
  const [selectedDataset, setSelectedDataset] = useState<'clean' | 'withMCAR' | 'withMAR' | 'withMNAR'>('withMCAR');

  const dataset = DATASETS[selectedDataset];

  // Calculate missingness statistics
  const variables = ['age', 'bmi', 'systolic_bp', 'creatinine', 'egfr', 'hemoglobin'] as const;

  const stats = variables.map(variable => {
    const missing = dataset.filter(row => row[variable] === null).length;
    const percentage = (missing / dataset.length) * 100;
    return { variable, missing, percentage };
  });

  // Pattern detection
  const totalMissing = dataset.filter(row =>
    variables.some(v => row[v] === null)
  ).length;

  const mechanism = selectedDataset === 'withMCAR' ? 'MCAR'
    : selectedDataset === 'withMAR' ? 'MAR'
      : selectedDataset === 'withMNAR' ? 'MNAR'
        : 'None';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Missingness Map Explorer</CardTitle>
          <CardDescription>
            Visualize and classify missing data patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dataset Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Dataset</label>
            <Select value={selectedDataset} onValueChange={(v: any) => setSelectedDataset(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clean">Clean Dataset (No Missing)</SelectItem>
                <SelectItem value="withMCAR">Dataset with MCAR Missingness</SelectItem>
                <SelectItem value="withMAR">Dataset with MAR Missingness</SelectItem>
                <SelectItem value="withMNAR">Dataset with MNAR Missingness</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Missingness Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Patients</p>
              <p className="text-2xl font-bold">{dataset.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patients with Missing Data</p>
              <p className="text-2xl font-bold">{totalMissing}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Detected Mechanism</p>
              <Badge className="text-base mt-1">
                {mechanism}
              </Badge>
            </div>
          </div>

          {/* Missingness Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-semibold">Variable</th>
                  <th className="text-right p-3 font-semibold">Missing</th>
                  <th className="text-right p-3 font-semibold">Percentage</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, idx) => (
                  <tr key={stat.variable} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                    <td className="p-3 font-mono text-sm">{stat.variable}</td>
                    <td className="p-3 text-right">{stat.missing}</td>
                    <td className="p-3 text-right">{stat.percentage.toFixed(1)}%</td>
                    <td className="p-3">
                      {stat.percentage === 0 ? (
                        <Badge variant="secondary">Complete</Badge>
                      ) : stat.percentage < 5 ? (
                        <Badge className="bg-green-500/10 text-green-500">Minimal</Badge>
                      ) : stat.percentage < 20 ? (
                        <Badge className="bg-yellow-500/10 text-yellow-500">Moderate</Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-500">Substantial</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visual Heatmap */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Missingness Pattern (First 50 patients)</p>
            <div className="overflow-x-auto">
              <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${variables.length}, 24px)` }}>
                {dataset.slice(0, 50).map((patient, rowIdx) => (
                  <div key={rowIdx} className="contents">
                    {variables.map((variable) => (
                      <div
                        key={`${rowIdx}-${variable}`}
                        className={`h-6 ${patient[variable] === null
                          ? 'bg-red-500'
                          : 'bg-green-500/30'
                          }`}
                        title={`Patient ${patient.id}: ${variable} ${patient[variable] === null ? 'MISSING' : 'present'}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500/30 border" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 border" />
                <span>Missing</span>
              </div>
            </div>
          </div>

          {/* Mechanism Explanation */}
          <div className="border-l-4 border-primary pl-4 space-y-2">
            <p className="font-semibold">About {mechanism} Missingness</p>
            {mechanism === 'MCAR' && (
              <p className="text-sm text-muted-foreground">
                <strong>Missing Completely At Random:</strong> The probability of missingness is
                unrelated to any observed or unobserved data. Missingness is truly random.
                Complete case analysis is unbiased under MCAR.
              </p>
            )}
            {mechanism === 'MAR' && (
              <p className="text-sm text-muted-foreground">
                <strong>Missing At Random:</strong> The probability of missingness depends on
                observed data (e.g., older patients have more missing BMI), but not on the
                missing values themselves. Multiple imputation handles MAR well.
              </p>
            )}
            {mechanism === 'MNAR' && (
              <p className="text-sm text-muted-foreground">
                <strong>Missing Not At Random:</strong> The probability of missingness depends
                on the unobserved missing values themselves (e.g., higher BMI more likely to be missing).
                This is the most problematic type requiring sensitivity analyses.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
