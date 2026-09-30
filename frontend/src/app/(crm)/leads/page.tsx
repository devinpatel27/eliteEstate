'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TablePageSkeleton } from '@/components/common/PageSkeletons';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';

const LeadTable = dynamic(
  () => import('@/features/leads/components/LeadTable').then((m) => ({ default: m.LeadTable })),
  { loading: () => <TablePageSkeleton /> }
);

const AddLeadDialog = dynamic(
  () => import('@/features/leads/components/AddLeadDialog').then((m) => ({ default: m.AddLeadDialog })),
  { ssr: false }
);

export default function LeadsPage() {
  const { hasPermission, canViewAllLeads, isReady } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const canCreate = isReady && hasPermission(PERMISSIONS.LEAD_CREATE);

  return (
    <div>
      <PageHeader
        title="Leads"
        description={
          isReady && !canViewAllLeads()
            ? 'View and manage leads assigned to you.'
            : 'Manage property leads and track follow-ups.'
        }
      >
        {canCreate && (
          <Button
            className="crm-btn-primary gap-2 rounded-xl px-5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        )}
      </PageHeader>
      <Suspense fallback={<TablePageSkeleton />}>
        <LeadTable
          key={refreshKey}
          onCreateLead={canCreate ? () => setCreateOpen(true) : undefined}
        />
      </Suspense>
      <AddLeadDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setRefreshKey((value) => value + 1)}
      />
    </div>
  );
}
