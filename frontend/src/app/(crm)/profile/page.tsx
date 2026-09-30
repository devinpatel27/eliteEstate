'use client';

import { useAuthStore } from '@/stores/auth.store';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials, getImageUrl, formatRoleName } from '@/lib/utils';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="My Profile" description="View your account information." />

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="w-16 h-16">
            <AvatarImage src={getImageUrl(user?.profileImage)} />
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
              {getInitials(user?.name || 'U')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="capitalize mt-1.5 text-xs">
              {formatRoleName(user?.role)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Employee ID</p>
            <p className="font-mono font-medium mt-0.5">{user?.employeeId}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="font-medium mt-0.5">{user?.email}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
