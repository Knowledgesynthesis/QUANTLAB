import { Menu, Moon, Sun, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import { Link } from 'react-router-dom';

export function Header() {
  const { darkMode, toggleDarkMode, toggleSidebar } = useAppStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">QuantLab</span>
        </Link>

        <div className="flex-1" />

        <nav className="flex items-center gap-2">
          <Link to="/glossary">
            <Button variant="ghost" size="sm">
              Glossary
            </Button>
          </Link>
          <Link to="/assessment">
            <Button variant="ghost" size="sm">
              Assessment
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </nav>
      </div>
    </header>
  );
}
