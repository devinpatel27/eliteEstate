'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Star, Eye } from 'lucide-react';
import { Visit } from '../types/visit.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { VISIT_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ColumnActions {
  canFavorite: boolean;
  onToggleFavorite: (visit: Visit) => void;
  onView: (visit: Visit) => void;
}

function getTypeLabel(type: string) {
  return VISIT_TYPES.find((t) => t.value === type)?.label || type.replace(/_/g, ' ');
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default';
  if (status === 'cancelled') return 'destructive';
  if (status === 'rescheduled') return 'secondary';
  return 'outline';
}

export function getVisitColumns(actions: ColumnActions): ColumnDef<Visit>[] {
  return [
    {
      id: 'favorite',
      header: '',
      cell: ({ row }) => {
        const visit = row.original;
        if (!actions.canFavorite) {
          return visit.isFavorite ? (
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          ) : (
            <Star className="h-4 w-4 text-muted-foreground/40" />
          );
        }
        return (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => actions.onToggleFavorite(visit)}
          >
            <Star
              className={cn(
                'h-4 w-4',
                visit.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/50'
              )}
            />
          </Button>
        );
      },
      size: 44,
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.lead?.customerName || '—'}</p>
          <p className="text-xs text-muted-foreground">{row.original.lead?.mobile || '—'}</p>
        </div>
      ),
      minSize: 150,
    },
    {
      id: 'leadId',
      header: 'Lead ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.lead?.leadId || '—'}</span>
      ),
      size: 90,
    },
    {
      accessorKey: 'type',
      header: 'Visit Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[11px] capitalize">
          {getTypeLabel(row.original.type)}
        </Badge>
      ),
      size: 120,
    },
    {
      accessorKey: 'scheduledDate',
      header: 'Scheduled',
      cell: ({ row }) => (
        <div className="text-xs">
          <p className="font-medium">{formatDate(row.original.scheduledDate)}</p>
          {row.original.scheduledTime && (
            <p className="text-muted-foreground">{row.original.scheduledTime}</p>
          )}
        </div>
      ),
      size: 110,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)} className="text-[11px] capitalize">
          {row.original.status}
        </Badge>
      ),
      size: 100,
    },
    {
      id: 'assigned',
      header: 'Assigned',
      cell: ({ row }) => (
        <span className="text-xs">{row.original.lead?.assignedTo?.name || 'Unassigned'}</span>
      ),
      size: 110,
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px]">
          {row.original.source === 'follow_up' ? 'Follow-up' : 'Manual'}
        </Badge>
      ),
      size: 90,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => actions.onView(row.original)}
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
      ),
      size: 80,
    },
  ];
}

export function visitRowClassName(visit: Visit): string {
  return visit.isFavorite
    ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-2 border-l-amber-500'
    : 'hover:bg-muted/30';
}
