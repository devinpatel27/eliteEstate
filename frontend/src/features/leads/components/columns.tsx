'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Lead } from '../types/lead.types';
import { Button } from '@/components/ui/button';
import { LeadStatusBadge, LeadPriorityBadge } from './LeadStatusBadge';
import { NextFollowUpCell } from './NextFollowUpCell';
import { LeadRowActions } from './LeadRowActions';
import { formatDate, formatDateTime, cn } from '@/lib/utils';

interface ColumnActions {
  canEdit: boolean;
  canFollowUp: boolean;
  canViewAllLeads: boolean;
  onRefresh?: () => void;
  onRemarkClick?: (lead: Lead) => void;
}

function getMasterName(item: Lead['propertyType']): string {
  if (!item) return '—';
  return typeof item === 'string' ? item : item.name;
}

function LastDiscussedCell({
  lead,
  onRemarkClick,
}: {
  lead: Lead;
  onRemarkClick?: (lead: Lead) => void;
}) {
  const remark = lead.lastFollowUpRemark;

  return (
    <div
      className={cn(
        'flex flex-col gap-1 w-full min-w-0 py-1 rounded-md transition-colors',
        onRemarkClick && 'cursor-pointer hover:bg-muted/40 p-1.5'
      )}
      onClick={(e) => {
        if (onRemarkClick) {
          e.stopPropagation();
          onRemarkClick(lead);
        }
      }}
      title={onRemarkClick ? 'Click to view follow-up history & remarks' : undefined}
    >
      <div className="flex items-center gap-2">
        <NextFollowUpCell date={lead.nextFollowUpDate} />
      </div>
      {remark ? (
        <p className="text-xs text-foreground/90 font-normal leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-word] hover:text-primary transition-colors">
          {remark}
        </p>
      ) : (
        <span className="text-xs text-muted-foreground/50 italic">No remark yet</span>
      )}
    </div>
  );
}

export function getLeadColumns(actions: ColumnActions): ColumnDef<Lead>[] {
  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: 'leadId',
      header: 'Lead / Date',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-mono font-semibold text-foreground">{row.original.leadId}</span>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatDate(row.original.createdAt)}</span>
        </div>
      ),
      size: 95,
      minSize: 90,
    },
    {
      id: 'customerName',
      accessorKey: 'customerName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 cursor-pointer text-xs font-semibold"
          onClick={(event) => {
            event.stopPropagation();
            column.toggleSorting(column.getIsSorted() === 'asc');
          }}
        >
          Customer
          <ArrowUpDown className="ml-1.5 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="min-w-0 pr-1">
            <p className="text-xs font-semibold text-foreground truncate">{lead.customerName || '—'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-muted-foreground font-mono">{lead.mobile}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(lead.mobile);
                  toast.success(`Copied: ${lead.mobile}`);
                }}
                className="p-0.5 rounded text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Copy mobile number"
              >
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      },
      minSize: 120,
      size: 130,
    },
    {
      id: 'propertyType',
      header: 'Property Type',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium capitalize">{getMasterName(row.original.propertyType)}</span>
          {row.original.propertyConfiguration && (
            <span className="text-[11px] text-muted-foreground">{row.original.propertyConfiguration}</span>
          )}
        </div>
      ),
      size: 105,
      minSize: 95,
    },
    {
      id: 'priorityAndStatus',
      header: 'Priority & Status',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 items-start">
          <LeadPriorityBadge priority={row.original.priority} />
          <LeadStatusBadge status={row.original.status} />
        </div>
      ),
      size: 105,
      minSize: 95,
    },
    {
      id: 'nextFollowUpAndRemark',
      header: () => <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide">NFD & Last Discussed</span>,
      cell: ({ row }) => <LastDiscussedCell lead={row.original} onRemarkClick={actions.onRemarkClick} />,
      minSize: 320,
      size: 460,
    },
    {
      id: 'assignment',
      header: () => <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide">Assignment</span>,
      cell: ({ row }) => {
        const assignee = row.original.assignedTo;
        if (!assignee) {
          return (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
              Unassigned
            </span>
          );
        }
        return (
          <div className="min-w-0 pr-1">
            <p className="text-xs font-semibold text-foreground whitespace-nowrap truncate">{assignee.name}</p>
            <p className="text-[11px] text-muted-foreground whitespace-nowrap">
              {row.original.assignedAt ? formatDateTime(row.original.assignedAt) : assignee.employeeId || '—'}
            </p>
          </div>
        );
      },
      size: 140,
      minSize: 130,
    },
    {
      id: 'actions',
      header: () => <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-right block w-full pr-2">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end w-full pr-1">
          <LeadRowActions
            lead={row.original}
            canEdit={actions.canEdit}
            canFollowUp={actions.canFollowUp}
            onRefresh={actions.onRefresh}
          />
        </div>
      ),
      size: 175,
      minSize: 170,
      enableHiding: false,
    },
  ];

  if (!actions.canViewAllLeads) {
    return columns.filter((column) => column.id !== 'assignment');
  }

  return columns;
}
