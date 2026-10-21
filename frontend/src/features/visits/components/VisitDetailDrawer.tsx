'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CloseButton } from '@/components/common/CloseButton';
import { CopyPhoneButton } from '@/components/common/CopyPhoneButton';
import { Badge } from '@/components/ui/badge';
import { VisitLeadFollowUp } from './VisitLeadFollowUp';
import { visitService } from '../services/visit.service';
import { Visit, VisitDetail } from '../types/visit.types';
import { formatDateTime } from '@/lib/utils';
interface Props {
  visit: Visit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
  onFavoriteToggle?: (id: string, favorite: boolean) => void;
  canUpdate?: boolean;
  canFavorite?: boolean;
}
export function VisitDetailDrawer({visit, open, onOpenChange, onRefresh}: Props) {
  const [detail, setDetail] = useState<VisitDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!open || !visit?._id) return;
    let cancelled = false;
    setLoading(true); setDetail(null);
    visitService.getById(visit._id).then(res => { if (!cancelled) setDetail(res.data || null); })
      .catch(() => { if (!cancelled) toast.error('Could not load visit'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {cancelled = true;};
  }, [open, visit?._id, revision]);
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent hideCloseButton className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
      <SheetHeader className="relative border-b px-6 py-5 pr-16">
        <SheetTitle>{detail?.lead ? <Link className="hover:underline" href={`/leads/${detail.lead._id}`}>{detail.lead.customerName}</Link> : 'Visit details'}</SheetTitle>
        <SheetDescription>{detail?.lead?.leadId} · Lead visit activity</SheetDescription>
        <CloseButton className="absolute right-4 top-4" onClick={() => onOpenChange(false)} />
      </SheetHeader>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : detail && <>
          <div className="space-y-3 rounded-xl border p-4">
            <p>{detail.lead?.mobile} <CopyPhoneButton number={detail.lead?.mobile} /></p>
            <p className="text-sm text-muted-foreground">Assigned: {detail.lead?.assignedTo?.name || 'Unassigned'}</p>
            <Badge className="capitalize">{detail.lead?.status || detail.status}</Badge>
            <p className="whitespace-pre-wrap text-sm">{detail.remark || 'No visit remark'}</p>
            <VisitLeadFollowUp visit={detail} onSuccess={() => {setRevision(value => value + 1); onRefresh?.();}} />
          </div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Visit history</p>
          {(detail.history || []).map(item => <div key={item._id} className="space-y-1 rounded-lg border p-3 text-sm">
            <p className="text-xs text-muted-foreground">{formatDateTime(item.performedAt)} · {item.performedBy?.name || 'System'}</p>
            <p className="whitespace-pre-wrap">{item.remark || '—'}</p>
          </div>)}
        </>}
      </div>
    </SheetContent>
  </Sheet>;
}
