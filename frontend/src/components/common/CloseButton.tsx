'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CloseButtonProps {
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

export function CloseButton({
  onClick,
  className,
  'aria-label': ariaLabel = 'Close',
}: CloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border/60 bg-muted/30 text-muted-foreground transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive',
        className
      )}
      aria-label={ariaLabel}
    >
      <X className="h-4 w-4" />
    </button>
  );
}
