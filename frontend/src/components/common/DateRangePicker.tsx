'use client';

import 'react-datepicker/dist/react-datepicker.css';
import { useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import { CalendarDays, X } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DatePickerHeader } from '@/components/common/DatePickerHeader';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, formatDate } from '@/lib/utils';

interface DateRangePickerProps {
  dateFrom?: string;
  dateTo?: string;
  onChange: (range: { dateFrom?: string; dateTo?: string }) => void;
  className?: string;
}

function formatRangeLabel(from?: string, to?: string): string {
  if (from && to) return `${formatDate(from)} → ${formatDate(to)}`;
  if (from) return `From ${formatDate(from)}`;
  if (to) return `Until ${formatDate(to)}`;
  return 'Date range';
}

function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

function toIso(date: Date | null): string | undefined {
  if (!date) return undefined;
  return format(date, 'yyyy-MM-dd');
}

export function DateRangePicker({ dateFrom, dateTo, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const hasRange = Boolean(dateFrom || dateTo);
  const startDate = toDate(dateFrom);
  const endDate = toDate(dateTo);

  const handleRangeChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    onChange({
      dateFrom: toIso(start),
      dateTo: toIso(end),
    });
  };

  const handleClear = () => {
    onChange({ dateFrom: undefined, dateTo: undefined });
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'crm-select-trigger min-w-[200px] max-w-[280px] gap-2 px-3 font-normal',
            !hasRange && 'text-muted-foreground',
            hasRange && 'border-primary/40 bg-primary/5',
            className
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="text-sm whitespace-nowrap">{formatRangeLabel(dateFrom, dateTo)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-datepicker-popover
        className="pointer-events-auto z-[100] w-auto border-border/60 p-0 shadow-xl"
        align="start"
        sideOffset={8}
      >
        <div className="rounded-2xl bg-popover p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Filter by created date
          </p>
          <div className="crm-react-datepicker-inline crm-react-datepicker-range">
            <ReactDatePicker
              inline
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={handleRangeChange}
              monthsShown={2}
              calendarClassName="crm-react-datepicker"
              renderCustomHeader={DatePickerHeader}
              showMonthDropdown={false}
              showYearDropdown={false}
            />
          </div>
          {hasRange && (
            <div className="mt-3 space-y-2 border-t pt-3">
              <p className="text-center text-xs text-muted-foreground">
                {formatRangeLabel(dateFrom, dateTo)}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-full gap-1.5 text-muted-foreground"
                onClick={handleClear}
              >
                <X className="h-3.5 w-3.5" />
                Clear range
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
