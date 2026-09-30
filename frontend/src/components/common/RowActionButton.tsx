'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type ActionTone = 'blue' | 'sky' | 'green' | 'violet' | 'amber';

const toneStyles: Record<ActionTone, string> = {
  blue:
    'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 hover:text-blue-700 hover:shadow-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400',
  sky:
    'bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 hover:text-sky-700 hover:shadow-sky-500/20 dark:bg-sky-500/15 dark:text-sky-400',
  green:
    'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 hover:shadow-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400',
  violet:
    'bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 hover:text-violet-700 hover:shadow-violet-500/20 dark:bg-violet-500/15 dark:text-violet-400',
  amber:
    'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 hover:shadow-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400',
};

interface RowActionButtonProps {
  icon: LucideIcon;
  label: string;
  tone: ActionTone;
  onClick?: () => void;
  href?: string;
  external?: boolean;
}

export function RowActionButton({
  icon: Icon,
  label,
  tone,
  onClick,
  href,
  external,
}: RowActionButtonProps) {
  const className = cn(
    'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent',
    'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95',
    toneStyles[tone]
  );

  const iconEl = <Icon className="h-4 w-4" strokeWidth={2.25} />;

  const trigger =
    href ? (
      external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          aria-label={label}
          onClick={(event) => event.stopPropagation()}
        >
          {iconEl}
        </a>
      ) : (
        <Link href={href} className={className} aria-label={label} onClick={(event) => event.stopPropagation()}>
          {iconEl}
        </Link>
      )
    ) : (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
        className={className}
        aria-label={label}
      >
        {iconEl}
      </button>
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side="top" className="text-xs font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
