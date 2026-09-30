'use client';

import { LeadActivity } from '../types/lead.types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';
import { Activity } from 'lucide-react';

interface LeadTimelineProps {
  activities: LeadActivity[];
  isLoading?: boolean;
  title?: string;
  prominent?: boolean;
}

export function LeadTimeline({ activities, isLoading, title = 'Activity Timeline', prominent }: LeadTimelineProps) {
  if (isLoading) {
    return (
      <Card className="crm-card p-5 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="crm-card p-8 text-center text-sm text-muted-foreground">
        <Activity className="mx-auto mb-2 h-8 w-8 opacity-40" />
        No activity recorded yet.
      </Card>
    );
  }

  return (
    <Card className={prominent ? 'crm-card overflow-hidden border-primary/20 shadow-md' : 'crm-card p-5'}>
      <div className={prominent ? 'border-b border-border/60 bg-primary/5 px-5 py-4' : ''}>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="h-4 w-4 text-primary" />
          {title}
        </h3>
      </div>
      <div className={prominent ? 'p-5' : 'mt-4'}>
        <div className="relative">
          <div className="absolute bottom-2 left-[11px] top-2 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
          <div className="space-y-0">
            {activities.map((activity, index) => (
              <div key={activity._id} className="relative flex gap-4 pb-6 last:pb-0">
                <div
                  className={`relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-background ${
                    index === 0 ? 'bg-primary shadow-md shadow-primary/30' : 'bg-primary/70'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                </div>
                <div className="min-w-0 flex-1 rounded-xl border border-border/50 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{activity.title}</p>
                    <span className="rounded-full bg-background px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {activity.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {activity.remark && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{activity.remark}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {activity.performedBy?.name || 'Unknown'} · {formatDateTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
