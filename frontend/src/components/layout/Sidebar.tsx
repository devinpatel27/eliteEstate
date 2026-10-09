'use client';

import { Building2, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { SidebarNav } from './SidebarNav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getImageUrl, formatRoleName } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { CloseButton } from '@/components/common/CloseButton';

function SidebarContent({
  collapsed,
  onNavClick,
}: {
  collapsed: boolean;
  onNavClick?: () => void;
}) {
  const { toggleSidebar } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full crm-sidebar">
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-sidebar-border shrink-0',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 shrink-0" />
            </div>
            <div>
              <p className="text-sm font-bold text-sidebar-foreground leading-tight">
                Elite Estate
              </p>
              <p className="text-[10px] text-sidebar-foreground/50 leading-tight">CRM System</p>
            </div>
          </div>
        )}
        {onNavClick && (
          <CloseButton onClick={onNavClick} className="ml-auto shrink-0" />
        )}
        {collapsed && (
          <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Building2 className="h-5 w-5 shrink-0" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'hidden lg:flex w-6 h-6 rounded-md items-center justify-center text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
            collapsed && 'mt-0'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <SidebarNav collapsed={collapsed} onNavClick={onNavClick} />

      {/* User Profile Footer */}
      <div className="shrink-0 p-3 border-t border-sidebar-border">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex justify-center">
                <Avatar className="w-8 h-8 cursor-pointer">
                  <AvatarImage src={getImageUrl(user?.profileImage)} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {getInitials(user?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2.5 px-1">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={getImageUrl(user?.profileImage)} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {getInitials(user?.name || 'U')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-[11px] text-sidebar-foreground/50 truncate capitalize">
                {formatRoleName(user?.role)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 shrink-0"
              onClick={logout}
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, sidebarMobileOpen, setSidebarMobileOpen } = useUIStore();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="fixed top-0 left-0 h-screen z-20 transition-all duration-300 ease-in-out"
          style={{ width: sidebarCollapsed ? '4rem' : '16rem' }}
        >
          <SidebarContent collapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarMobileOpen} onOpenChange={setSidebarMobileOpen}>
        <SheetContent side="left" hideCloseButton className="p-0 w-64">
          <SidebarContent
            collapsed={false}
            onNavClick={() => setSidebarMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
