'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  Settings,
  LogOut,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Landlords', icon: Users, href: '/admin/landlords' },
  { label: 'Agents', icon: Users, href: '/admin/agents' },
  { label: 'Properties', icon: Building2, href: '/admin/properties' },
  { label: 'Tenants', icon: Users, href: '/admin/tenants' },
  { label: 'Payments', icon: DollarSign, href: '/admin/payments' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('user');
    globalThis.location.href = '/auth/login';
  };

  return (
    <div className="w-64 bg-card border-r border-border text-card-foreground flex flex-col h-screen">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <Home className="text-primary" size={24} />
          <h1 className="text-xl font-bold">Real Estate KE</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

