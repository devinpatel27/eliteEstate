'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Pencil, Trash2, UserCheck, UserX, KeyRound, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Employee } from '../types/employee.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate, getInitials, getImageUrl, formatRoleName } from '@/lib/utils';

interface ColumnActions {
  onDelete: (employee: Employee) => void;
  onToggleStatus: (employee: Employee) => void;
  onResetPassword: (employee: Employee) => void;
  canManage: boolean;
  canDelete: boolean;
  canEdit: boolean;
}

export function getEmployeeColumns(actions: ColumnActions): ColumnDef<Employee>[] {
  return [
    {
      id: 'employee',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Employee
          <ArrowUpDown className="ml-1.5 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={getImageUrl(emp.profileImage)} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                {getInitials(emp.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-tight">{emp.name}</p>
              <p className="text-xs text-muted-foreground">{emp.email}</p>
            </div>
          </div>
        );
      },
      enableSorting: true,
      minSize: 200,
    },
    {
      accessorKey: 'employeeId',
      header: 'ID',
      cell: ({ row }) => (
        <span className="text-xs font-mono font-medium text-muted-foreground">
          {row.original.employeeId}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.mobile || '—'}</span>
      ),
      size: 120,
    },
    {
      id: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role?.roleName;
        return (
          <Badge variant="secondary" className="text-xs capitalize font-medium">
            {formatRoleName(role)}
          </Badge>
        );
      },
      size: 120,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 90,
    },
    {
      accessorKey: 'joiningDate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Joined
          <ArrowUpDown className="ml-1.5 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.joiningDate)}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 text-xs font-semibold"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created
          <ArrowUpDown className="ml-1.5 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
      size: 100,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const emp = row.original;
        const isActive = emp.status === 'active';

        return (
          <div className="flex items-center justify-end gap-1">
            <Link href={`/employees/${emp._id}`}>
              <Button variant="ghost" size="icon" className="h-7 w-7" title="View">
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </Link>
            {actions.canEdit && (
              <Link href={`/employees/${emp._id}/edit`}>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
            {(actions.canManage || actions.canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {actions.canManage && (
                    <>
                      <DropdownMenuItem
                        onClick={() => actions.onToggleStatus(emp)}
                        className={isActive ? 'text-amber-600' : 'text-emerald-600'}
                      >
                        {isActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5 mr-2" /> Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5 mr-2" /> Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => actions.onResetPassword(emp)}>
                        <KeyRound className="w-3.5 h-3.5 mr-2" />
                        Reset Password
                      </DropdownMenuItem>
                    </>
                  )}
                  {actions.canDelete && !['admin', 'master_admin'].includes(emp.role?.roleName) && !emp.role?.permissions?.includes('*') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => actions.onDelete(emp)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        );
      },
      size: 120,
      enableHiding: false,
    },
  ];
}
