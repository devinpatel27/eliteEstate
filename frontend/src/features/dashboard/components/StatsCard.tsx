import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'orange' | 'sky';
  isLoading?: boolean;
  href?: string;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    icon: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    icon: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-900/50',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    icon: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/50',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    icon: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-100 dark:bg-sky-900/50',
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  color = 'blue',
  isLoading,
  href,
}: StatsCardProps) {
  const colors = colorMap[color];

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="mb-1 h-8 w-16" />
        <Skeleton className="h-3 w-24" />
      </Card>
    );
  }

  const content = (
    <>
      <div className="mb-3 flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colors.iconBg)}>
          <Icon className={cn('h-5 w-5', colors.icon)} />
        </div>
      </div>
      <p className="text-3xl font-bold tabular-nums text-foreground">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </>
  );

  const className = cn(
    'crm-card border-0 p-5 shadow-sm transition duration-200',
    colors.bg,
    href && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
  );

  if (href) {
    return (
      <Link href={href} className={cn('block rounded-xl', className)}>
        {content}
      </Link>
    );
  }

  return <Card className={className}>{content}</Card>;
}
