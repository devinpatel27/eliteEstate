'use client';

import { useState, useCallback } from 'react';
import { Plus, Search, Filter, Download, UserX, UserCheck, Trash2, Users } from 'lucide-react';
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
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useEmployeeList, useEmployeeActions } from '../hooks/useEmployees';
import { getEmployeeColumns } from './columns';
import { Employee } from '../types/employee.types';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';
import { useDebounce } from '@/hooks/useDebounce';
import { downloadCSV, formatDate } from '@/lib/utils';

export function EmployeeTable({ onAddClick }: { onAddClick?: () => void }) {
  const { hasPermission, isReady } = usePermissions();
  const { employees, totalCount, pageCount, isLoading, params, updateParams, refetch } =
    useEmployeeList();
  const { deleteEmployee, toggleStatus, resetPassword, isLoading: actionLoading } =
    useEmployeeActions();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  // Dialog state
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [statusTarget, setStatusTarget] = useState<Employee | null>(null);
  const [resetTarget, setResetTarget] = useState<Employee | null>(null);

  // Apply debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      updateParams({ search: value, page: 1 });
    },
    [updateParams]
  );

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Mobile', 'Role', 'Status', 'Joined', 'Created'];
    const rows = employees.map((e) => [
      e.employeeId,
      e.name,
      e.email,
      e.mobile || '',
      e.role?.roleName || '',
      e.status,
      formatDate(e.joiningDate),
      formatDate(e.createdAt),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    downloadCSV(csv, `employees-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const columns = getEmployeeColumns({
    onDelete: setDeleteTarget,
    onToggleStatus: setStatusTarget,
    onResetPassword: setResetTarget,
    canManage: isReady && hasPermission(PERMISSIONS.EMPLOYEE_MANAGE),
    canDelete: isReady && hasPermission(PERMISSIONS.EMPLOYEE_DELETE),
    canEdit: isReady && hasPermission(PERMISSIONS.EMPLOYEE_UPDATE),
  });

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-60">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="crm-toolbar-input pl-9 h-9 text-sm"
        />
      </div>
      <Select
        value={params.status || 'all'}
        onValueChange={(v) => updateParams({ status: v === 'all' ? undefined : v, page: 1 })}
      >
        <SelectTrigger className="h-9 w-32 text-sm">
          <Filter className="w-3.5 h-3.5 mr-1.5" />
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-9 gap-1.5 rounded-lg">
        <Download className="w-3.5 h-3.5" />
        Export CSV
      </Button>
    </div>
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={employees}
        totalCount={totalCount}
        pageIndex={(params.page ?? 1) - 1}
        pageSize={params.limit ?? 10}
        pageCount={pageCount}
        onPageChange={(p) => updateParams({ page: p + 1 })}
        onPageSizeChange={(s) => updateParams({ limit: s, page: 1 })}
        onSortChange={(sortBy, sortOrder) => updateParams({ sortBy, sortOrder, page: 1 })}
        isLoading={isLoading}
        enableRowSelection
        toolbar={toolbar}
        emptyState={
          <EmptyState
            icon={Users}
            title="No employees found"
            description={
              params.search
                ? `No results for "${params.search}". Try a different search term.`
                : 'No employees have been added yet.'
            }
          >
            {isReady && hasPermission(PERMISSIONS.EMPLOYEE_CREATE) && !params.search && onAddClick && (
              <Button size="sm" className="crm-btn-primary gap-1.5 rounded-lg" onClick={onAddClick}>
                <Plus className="w-3.5 h-3.5" />
                Add First Employee
              </Button>
            )}
          </EmptyState>
        }
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Employee"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={actionLoading}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteEmployee(deleteTarget._id, refetch);
            setDeleteTarget(null);
          }
        }}
      />

      {/* Toggle Status Confirm */}
      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(o) => !o && setStatusTarget(null)}
        title={statusTarget?.status === 'active' ? 'Deactivate Employee' : 'Activate Employee'}
        description={`Are you sure you want to ${
          statusTarget?.status === 'active' ? 'deactivate' : 'activate'
        } "${statusTarget?.name}"?`}
        confirmLabel={statusTarget?.status === 'active' ? 'Deactivate' : 'Activate'}
        isLoading={actionLoading}
        onConfirm={async () => {
          if (statusTarget) {
            const newStatus = statusTarget.status === 'active' ? 'inactive' : 'active';
            await toggleStatus(statusTarget._id, newStatus, refetch);
            setStatusTarget(null);
          }
        }}
      />

      {/* Reset Password */}
      <ResetPasswordDialog
        employee={resetTarget}
        open={!!resetTarget}
        onOpenChange={(o) => !o && setResetTarget(null)}
        onReset={async (id, pass) => {
          await resetPassword(id, pass, refetch);
        }}
        isLoading={actionLoading}
      />
    </>
  );
}
