'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  MessageSquare,
  Settings,
  Leaf,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  UserCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const candidateNav: NavItem[] = [
  { label: 'Dashboard', href: '/c/dashboard', icon: LayoutDashboard },
  { label: 'Groundworks', href: '/c/groundworks', icon: CalendarDays },
  { label: 'Assignments', href: '/c/assignments', icon: FileText },
  { label: 'Interviews', href: '/c/interviews', icon: MessageSquare },
  { label: 'Account', href: '/c/account', icon: UserCircle },
];

const adminNav: NavItem[] = [
  { label: 'Dashboard', href: '/a/dashboard', icon: LayoutDashboard },
  { label: 'Sessions', href: '/a/sessions', icon: CalendarDays },
  { label: 'Assignments', href: '/a/assignments', icon: FileText },
  { label: 'Interviews', href: '/a/interviews', icon: MessageSquare },
  { label: 'Candidates', href: '/a/candidates', icon: Users },
  { label: 'Settings', href: '/a/settings', icon: Settings },
  { label: 'Account', href: '/a/account', icon: UserCircle },
];

export function Sidebar({ role }: { role: 'candidate' | 'admin' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = role === 'candidate' ? candidateNav : adminNav;

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/60">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl gradient-emerald text-white shrink-0 shadow-sm">
          <Leaf className="w-4.5 h-4.5" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold tracking-tight">SusCell</p>
            <p className="text-[11px] text-muted-foreground capitalize leading-none mt-0.5">{role} Panel</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto hidden md:flex h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform duration-200', collapsed && 'rotate-180')} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
            Navigation
          </p>
        )}
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive && 'drop-shadow-sm')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/60 px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-150 w-full"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3.5 left-3.5 z-50 md:hidden h-9 w-9 rounded-xl bg-card shadow-card border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full bg-card/95 backdrop-blur-xl border-r border-border/60 transition-all duration-200',
          collapsed ? 'w-[68px]' : 'w-[240px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Spacer */}
      <div className={cn('hidden md:block shrink-0 transition-all duration-200', collapsed ? 'w-[68px]' : 'w-[240px]')} />
    </>
  );
}
