import { Search, FileText, Fingerprint } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
export const Header = () => {
  const location = useLocation();
  const navItems = [{
    path: '/',
    label: 'Enquête',
    icon: Search
  }, {
    path: '/leaderboard',
    label: 'Classement',
    icon: FileText
  }, {
    path: '/admin',
    label: 'Dossiers',
    icon: Fingerprint
  }];
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Search className="w-8 h-8 text-accent animate-flicker" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-typewriter text-lg text-accent tracking-wider">DOSSIER N°2025</span>
              <span className="text-xs text-muted-foreground -mt-1">
                Enquête de Noël
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({
            path,
            label,
            icon: Icon
          }) => <Link key={path} to={path} className={cn("flex items-center gap-2 px-4 py-2 rounded-sm font-typewriter text-sm uppercase tracking-wider transition-all duration-300", location.pathname === path ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-accent hover:bg-accent/10")}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>)}
          </nav>
        </div>
      </div>
    </header>;
};