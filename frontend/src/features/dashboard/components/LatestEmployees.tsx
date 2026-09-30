import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LatestEmployee } from '../types/dashboard.types';
import { getInitials, getImageUrl, formatDate, formatRoleName } from '@/lib/utils';

interface LatestEmployeesProps {
  employees: LatestEmployee[];
  isLoading?: boolean;
}

export function LatestEmployees({ employees, isLoading }: LatestEmployeesProps) {
  return (
    <Card className="crm-card">
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Latest Employees</h3>
        </div>
        <Link href="/employees">
          <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
            View all
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      <div className="divide-y">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))
          : employees.length === 0
          ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No employees yet
            </div>
          )
          : employees.map((emp) => (
              <Link
                key={emp._id}
                href={`/employees/${emp._id}`}
                className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
              >
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarImage src={getImageUrl(emp.profileImage)} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(emp.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {emp.employeeId} · {formatRoleName(emp.role?.roleName)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={emp.status} />
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(emp.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
      </div>
    </Card>
  );
}
