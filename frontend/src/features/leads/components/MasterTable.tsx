'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { masterService } from '@/features/leads/services/master.service';
import { MasterItem } from '@/features/leads/types/lead.types';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';

interface MasterTableProps {
  type: 'property-types' | 'lead-sources';
  title: string;
  description: string;
}

export function MasterTable({ type, title, description }: MasterTableProps) {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MasterItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MasterItem | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const { hasPermission, isReady } = usePermissions();
  const canManage = isReady && hasPermission(PERMISSIONS.LEAD_MASTER_MANAGE);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = type === 'property-types'
        ? await masterService.listPropertyTypes()
        : await masterService.listLeadSources();
      if (res.success) setItems(res.data || []);
    } catch {
      toast.error('Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [type]);

  const openCreate = () => { setEditItem(null); setName(''); setDialogOpen(true); };
  const openEdit = (item: MasterItem) => { setEditItem(item); setName(item.name); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editItem) {
        if (type === 'property-types') await masterService.updatePropertyType(editItem._id, { name });
        else await masterService.updateLeadSource(editItem._id, { name });
        toast.success('Updated successfully');
      } else {
        if (type === 'property-types') await masterService.createPropertyType({ name });
        else await masterService.createLeadSource({ name });
        toast.success('Created successfully');
      }
      setDialogOpen(false);
      fetchItems();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (type === 'property-types') await masterService.deletePropertyType(deleteTarget._id);
      else await masterService.deleteLeadSource(deleteTarget._id);
      toast.success('Deleted successfully');
      setDeleteTarget(null);
      fetchItems();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <PageHeader title={title} description={description}>
        {canManage && (
          <Button className="crm-btn-primary gap-2 rounded-xl" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add New
          </Button>
        )}
      </PageHeader>

      <Card className="crm-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="divide-y divide-border/60">
            {items.map((item) => (
              <div key={item._id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="mt-1 text-[10px]">
                    {item.status}
                  </Badge>
                </div>
                {canManage && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(item)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="crm-dialog sm:max-w-sm" hideCloseButton>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit' : 'Add'} {title.slice(0, -1)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input className="crm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <Button className="crm-btn-primary w-full" onClick={handleSave} disabled={saving || !name.trim()}>
              {editItem ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
