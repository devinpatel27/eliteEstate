'use client';

import { Building2, Home, Key, ShoppingBag, Star, Globe, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PropertyDashboardStats } from '../types/property.types';

interface PropertyDashboardProps {
  stats?: PropertyDashboardStats;
  isLoading?: boolean;
}

const statCards = [
  { key: 'total', label: 'Total Properties', icon: Building2, color: 'from-blue-500 to-indigo-600' },
  { key: 'buy', label: 'Buy', icon: ShoppingBag, color: 'from-emerald-500 to-teal-600' },
  { key: 'sell', label: 'Sell', icon: Home, color: 'from-violet-500 to-purple-600' },
  { key: 'rent', label: 'Rent', icon: Key, color: 'from-amber-500 to-orange-600' },
  { key: 'published', label: 'Published', icon: Globe, color: 'from-cyan-500 to-blue-600' },
  { key: 'featured', label: 'Featured', icon: Star, color: 'from-pink-500 to-rose-600' },
  { key: 'sold', label: 'Sold', icon: CheckCircle, color: 'from-slate-500 to-slate-700' },
  { key: 'rented', label: 'Rented', icon: Key, color: 'from-lime-500 to-green-600' },
] as const;

export function PropertyDashboard({ stats, isLoading }: PropertyDashboardProps) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map(({ key, label, icon: Icon, color }) => (
        <Card key={key} className="crm-card overflow-hidden border-border/60 p-0">
          <div className="flex items-center gap-4 p-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold tabular-nums">
                {isLoading ? '—' : (stats?.[key] ?? 0)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
