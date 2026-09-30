'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Settings, Loader2 } from 'lucide-react';
import { PermissionGuard } from '@/components/common/PermissionGuard';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { settingsService } from '@/features/properties/services/amenity.service';
import { employeeService } from '@/features/employees/services/employee.service';
import { Employee } from '@/features/employees/types/employee.types';
import { PERMISSIONS } from '@/lib/constants';

export default function LeadAssignmentPage() {
  const [mode, setMode] = useState<'manual' | 'round_robin'>('manual');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, empRes] = await Promise.all([
          settingsService.getLeadAssignment(),
          employeeService.list({ page: 1, limit: 100, status: 'active' }),
        ]);
        if (settingsRes.success && settingsRes.data) {
          setMode(settingsRes.data.mode);
          setSelectedIds(settingsRes.data.roundRobinEmployeeIds?.map(String) || []);
        }
        if (empRes.success) setEmployees(empRes.data || []);
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateLeadAssignment({
        mode,
        roundRobinEmployeeIds: mode === 'round_robin' ? selectedIds : [],
      });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleEmployee = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <PermissionGuard permission={PERMISSIONS.SETTINGS_MANAGE} redirectTo="/dashboard">
      <PageHeader
        title="Lead Assignment"
        description="Configure how website inquiries and contact form leads are assigned."
      />
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card className="crm-card max-w-2xl space-y-6 p-6">
          <div>
            <Label>Assignment Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'manual' | 'round_robin')}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual — leads stay unassigned</SelectItem>
                <SelectItem value="round_robin">Round Robin — auto-assign to employees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'round_robin' && (
            <div>
              <Label className="mb-3 block">Eligible Employees</Label>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
                {employees.map((emp) => (
                  <label key={emp._id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedIds.includes(emp._id)}
                      onCheckedChange={() => toggleEmployee(emp._id)}
                    />
                    {emp.name} ({emp.employeeId})
                  </label>
                ))}
              </div>
            </div>
          )}

          <Button className="crm-btn-primary gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
            Save Settings
          </Button>
        </Card>
      )}
    </PermissionGuard>
  );
}
