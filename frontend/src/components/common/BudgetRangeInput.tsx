'use client';

import { CurrencyInput } from '@/components/common/CurrencyInput';
import { cn } from '@/lib/utils';

interface BudgetRangeInputProps {
  minValue?: number | string;
  maxValue?: number | string;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function BudgetRangeInput({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  disabled,
  className,
}: BudgetRangeInputProps) {
  return (
    <div
      className={cn(
        'flex h-10 items-center gap-2 rounded-xl border border-input bg-background px-2 transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <CurrencyInput
        value={minValue}
        onChange={onMinChange}
        placeholder="Min"
        disabled={disabled}
        borderless
      />
      <span className="shrink-0 text-sm text-muted-foreground">–</span>
      <CurrencyInput
        value={maxValue}
        onChange={onMaxChange}
        placeholder="Max"
        disabled={disabled}
        borderless
      />
    </div>
  );
}
