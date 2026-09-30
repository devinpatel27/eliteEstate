import Link from 'next/link';
import { UserPlus, Users, ShieldCheck, Key, Target, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';

interface Action {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  permission?: string;
  anyPermission?: string[];
}

const actions: Action[] = [
  {
    label: 'Add Employee',
    description: 'Create a new employee account',
    href: '/employees',
    icon: UserPlus,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400',
    permission: PERMISSIONS.EMPLOYEE_CREATE,
  },
  {
    label: 'Manage Employees',
    description: 'View and manage all employees',
    href: '/employees',
    icon: Users,
    color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400',
    permission: PERMISSIONS.EMPLOYEE_READ,
  },
  {
    label: 'Manage Roles',
    description: 'Configure roles and permissions',
    href: '/roles',
    icon: ShieldCheck,
    color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-400',
    permission: PERMISSIONS.ROLE_READ,
  },
  {
    label: 'Manage Leads',
    description: 'View and manage property leads',
    href: '/leads',
    icon: Target,
    color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/40 dark:text-cyan-400',
    anyPermission: [PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_READ_ASSIGNED],
  },
  {
    label: 'Change Password',
    description: 'Update your account password',
    href: '/change-password',
    icon: Key,
    color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400',
    permission: PERMISSIONS.EMPLOYEE_MANAGE,
  },
];

export function QuickActions() {
  const { hasPermission, isReady } = usePermissions();

  const visibleActions = actions.filter((a) => {
    if (!isReady) return false;
    if (a.anyPermission) return a.anyPermission.some((p) => hasPermission(p));
    return !a.permission || hasPermission(a.permission);
  });

  return (
    <Card className="crm-card overflow-hidden">
      <div className="p-5 border-b">
        <h3 className="font-semibold text-sm">Quick Actions</h3>
      </div>
      <div className="p-3 space-y-1">
        {visibleActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-all duration-200 group cursor-pointer hover:translate-x-0.5"
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', action.color)}>
              <action.icon className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium group-hover:text-primary transition-colors">
                {action.label}
              </p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
