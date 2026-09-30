'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { PropertyDashboard } from './PropertyDashboard';
import { getPropertyColumns } from './columns';
import { propertyService } from '../services/property.service';
import { Property } from '../types/property.types';
import { usePropertyList, usePropertyDashboardStats } from '../hooks/useProperties';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import { PERMISSIONS, PROPERTY_PURPOSES, PROPERTY_STATUSES } from '@/lib/constants';

export function PropertyTable() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission, isReady } = usePermissions();
  const { properties, totalCount, pageCount, isLoading, params, updateParams, refetch } =
    usePropertyList();
  const { stats, isLoading: statsLoading } = usePropertyDashboardStats();
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);

  const canEdit = isReady && hasPermission(PERMISSIONS.PROPERTY_UPDATE);
  const canDelete = isReady && hasPermission(PERMISSIONS.PROPERTY_DELETE);
  const canPublish = isReady && hasPermission(PERMISSIONS.PROPERTY_PUBLISH);
  const canCreate = isReady && hasPermission(PERMISSIONS.PROPERTY_CREATE);

  const refreshAll = () => {
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ['properties-dashboard'] });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await propertyService.delete(deleteTarget._id);
      toast.success('Property deleted');
      setDeleteTarget(null);
      refreshAll();
    } catch {
      toast.error('Failed to delete property');
    }
  };

  const handleTogglePublish = async (property: Property) => {
    try {
      await propertyService.togglePublish(property._id);
      toast.success(property.publishOnWebsite ? 'Unpublished' : 'Published');
      refreshAll();
    } catch {
      toast.error('Failed to update publish status');
    }
  };

  const handleToggleFeature = async (property: Property) => {
    try {
      await propertyService.toggleFeature(property._id);
      toast.success(property.isFeatured ? 'Removed from featured' : 'Marked as featured');
      refreshAll();
    } catch {
      toast.error('Failed to update featured status');
    }
  };

  const columns = getPropertyColumns({
    canEdit,
    canDelete,
    canPublish,
    onRefresh: refreshAll,
    onDelete: setDeleteTarget,
    onTogglePublish: handleTogglePublish,
    onToggleFeature: handleToggleFeature,
  });

  return (
    <>
      <PropertyDashboard stats={stats} isLoading={statsLoading} />
      <DataTable
        columns={columns}
        data={properties}
        isLoading={isLoading}
        pageCount={pageCount}
        totalCount={totalCount}
        pageIndex={params.page! - 1}
        onPageChange={(page) => updateParams({ page: page + 1 })}
        toolbar={
          <>
            <div className="relative min-w-[200px] flex-1 sm:max-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="crm-toolbar-input pl-9 text-sm"
              />
            </div>
            <Select
              value={params.purpose || 'all'}
              onValueChange={(v) =>
                updateParams({
                  purpose: v === 'all' ? undefined : (v as Property['purpose']),
                  page: 1,
                })
              }
            >
              <SelectTrigger className="crm-select-trigger w-[120px] text-sm">
                <SelectValue placeholder="Purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purpose</SelectItem>
                {PROPERTY_PURPOSES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={params.status || 'all'}
              onValueChange={(v) =>
                updateParams({
                  status: v === 'all' ? undefined : (v as Property['status']),
                  page: 1,
                })
              }
            >
              <SelectTrigger className="crm-select-trigger w-[130px] text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {PROPERTY_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canCreate && (
              <Button
                className="crm-btn-primary gap-2 rounded-xl"
                onClick={() => router.push('/properties/new')}
              >
                <Plus className="h-4 w-4" /> Add Property
              </Button>
            )}
          </>
        }
        emptyState={
          <EmptyState
            icon={Search}
            title="No properties found"
            description="Create your first property listing to get started."
          >
            {canCreate && (
              <Button className="crm-btn-primary mt-4" onClick={() => router.push('/properties/new')}>
                Add Property
              </Button>
            )}
          </EmptyState>
        }
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Property"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}
