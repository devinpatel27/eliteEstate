'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const crumbLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  create: 'Create',
  edit: 'Edit',
  roles: 'Roles & Permissions',
  leads: 'Leads',
  settings: 'Settings',
  'property-types': 'Property Types',
  'lead-sources': 'Lead Sources',
  'follow-up-activities': 'Follow-up Activities',
  profile: 'My Profile',
  'change-password': 'Change Password',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    const isId = /^[a-f\d]{24}$/i.test(segment);
    const label = isId ? 'Details' : (crumbLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1));

    return { href, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link
        href="/dashboard"
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <div key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className={cn(
                'text-muted-foreground hover:text-foreground transition-colors',
              )}
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
