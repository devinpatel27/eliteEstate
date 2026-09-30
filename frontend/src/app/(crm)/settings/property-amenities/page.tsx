'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ModalShell } from '@/components/common/ModalShell';
import { amenityService } from '@/features/properties/services/amenity.service';
import { MasterItem } from '@/features/leads/types/lead.types';
import { PERMISSIONS } from '@/lib/constants';
import { Sparkles } from 'lucide-react';

export default function PropertyAmenitiesPage() {
  const [items, setItems] = useState<MasterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MasterItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MasterItem | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await amenityService.list();
      if (res.success) setItems(res.data || []);
    } catch {
      toast.error('Failed to load amenities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editItem) await amenityService.update(editItem._id, { name });
      else await amenityService.create({ name });
      toast.success(editItem ? 'Updated' : 'Created');
      setDialogOpen(false);
      fetchItems();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await amenityService.delete(deleteTarget._id);
      toast.success('Deleted');
      setDeleteTarget(null);
      fetchItems();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <PermissionGuard permission={PERMISSIONS.PROPERTY_MASTER_MANAGE} redirectTo="/dashboard">
      <PageHeader title="Property Amenities" description="Manage amenity options for property listings.">
        <Button className="crm-btn-primary gap-2 rounded-xl" onClick={() => { setEditItem(null); setName(''); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Amenity
        </Button>
      </PageHeader>
      <Card className="crm-card divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No amenities configured.</div>
        ) : (
          items.map((item) => (
            <div key={item._id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="font-medium">{item.name}</span>
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>{item.status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setEditItem(item); setName(item.name); setDialogOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>

      <ModalShell open={dialogOpen} onOpenChange={setDialogOpen} title={editItem ? 'Edit Amenity' : 'Add Amenity'} icon={Sparkles}>
        <div className="space-y-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Amenity name" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="crm-btn-primary" onClick={handleSave} disabled={saving}>
              {editItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </ModalShell>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Amenity"
        description={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </PermissionGuard>
  );
}
