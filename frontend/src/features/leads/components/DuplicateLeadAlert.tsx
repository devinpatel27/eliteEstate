'use client';

import Link from 'next/link';
import { AlertTriangle, History, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Lead } from '../types/lead.types';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { LeadStatusBadge } from './LeadStatusBadge';

interface DuplicateLeadAlertProps {
  activeLead?: Lead | null;
  closedLeads?: Lead[];
  onDismiss?: () => void;
}

export function DuplicateLeadAlert({ activeLead, closedLeads = [], onDismiss }: DuplicateLeadAlertProps) {
  if (!activeLead && closedLeads.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Active Duplicate Alert (Blocks Creation) */}
      {activeLead && (
        <div className="crm-card flex gap-3 border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="font-semibold text-red-900 dark:text-red-200">Active Lead Already Exists</p>
            <p className="mt-1 text-sm text-red-800 dark:text-red-300">
              An active lead (<span className="font-mono font-medium">{activeLead.leadId}</span> — {activeLead.customerName}) is currently open for this mobile number. You cannot create a duplicate active lead.
            </p>
            <div className="mt-3 flex gap-2">
              <Link href={ROUTES.LEAD_DETAIL(activeLead._id)}>
                <Button size="sm" variant="default" className="rounded-lg gap-1.5">
                  Open Active Lead
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              {onDismiss && (
                <Button size="sm" variant="ghost" onClick={onDismiss} className="rounded-lg text-red-700 hover:bg-red-100">
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Closed Inquiries Warning / History */}
      {!activeLead && closedLeads.length > 0 && (
        <div className="crm-card border-amber-300 bg-amber-50/80 p-4 dark:border-amber-800/60 dark:bg-amber-950/20 overflow-hidden min-w-0">
          <div className="flex items-start gap-3 min-w-0">
            <History className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Past Inquiry Record Found ({closedLeads.length})
                </p>
                {onDismiss && (
                  <Button size="sm" variant="ghost" onClick={onDismiss} className="h-7 px-2 text-xs text-amber-800 hover:bg-amber-100">
                    Dismiss
                  </Button>
                )}
              </div>
              <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/90">
                This mobile number was previously handled in the CRM. You can create a new lead, but please review the prior history below:
              </p>

              <div className="mt-3 space-y-2 min-w-0">
                {closedLeads.map((item) => {
                  const assignee = item.assignedTo;
                  const remark = item.lastFollowUpRemark || item.initialRemark;
                  return (
                    <div
                      key={item._id}
                      className="rounded-lg border border-amber-200 bg-white/80 p-3 text-xs shadow-xs dark:border-amber-900/40 dark:bg-background/80 overflow-hidden min-w-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground">{item.leadId}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-medium text-foreground">{item.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <LeadStatusBadge status={item.status} />
                          <span className="text-[11px] text-muted-foreground">{formatDate(item.createdAt)}</span>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">Handled by: </span>
                          <span>{assignee ? assignee.name : 'Unassigned'}</span>
                        </div>
                        {item.propertyType && (
                          <div>
                            <span className="font-medium text-foreground">Property: </span>
                            <span>{typeof item.propertyType === 'object' ? item.propertyType.name : item.propertyType}</span>
                          </div>
                        )}
                      </div>

                      {remark && (
                        <div className="mt-2 rounded bg-amber-500/10 p-2 text-foreground/90 overflow-hidden min-w-0">
                          <span className="font-semibold text-amber-900 dark:text-amber-200 block text-[11px] mb-0.5">
                            Last Remark:
                          </span>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap break-all [overflow-wrap:anywhere] [word-break:break-word]">{remark}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
