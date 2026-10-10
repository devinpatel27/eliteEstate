'use client';

import { Menu, Moon, Sun, LogOut, User, Key } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getInitials, getImageUrl, formatRoleName } from '@/lib/utils';
import { useMounted } from '@/hooks/useMounted';
import { usePermissions } from '@/hooks/usePermissions';
import { Breadcrumb } from './Breadcrumb';

const SmartFilters = dynamic(
  () => import('./SmartFilters').then((m) => ({ default: m.SmartFilters })),
  { ssr: false }
);

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const { setSidebarMobileOpen } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const { isAdmin } = usePermissions();

  return (
    <header className="crm-header sticky top-0 z-10 flex h-16 items-center gap-4 px-4">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        <Breadcrumb />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <SmartFilters />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {mounted ? (
            <>
              <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </>
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 cursor-pointer rounded-full p-0 ring-2 ring-transparent transition-all duration-200 hover:ring-primary/20"
            >
              <Avatar className="h-9 w-9 border-2 border-background shadow-md ring-1 ring-border/60">
                <AvatarImage src={getImageUrl(user?.profileImage)} alt={user?.name} className="object-cover" />
                <AvatarFallback className="bg-primary">
                  <User className="h-4 w-4 text-white" strokeWidth={2.25} />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <p className="font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground font-normal truncate">{user?.email}</p>
                <p className="text-xs text-primary font-medium capitalize mt-0.5">
                  {formatRoleName(user?.role)}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              {isAdmin() && (
                <DropdownMenuItem asChild>
                  <Link href="/change-password" className="cursor-pointer">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
