'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { PageHeader } from '@/components/common/PageHeader';
import { SkeletonTable } from '@/components/common/SkeletonTable';
import { PropertyForm } from '@/features/properties/components/PropertyForm';
import { propertyService } from '@/features/properties/services/property.service';
import { Property, PropertyInquiry } from '@/features/properties/types/property.types';
import { PERMISSIONS } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

export default function PropertyDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isEdit = searchParams.get('edit') === 'true';
  const { hasPermission, isReady } = usePermissions();

  const [property, setProperty] = useState<Property | null>(null);
  const [inquiries, setInquiries] = useState<PropertyInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [propRes, inqRes] = await Promise.all([
          propertyService.getById(id),
          propertyService.getInquiries(id, { limit: 10 }),
        ]);
        if (propRes.success && propRes.data) setProperty(propRes.data);
        if (inqRes.success) setInquiries(inqRes.data || []);
      } catch {
        toast.error('Failed to load property');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) return <SkeletonTable rows={8} />;

  if (!property) {
    return <div className="p-8 text-center text-muted-foreground">Property not found</div>;
  }

  const canEdit = isReady && hasPermission(PERMISSIONS.PROPERTY_UPDATE);

  return (
    <PermissionGuard permission={PERMISSIONS.PROPERTY_READ} redirectTo="/properties">
      <PageHeader
        title={isEdit ? `Edit: ${property.title}` : property.title}
        description={`${property.propertyCode} · ${property.inquiryCount} inquiries`}
      >
        {!isEdit && canEdit && (
          <Button asChild className="crm-btn-primary gap-2 rounded-xl">
            <Link href={`/properties/${id}?edit=true`}>
              <Pencil className="h-4 w-4" /> Edit Property
            </Link>
          </Button>
        )}
      </PageHeader>

      {isEdit ? (
        <PropertyForm property={property} onSuccess={setProperty} />
      ) : (
        <div className="space-y-6">
          <Card className="crm-card p-6">
            <div className="flex flex-wrap gap-2">
              <Badge>{property.purpose}</Badge>
              <Badge variant="secondary">{property.status}</Badge>
              {property.publishOnWebsite && <Badge variant="default">Published</Badge>}
              {property.isFeatured && <Badge variant="default">Featured</Badge>}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{property.publicLocationLabel || `${property.area}, ${property.city}`}</p>
            {property.description && <p className="mt-3">{property.description}</p>}
          </Card>

          <Card className="crm-card p-6">
            <h3 className="mb-4 text-lg font-semibold">Recent Inquiries ({property.inquiryCount})</h3>
            {inquiries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No inquiries yet.</p>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => (
                  <div key={inq._id} className="rounded-lg border p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{inq.name}</span>
                      <span className="text-muted-foreground">{formatDate(inq.createdAt)}</span>
                    </div>
                    <p className="text-muted-foreground">{inq.mobile} {inq.email && `· ${inq.email}`}</p>
                    {inq.message && <p className="mt-1">{inq.message}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </PermissionGuard>
  );
}
