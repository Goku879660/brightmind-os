import { NavLink, useLocation } from 'react-router-dom';
import { Sun, Target, ClipboardCheck, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Sun, label: 'Plan' },
  { path: '/focus', icon: Target, label: 'Focus' },
  { path: '/review', icon: ClipboardCheck, label: 'Review' },
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 border-r border-border bg-card flex flex-col items-center py-6 gap-1 z-50">
      <div className="mb-6 flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
        <span className="text-primary-foreground font-bold text-sm">F</span>
      </div>
      {navItems.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path;
        return (
          <NavLink
            key={path}
            to={path}
            className={cn(
              'flex flex-col items-center gap-1 w-12 py-2 rounded-lg transition-colors duration-150',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        );
      })}
    </aside>
  );
}
