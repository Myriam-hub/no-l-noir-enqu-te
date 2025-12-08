import { Search, Fingerprint } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
export const Header = () => {
  const location = useLocation();
  const navItems = [{
    path: '/',
    label: 'Jouer',
    icon: Search
  }, {
    path: '/admin',
    label: 'Admin',
    icon: Fingerprint
  }];
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <Search className="w-8 h-8 text-primary" />
            <div className="flex flex-col">
              <span className="font-semibold text-lg text-foreground">JEU ERANOVE ACADEMY</span>
              <span className="text-xs text-muted-foreground -mt-1">Les enquêtes impossibles EA</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map(({
            path,
            label,
            icon: Icon
          }) => <Link key={path} to={path} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300", location.pathname === path ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>)}
          </nav>
        </div>
      </div>
    </header>;
};