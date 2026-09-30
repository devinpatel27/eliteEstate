'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn, formatIndianNumber, parseIndianNumber } from '@/lib/utils';

interface CurrencyInputProps {
  value?: number | string;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  borderless?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  disabled,
  className,
  borderless,
}: CurrencyInputProps) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    const numeric = typeof value === 'string' ? parseIndianNumber(value) : value;
    setDisplay(numeric !== undefined && numeric !== null ? formatIndianNumber(numeric) : '');
  }, [value]);

  return (
    <div className="relative">
      <span className={cn(
        'pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-muted-foreground',
        borderless ? 'left-1' : 'left-3'
      )}>₹</span>
      <Input
        className={cn(
          borderless ? 'h-8 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0' : 'crm-input h-10 pl-8',
          !borderless && 'pl-8',
          borderless && 'pl-6',
          className
        )}
        inputMode="numeric"
        placeholder={placeholder}
        disabled={disabled}
        value={display}
        onChange={(e) => {
          const raw = e.target.value;
          setDisplay(raw);
          onChange(parseIndianNumber(raw));
        }}
        onBlur={() => {
          const parsed = parseIndianNumber(display);
          setDisplay(parsed !== undefined ? formatIndianNumber(parsed) : '');
          onChange(parsed);
        }}
      />
    </div>
  );
}
