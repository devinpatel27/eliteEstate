'use client';

import { type LucideIcon } from 'lucide-react';
import { StatsCard } from '@/features/dashboard/components/StatsCard';

export interface KpiItem {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'orange' | 'sky';
}

interface KpiCardGridProps {
  items: KpiItem[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
}

export function KpiCardGrid({ items, isLoading, columns = 4 }: KpiCardGridProps) {
  const gridClass =
    columns === 2
      ? 'grid gap-4 sm:grid-cols-2'
      : columns === 3
        ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
        : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <StatsCard
          key={item.title}
          title={item.title}
          value={item.value}
          icon={item.icon}
          color={item.color}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
