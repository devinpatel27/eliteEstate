'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Shield,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { Employee } from '../types/employee.types';
import { useEmployeeActions } from '../hooks/useEmployees';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/constants';
import { formatDate, formatDateTime, getInitials, getImageUrl, formatRoleName } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface EmployeeProfileProps {
  employee: Employee;
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export function EmployeeProfile({ employee }: EmployeeProfileProps) {
  const { hasPermission } = usePermissions();
  const { deleteEmployee, toggleStatus, resetPassword, isLoading } = useEmployeeActions();
  const router = useRouter();

  const [showDelete, setShowDelete] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const canEdit = hasPermission(PERMISSIONS.EMPLOYEE_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.EMPLOYEE_DELETE) && !['admin', 'master_admin'].includes(employee.role?.roleName) && !employee.role?.permissions?.includes('*');
  const canManage = hasPermission(PERMISSIONS.EMPLOYEE_MANAGE);

  const fullAddress = [
    employee.address,
    employee.city,
    employee.state,
    employee.pincode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Profile card */}
      <div className="lg:col-span-1">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar className="w-20 h-20 mb-4">
              <AvatarImage src={getImageUrl(employee.profileImage)} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-bold">{employee.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{employee.email}</p>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="capitalize text-xs">
                {formatRoleName(employee.role?.roleName)}
              </Badge>
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-2 bg-muted px-2 py-1 rounded">
              {employee.employeeId}
            </p>
          </div>

          <Separator className="mb-4" />

          {/* Action Buttons */}
          {(canEdit || canManage || canDelete) && (
            <div className="space-y-2">
              {canEdit && (
                <Link href={`/employees/${employee._id}/edit`} className="block">
                  <Button variant="outline" size="sm" className="w-full gap-1.5">
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Profile
                  </Button>
                </Link>
              )}
              {canManage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full gap-1.5 ${
                      employee.status === 'active'
                        ? 'text-amber-600 hover:text-amber-700 border-amber-200 hover:border-amber-300'
                        : 'text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300'
                    }`}
                    onClick={() => setShowStatus(true)}
                  >
                    {employee.status === 'active' ? (
                      <><UserX className="w-3.5 h-3.5" /> Deactivate</>
                    ) : (
                      <><UserCheck className="w-3.5 h-3.5" /> Activate</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                    onClick={() => setShowReset(true)}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Reset Password
                  </Button>
                </>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Employee
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Right: Details */}
      <div className="lg:col-span-2 space-y-5">
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Contact Information</h3>
          <div className="space-y-4">
            <InfoRow icon={Mail} label="Email Address" value={employee.email} />
            <InfoRow icon={Phone} label="Mobile Number" value={employee.mobile} />
            <InfoRow icon={MapPin} label="Address" value={fullAddress || undefined} />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-4">Employment Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoRow icon={Shield} label="Role" value={formatRoleName(employee.role?.roleName)} />
            <InfoRow icon={Calendar} label="Joining Date" value={formatDate(employee.joiningDate)} />
            <InfoRow icon={Clock} label="Last Login" value={formatDateTime(employee.lastLogin)} />
            <InfoRow icon={Calendar} label="Account Created" value={formatDate(employee.createdAt)} />
          </div>
        </Card>

        {employee.forcePasswordChange && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              ⚠️ Password Change Required
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
              This employee must change their password on next login.
            </p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Employee"
        description={`Delete "${employee.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={isLoading}
        onConfirm={async () => {
          await deleteEmployee(employee._id, () => router.push('/employees'));
        }}
      />
      <ConfirmDialog
        open={showStatus}
        onOpenChange={setShowStatus}
        title={employee.status === 'active' ? 'Deactivate Employee' : 'Activate Employee'}
        description={`${employee.status === 'active' ? 'Deactivate' : 'Activate'} "${employee.name}"?`}
        confirmLabel={employee.status === 'active' ? 'Deactivate' : 'Activate'}
        isLoading={isLoading}
        onConfirm={async () => {
          const newStatus = employee.status === 'active' ? 'inactive' : 'active';
          await toggleStatus(employee._id, newStatus, () => router.refresh());
          setShowStatus(false);
        }}
      />
      <ResetPasswordDialog
        employee={employee}
        open={showReset}
        onOpenChange={setShowReset}
        onReset={resetPassword}
        isLoading={isLoading}
      />
    </div>
  );
}
