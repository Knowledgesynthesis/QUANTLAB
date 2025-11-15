import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Search } from 'lucide-react';

interface GlossaryEntry {
  term: string;
  definition: string;
  category: string;
  relatedTerms?: string[];
}

const glossaryData: GlossaryEntry[] = [
  {
    term: 'MCAR (Missing Completely At Random)',
    definition: 'A missingness mechanism where the probability of missing data is unrelated to both observed and unobserved data. The missing data are a random subset of all data.',
    category: 'Missing Data',
    relatedTerms: ['MAR', 'MNAR']
  },
  {
    term: 'MAR (Missing At Random)',
    definition: 'A missingness mechanism where the probability of missing data depends only on observed data, not on the unobserved missing values themselves.',
    category: 'Missing Data',
    relatedTerms: ['MCAR', 'MNAR', 'Multiple Imputation']
  },
  {
    term: 'MNAR (Missing Not At Random)',
    definition: 'A missingness mechanism where the probability of missing data depends on the unobserved missing values themselves. The most problematic type of missingness.',
    category: 'Missing Data',
    relatedTerms: ['MCAR', 'MAR']
  },
  {
    term: 'VIF (Variance Inflation Factor)',
    definition: 'A measure of multicollinearity that quantifies how much the variance of a regression coefficient is inflated due to correlation with other predictors. VIF = 1/(1-R²).',
    category: 'Multicollinearity',
    relatedTerms: ['Multicollinearity', 'Condition Index']
  },
  {
    term: "Cook's Distance",
    definition: 'A measure of influence that combines leverage and residual size to identify observations that have outsized impact on regression coefficients. Values > 4/n suggest influential observations.',
    category: 'Regression Diagnostics',
    relatedTerms: ['Leverage', 'DFBETAS', 'Influential Observation']
  },
  {
    term: 'Leverage',
    definition: 'A measure of how far an observation\'s predictor values are from the mean of the predictors. High leverage observations have unusual X values.',
    category: 'Regression Diagnostics',
    relatedTerms: ["Cook's Distance", 'Hat Values']
  },
  {
    term: 'Heteroscedasticity',
    definition: 'Non-constant variance of residuals. Violates the homoscedasticity assumption of linear regression. Often appears as a funnel shape in residual plots.',
    category: 'Regression Diagnostics',
    relatedTerms: ['Homoscedasticity', 'Residuals', 'Robust Standard Errors']
  },
  {
    term: 'Cross-Validation',
    definition: 'A resampling method for assessing model performance by splitting data into training and validation sets, often multiple times (k-fold). Provides estimate of how model generalizes to new data.',
    category: 'Validation',
    relatedTerms: ['K-Fold Cross-Validation', 'Overfitting', 'Bootstrap']
  },
  {
    term: 'Bootstrap',
    definition: 'A resampling method that involves repeatedly sampling with replacement from observed data to create many bootstrap samples, used to estimate uncertainty and validate models.',
    category: 'Validation',
    relatedTerms: ['Cross-Validation', 'Confidence Interval', 'Optimism']
  },
  {
    term: 'Multiple Imputation',
    definition: 'An imputation method that creates multiple complete datasets with different plausible values for missing data, analyzes each separately, then pools results. Gold standard for handling missing data under MAR.',
    category: 'Missing Data',
    relatedTerms: ['MAR', 'Imputation', "Rubin's Rules"]
  },
  {
    term: 'Multicollinearity',
    definition: 'High correlation among predictor variables in regression. Inflates standard errors and makes coefficients unstable, but doesn\'t bias estimates or affect predictions.',
    category: 'Multicollinearity',
    relatedTerms: ['VIF', 'Condition Index', 'Correlation Matrix']
  },
  {
    term: 'Overfitting',
    definition: 'When a model is too complex and fits noise in the training data rather than true signal. Results in excellent training performance but poor test performance.',
    category: 'Validation',
    relatedTerms: ['Cross-Validation', 'Regularization', 'Bias-Variance Tradeoff']
  },
  {
    term: 'Winsorization',
    definition: 'A method of handling outliers by capping extreme values at a specified percentile (e.g., 95th). Reduces influence of outliers while preserving sample size.',
    category: 'Data Cleaning',
    relatedTerms: ['Outliers', 'Transformation']
  },
  {
    term: 'Log Transformation',
    definition: 'Applying logarithm to a variable, typically used for highly right-skewed data. Compresses range, reduces influence of outliers, can linearize exponential relationships.',
    category: 'Data Cleaning',
    relatedTerms: ['Transformation', 'Skewness', 'Normality']
  },
  {
    term: 'Reproducibility',
    definition: 'The ability of another researcher to obtain the same results using the same data and code. Essential for transparent, credible research.',
    category: 'Reproducibility',
    relatedTerms: ['Version Control', 'Random Seed', 'Replicability']
  }
];

export function Glossary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = Array.from(new Set(glossaryData.map(entry => entry.category)));

  const filteredEntries = glossaryData.filter(entry => {
    const matchesSearch = entry.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Glossary</h1>
        </div>
        <p className="text-muted-foreground">
          Quick reference for key statistical and methodological terms
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Glossary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search terms or definitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6 space-y-4">
              {filteredEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No terms found matching your search.
                </p>
              ) : (
                filteredEntries.map((entry, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-lg">{entry.term}</CardTitle>
                        <Badge variant="outline">{entry.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{entry.definition}</p>
                      {entry.relatedTerms && entry.relatedTerms.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Related Terms:</p>
                          <div className="flex flex-wrap gap-2">
                            {entry.relatedTerms.map((term, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {term}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistical Software Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 space-y-2">
              <p className="font-semibold">R Packages</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><code className="bg-muted px-1 rounded">car</code> - VIF, regression diagnostics</li>
                <li><code className="bg-muted px-1 rounded">mice</code> - Multiple imputation</li>
                <li><code className="bg-muted px-1 rounded">caret</code> - Cross-validation</li>
                <li><code className="bg-muted px-1 rounded">boot</code> - Bootstrapping</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4 space-y-2">
              <p className="font-semibold">Python Libraries</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><code className="bg-muted px-1 rounded">statsmodels</code> - VIF, diagnostics</li>
                <li><code className="bg-muted px-1 rounded">sklearn</code> - Cross-validation</li>
                <li><code className="bg-muted px-1 rounded">fancyimpute</code> - Imputation</li>
                <li><code className="bg-muted px-1 rounded">scipy</code> - Statistical tests</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
