import { Link, useLocation } from 'react-router-dom';
import {
  Database,
  Sparkles,
  AlertCircle,
  LineChart,
  Network,
  CheckCircle,
  Workflow,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const navigationItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Raw Data Foundations', path: '/raw-data', icon: Database, difficulty: 'beginner' },
  { name: 'Cleaning & Preprocessing', path: '/cleaning', icon: Sparkles, difficulty: 'beginner' },
  { name: 'Missing Data & Imputation', path: '/missing-data', icon: AlertCircle, difficulty: 'intermediate' },
  { name: 'Regression Diagnostics', path: '/diagnostics', icon: LineChart, difficulty: 'intermediate' },
  { name: 'Multicollinearity Analysis', path: '/multicollinearity', icon: Network, difficulty: 'intermediate' },
  { name: 'Validation & Reproducibility', path: '/validation', icon: CheckCircle, difficulty: 'advanced' },
  { name: 'Pipeline Sandbox', path: '/pipeline', icon: Workflow, difficulty: 'advanced' },
];

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, userProgress } = useAppStore();

  const completionPercentage = Math.round(
    (userProgress.completedModules.length / 7) * 100
  );

  if (!sidebarOpen) return null;

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 border-r bg-card overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your Progress</span>
            <span className="font-medium">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} />
          <p className="text-xs text-muted-foreground">
            {userProgress.completedModules.length} of 7 modules completed
          </p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isCompleted = item.path !== '/' &&
              userProgress.completedModules.some(id => item.path.includes(id));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground',
                  isCompleted && !isActive && 'text-green-500'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.name}</span>
                {item.difficulty && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] px-1.5 py-0',
                      difficultyColors[item.difficulty]
                    )}
                  >
                    {item.difficulty[0].toUpperCase()}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Info Section */}
        <div className="pt-4 border-t space-y-2">
          <p className="text-xs text-muted-foreground">
            <strong>QuantLab</strong> — Advanced methods for clinician-scientists
          </p>
          <p className="text-xs text-muted-foreground">
            Learn the complete research data pipeline with interactive, evidence-based content.
          </p>
        </div>
      </div>
    </aside>
  );
}
