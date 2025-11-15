import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { modules } from '@/data/modules';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function Home() {
  const userProgress = useAppStore((state) => state.userProgress);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Welcome to QuantLab
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Advanced Methods for Clinician-Scientists
        </p>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Master the complete research data pipeline: from raw data through cleaning, imputation,
          modeling, diagnostics, and validation to manuscript-ready insights.
        </p>
      </section>

      {/* Key Features */}
      <section className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Evidence-Based</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All content is statistically accurate and grounded in established research methodology.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Interactive Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hands-on simulations and visualizations help you understand complex statistical concepts.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Target className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-lg">Reproducible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Learn best practices for reproducible research and transparent methodology.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Modules */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Learning Modules</h2>
          <Badge variant="secondary">
            {userProgress.completedModules.length} / {modules.length} Completed
          </Badge>
        </div>

        <div className="grid gap-6">
          {modules.map((module) => {
            const isCompleted = userProgress.completedModules.includes(module.id);
            const hasPrerequisites = module.prerequisites.length > 0;
            const prerequisitesMet = module.prerequisites.every((prereq) =>
              userProgress.completedModules.includes(prereq)
            );

            return (
              <Card
                key={module.id}
                className={cn(
                  'transition-all hover:shadow-md',
                  isCompleted && 'border-green-500/50'
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{module.title}</CardTitle>
                        <Badge
                          variant="outline"
                          className={cn(difficultyColors[module.difficulty])}
                        >
                          {module.difficulty}
                        </Badge>
                        {isCompleted && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                            Completed ✓
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                    <Link to={module.route}>
                      <Button>
                        Start
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>📚 {module.estimatedTime}</span>
                    {hasPrerequisites && (
                      <span
                        className={cn(
                          prerequisitesMet
                            ? 'text-green-500'
                            : 'text-yellow-500'
                        )}
                      >
                        {prerequisitesMet ? '✓' : '⚠'} Prerequisites{' '}
                        {prerequisitesMet ? 'met' : 'required'}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Learning Objectives:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      {module.learningObjectives.slice(0, 3).map((objective, idx) => (
                        <li key={idx} className="list-disc">
                          {objective}
                        </li>
                      ))}
                      {module.learningObjectives.length > 3 && (
                        <li className="list-disc italic">
                          +{module.learningObjectives.length - 3} more...
                        </li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Getting Started */}
      <section className="bg-muted/50 rounded-lg p-8 space-y-4">
        <h2 className="text-2xl font-bold">Getting Started</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold">Recommended Learning Path</h3>
            <p className="text-sm text-muted-foreground">
              Start with "Raw Data Foundations" and progress through each module sequentially.
              Each module builds on concepts from previous modules.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Interactive Content</h3>
            <p className="text-sm text-muted-foreground">
              Each module includes interactive simulations, visualizations, and hands-on exercises
              using synthetic datasets.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Assessments</h3>
            <p className="text-sm text-muted-foreground">
              Test your understanding with scenario-based questions that mirror real-world research
              challenges.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Offline Access</h3>
            <p className="text-sm text-muted-foreground">
              QuantLab works offline, allowing you to learn anywhere without an internet connection.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
