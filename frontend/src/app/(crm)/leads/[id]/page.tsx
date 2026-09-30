'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { LeadProfile } from '@/features/leads/components/LeadProfile';
import { useLead } from '@/features/leads/hooks/useLeads';
import { ErrorState } from '@/components/common/ErrorState';
import { SkeletonTable } from '@/components/common/SkeletonTable';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lead, isLoading, error, refetch } = useLead(id);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Lead Details" />
        <SkeletonTable rows={6} columns={2} />
      </div>
    );
  }

  if (error || !lead) {
    return <ErrorState description={error || 'Lead not found'} />;
  }

  return (
    <div>
      <div className="mb-4">
        <Link href="/leads">
          <Button variant="ghost" size="sm" className="crm-back-link gap-1.5 rounded-lg px-3">
            <ArrowLeft className="h-4 w-4" />
            Back to Leads
          </Button>
        </Link>
      </div>
      <PageHeader title={`${lead.customerName}`} description={`Lead ${lead.leadId}`} />
      <LeadProfile lead={lead} onRefresh={refetch} />
    </div>
  );
}
