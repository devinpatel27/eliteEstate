'use client';

import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { masterService } from '../services/master.service';
import { FollowUpActivity } from '../types/lead.types';

type DialogMode = 'parent' | 'child';

export function FollowUpActivityMaster() {
  const [activities, setActivities] = useState<FollowUpActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>('parent');
  const [editItem, setEditItem] = useState<FollowUpActivity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FollowUpActivity | null>(null);
  const [name, setName] = useState('');
  const [parent, setParent] = useState('');
  const [saving, setSaving] = useState(false);

  const parents = useMemo(() => activities, [activities]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await masterService.listFollowUpActivities();
      if (res.success) setActivities(res.data || []);
    } catch {
      toast.error('Failed to load follow-up activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = (nextMode: DialogMode, parentId = '') => {
    setMode(nextMode);
    setEditItem(null);
    setName('');
    setParent(parentId);
    setDialogOpen(true);
  };

  const openEdit = (item: FollowUpActivity, nextMode: DialogMode, parentId = '') => {
    setMode(nextMode);
    setEditItem(item);
    setName(item.name);
    setParent(parentId);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), parent: mode === 'child' ? parent : undefined };
      if (editItem) await masterService.updateFollowUpActivity(editItem._id, payload);
      else await masterService.createFollowUpActivity(payload);
      toast.success(editItem ? 'Updated successfully' : 'Created successfully');
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
      await masterService.deleteFollowUpActivity(deleteTarget._id);
      toast.success('Deleted successfully');
      setDeleteTarget(null);
      fetchItems();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <PageHeader title="Follow-up Activities" description="Manage parent activities and child follow-up outcomes.">
        <Button className="crm-btn-primary gap-2 rounded-xl" onClick={() => openCreate('parent')}>
          <Plus className="h-4 w-4" /> Add Parent
        </Button>
      </PageHeader>

      <Card className="crm-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="divide-y divide-border/70">
            {parents.map((activity) => (
              <div key={activity._id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{activity.name}</p>
                    <Badge variant={activity.status === 'active' ? 'default' : 'secondary'} className="mt-1 text-[10px]">
                      {activity.status}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openCreate('child', activity._id)}>
                      <Plus className="h-3.5 w-3.5" /> Child
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(activity, 'parent')}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(activity)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(activity.children || []).map((child) => (
                    <div key={child._id} className="flex items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2">
                      <span className="min-w-0 truncate text-xs font-medium">{child.name}</span>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(child, 'child', activity._id)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(child)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(activity.children || []).length === 0 && (
                    <p className="text-xs text-muted-foreground">No child outcomes yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="crm-dialog sm:max-w-sm" hideCloseButton>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit' : 'Add'} {mode === 'parent' ? 'Parent Activity' : 'Child Outcome'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {mode === 'child' && (
              <select className="crm-input w-full px-3 py-2" value={parent} onChange={(e) => setParent(e.target.value)}>
                {parents.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
            )}
            <Input className="crm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <Button className="crm-btn-primary w-full" onClick={handleSave} disabled={saving || !name.trim() || (mode === 'child' && !parent)}>
              {editItem ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name}?`}
        description="Deleting a parent also deletes its child outcomes."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
