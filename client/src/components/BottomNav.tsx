import { useLocation, Link } from 'wouter';
import { Home, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const navItems = [
  { href: '/', icon: Home, key: 'home' },
  { href: '/book', icon: Calendar, key: 'book' },
  { href: '/profile', icon: User, key: 'profile' },
] as const;

export default function BottomNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="shrink-0 bg-background/95 backdrop-blur-md border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.href ||
            (item.href !== '/' && location.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              data-testid={`nav-${item.key}`}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="text-xs font-medium">{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
