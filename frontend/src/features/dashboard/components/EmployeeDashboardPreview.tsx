'use client';

import { CalendarClock, MapPin } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { TaskCardsSection } from './TaskCardsSection';
import { Skeleton } from '@/components/ui/skeleton';
import { getImageUrl, getInitials } from '@/lib/utils';

interface EmployeeDashboardPreviewProps {
  employeeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDashboardPreview({ employeeId, open, onOpenChange }: EmployeeDashboardPreviewProps) {
  const { data: overview, isLoading } = useDashboardOverview(employeeId || undefined);

  const tomorrowVisits = overview?.timeline.visits.tomorrow ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Employee Dashboard Preview</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : overview ? (
            <>
              <div className="rounded-xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 border-2 border-background shadow">
                    <AvatarImage src={getImageUrl(overview.employee.profileImage)} />
                    <AvatarFallback className="text-lg">{getInitials(overview.employee.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold">{overview.employee.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {overview.employee.role} · {overview.employee.employeeId}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tomorrowVisits > 0 && (
                        <Badge className="gap-1 bg-violet-100 text-violet-700 hover:bg-violet-100">
                          <CalendarClock className="h-3 w-3" />
                          {tomorrowVisits} visit{tomorrowVisits !== 1 ? 's' : ''} tomorrow
                        </Badge>
                      )}
                      {overview.timeline.followUps.tomorrow > 0 && (
                        <Badge variant="secondary">
                          {overview.timeline.followUps.tomorrow} follow-up{overview.timeline.followUps.tomorrow !== 1 ? 's' : ''} tomorrow
                        </Badge>
                      )}
                      {(overview.timeline.unique?.due ?? 0) > 0 && (
                        <Badge variant="destructive" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                          {overview.timeline.unique?.due} due
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {overview.visitTasks.tomorrow.length > 0 && (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Visits Tomorrow ({overview.visitTasks.tomorrow.length})
                  </p>
                  <ul className="space-y-2 text-sm">
                    {overview.visitTasks.tomorrow.slice(0, 5).map((v) => (
                      <li key={v._id} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                        <span className="font-medium">{v.lead?.customerName || 'Visit'}</span>
                        <span className="text-xs text-muted-foreground capitalize">{v.type.replace(/_/g, ' ')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <TaskCardsSection overview={overview} showSearch embedded tabbed />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Unable to load employee dashboard.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
