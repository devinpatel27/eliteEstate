'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Target,
  Building2,
  Radio,
  MapPin,
  ChevronDown,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';
import { prefetchRouteData } from '@/lib/route-prefetch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  anyPermission?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SettingsAccordion {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        permission: PERMISSIONS.DASHBOARD_READ,
      },
    ],
  },
  {
    title: 'Sales',
    items: [
      {
        label: 'Leads',
        href: '/leads',
        icon: Target,
        anyPermission: [PERMISSIONS.LEAD_READ, PERMISSIONS.LEAD_READ_ASSIGNED],
      },
      {
        label: 'Properties',
        href: '/properties',
        icon: Building2,
        permission: PERMISSIONS.PROPERTY_READ,
      },
      {
        label: 'Our Visits',
        href: '/visits',
        icon: MapPin,
        anyPermission: [PERMISSIONS.VISIT_READ, PERMISSIONS.VISIT_READ_ASSIGNED],
      },
    ],
  },
  {
    title: 'Reports & Analytics',
    items: [
      {
        label: 'Overview Analytics',
        href: '/reports/overview',
        icon: BarChart3,
        permission: PERMISSIONS.REPORT_READ,
      },
      {
        label: 'Lead Reports',
        href: '/reports/leads',
        icon: Target,
        permission: PERMISSIONS.REPORT_READ,
      },
      {
        label: 'Employee Performance',
        href: '/reports/employees',
        icon: Users,
        permission: PERMISSIONS.REPORT_READ,
      },
      {
        label: 'Property Reports',
        href: '/reports/properties',
        icon: Building2,
        permission: PERMISSIONS.REPORT_READ,
      },
      {
        label: 'Visit Reports',
        href: '/reports/visits',
        icon: MapPin,
        permission: PERMISSIONS.REPORT_READ,
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        label: 'Employees',
        href: '/employees',
        icon: Users,
        permission: PERMISSIONS.EMPLOYEE_READ,
      },
      {
        label: 'Roles & Permissions',
        href: '/roles',
        icon: ShieldCheck,
        permission: PERMISSIONS.ROLE_READ,
      },
    ],
  },
];

const settingsAccordions: SettingsAccordion[] = [
  {
    id: 'property-settings',
    label: 'Property Settings',
    icon: Building2,
    items: [
      {
        label: 'Property Types',
        href: '/settings/property-types',
        icon: Building2,
        permission: PERMISSIONS.LEAD_MASTER_MANAGE,
      },
      {
        label: 'Property Amenities',
        href: '/settings/property-amenities',
        icon: Building2,
        permission: PERMISSIONS.PROPERTY_MASTER_MANAGE,
      },
    ],
  },
  {
    id: 'lead-settings',
    label: 'Lead Settings',
    icon: Radio,
    items: [
      {
        label: 'Lead Assignment',
        href: '/settings/lead-assignment',
        icon: Radio,
        permission: PERMISSIONS.SETTINGS_MANAGE,
      },
      {
        label: 'Lead Sources',
        href: '/settings/lead-sources',
        icon: Radio,
        permission: PERMISSIONS.LEAD_MASTER_MANAGE,
      },
      {
        label: 'Follow-up Activities',
        href: '/settings/follow-up-activities',
        icon: Radio,
        permission: PERMISSIONS.LEAD_MASTER_MANAGE,
      },
    ],
  },
];

interface SidebarNavProps {
  collapsed?: boolean;
  onNavClick?: () => void;
}

function NavLink({
  item,
  active,
  collapsed,
  onNavClick,
  onPrefetch,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onNavClick?: () => void;
  onPrefetch?: (href: string) => void;
}) {
  const linkContent = (
    <Link
      href={item.href}
      prefetch
      onClick={onNavClick}
      onMouseEnter={() => onPrefetch?.(item.href)}
      onFocus={() => onPrefetch?.(item.href)}
      className={cn(
        'crm-sidebar-nav-item relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
        active ? 'crm-sidebar-nav-active' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground',
        collapsed && 'justify-center px-2.5'
      )}
    >
      <item.icon
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-transform duration-200',
          active && 'scale-110',
          !active && 'opacity-70'
        )}
      />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {active && !collapsed && (
        <span className="h-1.5 w-1.5 rounded-full bg-white/80 shadow-sm" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

export function SidebarNav({ collapsed, onNavClick }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission, isReady } = usePermissions();
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const prefetched = useRef(new Set<string>());

  const prefetchRoute = useCallback(
    (href: string) => {
      if (prefetched.current.has(href)) return;
      prefetched.current.add(href);
      router.prefetch(href);
      prefetchRouteData(queryClient, href);
    },
    [router, queryClient]
  );

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const filterVisible = (items: NavItem[]) =>
    items.filter((item) => {
      if (!isReady) return false;
      if (item.anyPermission) {
        return item.anyPermission.some((p) => hasPermission(p));
      }
      return !item.permission || hasPermission(item.permission);
    });

  useEffect(() => {
    settingsAccordions.forEach((accordion) => {
      const hasActiveChild = accordion.items.some((item) => isActive(item.href));
      if (hasActiveChild) {
        setOpenAccordions((prev) => ({ ...prev, [accordion.id]: true }));
      }
    });
  }, [pathname]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const visibleSettings = settingsAccordions
    .map((accordion) => ({ ...accordion, items: filterVisible(accordion.items) }))
    .filter((accordion) => accordion.items.length > 0);

  return (
    <TooltipProvider delayDuration={50}>
      <nav className="flex-1 overflow-y-auto px-3 py-3">
      {navGroups.map((group) => {
        const visibleItems = filterVisible(group.items);
        if (visibleItems.length === 0) return null;

        return (
          <div key={group.title} className="mb-5">
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/35">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {visibleItems.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                    onNavClick={onNavClick}
                    onPrefetch={prefetchRoute}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {visibleSettings.length > 0 && (
        <div className="mb-5">
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/35">
              Settings
            </p>
          )}
          <div className="space-y-1">
            {visibleSettings.map((accordion) => {
              if (collapsed) {
                return accordion.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                    onNavClick={onNavClick}
                    onPrefetch={prefetchRoute}
                  />
                ));
              }

              const isOpen = openAccordions[accordion.id] ?? false;
              const childActive = accordion.items.some((item) => isActive(item.href));
              const AccordionIcon = accordion.icon;

              return (
                <div key={accordion.id}>
                  <button
                    type="button"
                    onClick={() => toggleAccordion(accordion.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      childActive
                        ? 'bg-sidebar-accent/50 text-sidebar-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground'
                    )}
                  >
                    <AccordionIcon className="h-[18px] w-[18px] shrink-0 opacity-80" />
                    <span className="flex-1 truncate text-left">{accordion.label}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 opacity-60 transition-transform duration-200',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      'grid transition-[grid-template-rows] duration-200 ease-out',
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    )}
                  >
                    <div className="overflow-hidden">
                      <ul className="space-y-0.5 py-1 pl-3">
                        {accordion.items.map((item) => (
                          <li key={item.href}>
                            <NavLink
                              item={item}
                              active={isActive(item.href)}
                              collapsed={collapsed}
                              onNavClick={onNavClick}
                              onPrefetch={prefetchRoute}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </nav>
    </TooltipProvider>
  );
}
