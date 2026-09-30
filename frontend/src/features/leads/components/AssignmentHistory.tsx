'use client';

import { LeadAssignment } from '../types/lead.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';

interface AssignmentHistoryProps {
  assignments: LeadAssignment[];
  isLoading?: boolean;
}

export function AssignmentHistory({ assignments, isLoading }: AssignmentHistoryProps) {
  if (isLoading) {
    return (
      <Card className="crm-card p-5 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </Card>
    );
  }

  return (
    <Card className="crm-card p-5">
      <h3 className="mb-4 text-sm font-semibold">Assignment History</h3>
      <div className="space-y-3">
        {assignments.length === 0 && (
          <p className="text-sm text-muted-foreground">No assignment history.</p>
        )}
        {assignments.map((a) => (
          <div key={a._id} className="rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{a.assignedTo?.name || 'Unknown'}</p>
              {a.isCurrent && <Badge className="text-[10px]">Current</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Assigned by {a.assignedBy?.name} · {formatDateTime(a.assignedAt)}
            </p>
            {a.transferRemark && (
              <p className="mt-1 text-xs text-muted-foreground italic">Remark: {a.transferRemark}</p>
            )}
            {a.transferredAt && (
              <p className="mt-1 text-xs text-muted-foreground">Transferred: {formatDateTime(a.transferredAt)}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
