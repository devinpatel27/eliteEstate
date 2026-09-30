import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isActive = status === 'active';

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          isActive ? 'bg-emerald-500' : 'bg-slate-400'
        )}
      />
      <span
        className={cn(
          'text-xs font-medium capitalize',
          isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
        )}
      >
        {status}
      </span>
    </div>
  );
}
