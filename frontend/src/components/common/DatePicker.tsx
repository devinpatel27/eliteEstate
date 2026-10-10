'use client';

import 'react-datepicker/dist/react-datepicker.css';
import { forwardRef, useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import { format, parseISO, isValid } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePickerHeader } from '@/components/common/DatePickerHeader';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  /** Inline calendar (no dropdown) — use inside popovers */
  inline?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const toDate = (value?: string): Date | null => {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

interface TriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  compact?: boolean;
  placeholder?: string;
  valueLabel?: string;
}

const DatePickerTrigger = forwardRef<HTMLButtonElement, TriggerProps>(
  ({ compact, placeholder, valueLabel, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(
        'crm-date-trigger flex w-full items-center gap-2.5 px-3 text-left font-normal transition-all',
        compact ? 'h-9' : 'h-10',
        !valueLabel && 'text-muted-foreground',
        className
      )}
      {...props}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/10">
        <CalendarDays className="h-3.5 w-3.5 text-primary" strokeWidth={2.25} />
      </span>
      <span className="truncate text-sm">{valueLabel || placeholder}</span>
    </button>
  )
);
DatePickerTrigger.displayName = 'DatePickerTrigger';

function InlineCalendar({
  selected,
  onChange,
  minDate,
  maxDate,
  disabled,
  className,
}: {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('crm-react-datepicker-inline', className)}>
      <ReactDatePicker
        inline
        selected={selected}
        onChange={onChange}
        minDate={minDate}
        maxDate={maxDate}
        calendarClassName="crm-react-datepicker"
        disabled={disabled}
        renderCustomHeader={DatePickerHeader}
        showMonthDropdown={false}
        showYearDropdown={false}
      />
    </div>
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  className,
  compact,
  inline,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const displayValue = selected ? format(selected, 'dd MMM yyyy') : undefined;

  const handleSelect = (date: Date | null) => {
    onChange(date ? format(date, 'yyyy-MM-dd') : '');
    setOpen(false);
  };

  if (inline) {
    return (
      <InlineCalendar
        selected={selected}
        onChange={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        className={className}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild disabled={disabled}>
        <DatePickerTrigger
          compact={compact}
          placeholder={placeholder}
          valueLabel={displayValue}
          className={className}
          disabled={disabled}
        />
      </PopoverTrigger>
      <PopoverContent
        data-datepicker-popover
        className="pointer-events-auto z-[100] w-auto border-border/60 p-0 shadow-xl"
        align="start"
        sideOffset={8}
      >
        <div className="rounded-2xl bg-popover p-3">
          <InlineCalendar
            selected={selected}
            onChange={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
            disabled={disabled}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
