'use client';

import { differenceInCalendarDays, isToday, isTomorrow, startOfDay } from 'date-fns';
import { cn, formatDate } from '@/lib/utils';

interface NextFollowUpCellProps {
  date?: string | null;
}

export function NextFollowUpCell({ date }: NextFollowUpCellProps) {
  if (!date) {
    return (
      <span className="inline-flex h-7 items-center rounded-full bg-muted/80 px-2.5 text-[11px] font-medium text-muted-foreground">
        Not scheduled
      </span>
    );
  }

  const followUpDate = startOfDay(new Date(date));
  const today = startOfDay(new Date());
  const diff = differenceInCalendarDays(followUpDate, today);

  if (diff < 0) {
    const overdueDays = Math.abs(diff);
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-red-50 px-2.5 text-[11px] font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        {overdueDays}d overdue
      </span>
    );
  }

  if (isToday(followUpDate)) {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Today
      </span>
    );
  }

  if (isTomorrow(followUpDate)) {
    return (
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Tomorrow
      </span>
    );
  }

  return (
    <span className={cn('inline-flex h-7 items-center text-xs font-medium text-foreground')}>
      {formatDate(date)}
    </span>
  );
}
