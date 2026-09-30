'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin, Phone, Star } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CloseButton } from '@/components/common/CloseButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { visitService } from '../services/visit.service';
import { Visit, VisitDetail } from '../types/visit.types';
import { formatDate, formatDateTime } from '@/lib/utils';
import { VISIT_TYPES, VISIT_STATUSES } from '@/lib/constants';
import { toast } from 'sonner';

interface VisitDetailDrawerProps {
  visit: Visit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
  onFavoriteToggle?: (visitId: string, isFavorite: boolean) => void;
  canUpdate?: boolean;
  canFavorite?: boolean;
}

export function VisitDetailDrawer({
  visit,
  open,
  onOpenChange,
  onRefresh,
  onFavoriteToggle,
  canUpdate,
  canFavorite,
}: VisitDetailDrawerProps) {
  const [detail, setDetail] = useState<VisitDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyNote, setHistoryNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !visit?._id) return;
    setIsLoading(true);
    visitService
      .getById(visit._id)
      .then((res) => {
        if (res.success) setDetail(res.data || null);
      })
      .catch(() => toast.error('Failed to load visit details'))
      .finally(() => setIsLoading(false));
  }, [open, visit?._id, visit?.isFavorite]);

  const handleStatusChange = async (status: string) => {
    if (!visit?._id) return;
    setIsSaving(true);
    try {
      await visitService.update(visit._id, { status });
      toast.success('Visit status updated');
      const res = await visitService.getById(visit._id);
      if (res.success) setDetail(res.data || null);
      onRefresh?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!visit?._id || !canFavorite || !detail) return;
    const nextFavorite = !detail.isFavorite;
    setDetail({ ...detail, isFavorite: nextFavorite });
    onFavoriteToggle?.(visit._id, nextFavorite);
    try {
      await visitService.toggleFavorite(visit._id);
    } catch {
      setDetail({ ...detail, isFavorite: detail.isFavorite });
      onFavoriteToggle?.(visit._id, detail.isFavorite);
      toast.error('Failed to update favorite');
    }
  };

  const handleAddHistory = async () => {
    if (!visit?._id || !historyNote.trim()) return;
    setIsSaving(true);
    try {
      await visitService.addHistory(visit._id, { remark: historyNote.trim() });
      setHistoryNote('');
      const res = await visitService.getById(visit._id);
      if (res.success) setDetail(res.data || null);
      toast.success('History added');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to add history');
    } finally {
      setIsSaving(false);
    }
  };

  const typeLabel = VISIT_TYPES.find((t) => t.value === detail?.type)?.label || detail?.type;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent hideCloseButton className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="relative border-b border-border/60 px-6 py-5 pr-14">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle>{detail?.lead?.customerName || 'Visit Details'}</SheetTitle>
              <SheetDescription>
                {detail?.lead?.leadId} · {typeLabel}
              </SheetDescription>
            </div>
            {canFavorite && (
              <Button type="button" variant="ghost" size="icon" className="mr-8" onClick={handleToggleFavorite}>
                <Star
                  className={
                    detail?.isFavorite
                      ? 'h-5 w-5 fill-amber-400 text-amber-400'
                      : 'h-5 w-5 text-muted-foreground'
                  }
                />
              </Button>
            )}
          </div>
          <CloseButton
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : detail ? (
            <div className="space-y-5">
              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {detail.lead?.mobile || '—'}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Assigned: {detail.lead?.assignedTo?.name || 'Unassigned'}
                </div>
                <p>
                  <span className="text-muted-foreground">Scheduled:</span>{' '}
                  {formatDate(detail.scheduledDate)}
                  {detail.scheduledTime ? ` at ${detail.scheduledTime}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">{detail.status}</Badge>
                  <Badge variant="secondary">
                    {detail.source === 'follow_up' ? 'From Follow-up' : 'Manual'}
                  </Badge>
                </div>
                {detail.remark && <p className="text-muted-foreground">{detail.remark}</p>}
              </div>

              {canUpdate && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Update Status
                  </p>
                  <Select value={detail.status} onValueChange={handleStatusChange} disabled={isSaving}>
                    <SelectTrigger className="crm-select-trigger h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Visit History
                </p>
                <div className="space-y-2">
                  {(detail.history || []).map((item) => (
                    <div key={item._id} className="rounded-lg border border-border/50 bg-background p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">{item.action.replace(/_/g, ' ')}</Badge>
                        <span className="text-[11px] text-muted-foreground">{formatDateTime(item.performedAt)}</span>
                      </div>
                      <p>{item.remark || '—'}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        by {item.performedBy?.name || 'System'}
                      </p>
                    </div>
                  ))}
                  {(detail.history || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No history yet.</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    className="crm-input h-9 flex-1"
                    placeholder="Add visit note..."
                    value={historyNote}
                    onChange={(e) => setHistoryNote(e.target.value)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="crm-btn-primary h-9"
                    disabled={isSaving || !historyNote.trim()}
                    onClick={handleAddHistory}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
