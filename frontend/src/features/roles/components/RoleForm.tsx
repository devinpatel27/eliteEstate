'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { roleSchema, RoleFormValues } from '../schemas/role.schema';
import { roleService } from '../services/role.service';
import { Role } from '../types/role.types';
import { ALL_PERMISSIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface RoleFormProps {
  role?: Role;
  mode: 'create' | 'edit';
  variant?: 'page' | 'modal';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RoleForm({ role, mode, variant = 'page', onSuccess, onCancel }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const isModal = variant === 'modal';

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues:
      mode === 'edit' && role
        ? {
            roleName: role.roleName || '',
            permissions: (role.permissions ?? []).filter((p) => p !== '*'),
            description: role.description || '',
            status: role.status || 'active',
          }
        : {
            roleName: '',
            permissions: [],
            description: '',
            status: 'active',
          },
  });

  const selectedPermissions = form.watch('permissions');

  const togglePermission = (key: string) => {
    const current = form.getValues('permissions') as string[];
    if (current.includes(key)) {
      form.setValue('permissions', current.filter((p) => p !== key));
    } else {
      form.setValue('permissions', [...current, key]);
    }
  };

  const toggleGroup = (group: string) => {
    const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group).map((p) => p.key as string);
    const current = form.getValues('permissions') as string[];
    const allSelected = groupPerms.every((p) => current.includes(p));
    if (allSelected) {
      form.setValue('permissions', current.filter((p) => !groupPerms.includes(p)));
    } else {
      const merged = Array.from(new Set([...current, ...groupPerms]));
      form.setValue('permissions', merged);
    }
  };

  const groups = Array.from(new Set(ALL_PERMISSIONS.map((p) => p.group)));

  const onSubmit = async (values: RoleFormValues) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await roleService.create(values);
        toast.success('Role created successfully');
      } else {
        await roleService.update(role!._id, values);
        toast.success('Role updated successfully');
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/roles');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSystemRole = mode === 'edit' && role?.isSystem;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={isModal ? 'flex min-h-0 flex-1 flex-col' : 'space-y-6'}
      >
        <div className={isModal ? 'min-h-0 flex-1 space-y-4 overflow-y-auto pr-1' : 'space-y-6'}>
        {/* Basic Info */}
        <Card className="crm-card p-6">
          <h3 className="text-sm font-semibold mb-4">Role Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="roleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      className="crm-input"
                      placeholder="e.g. sales_manager"
                      disabled={isSubmitting || isSystemRole}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="crm-select-trigger">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        className="crm-input"
                        placeholder="Brief description of this role's responsibilities"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </Card>

        {/* Permissions */}
        <Card className="crm-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Permissions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select what this role can access and do.
              </p>
            </div>
            <Badge variant="secondary">
              {selectedPermissions.length} selected
            </Badge>
          </div>

          {isSystemRole && role?.permissions?.includes('*') ? (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm font-medium text-primary">Wildcard Permission — Full Access</p>
              <p className="text-xs text-muted-foreground mt-1">
                This system role has unrestricted access to all features.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => {
                const groupPerms = ALL_PERMISSIONS.filter((p) => p.group === group);
                const allSelected = groupPerms.every((p) => selectedPermissions.includes(p.key));
                const someSelected = groupPerms.some((p) => selectedPermissions.includes(p.key));

                return (
                  <div key={group}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Checkbox
                        checked={allSelected}
                        data-state={!allSelected && someSelected ? 'indeterminate' : undefined}
                        onCheckedChange={() => toggleGroup(group)}
                        disabled={isSubmitting}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                      {groupPerms.map((perm) => (
                        <div key={perm.key} className="flex items-center gap-2">
                          <Checkbox
                            id={perm.key}
                            checked={(selectedPermissions as string[]).includes(perm.key as string)}
                            onCheckedChange={() => togglePermission(perm.key)}
                            disabled={isSubmitting}
                          />
                          <label
                            htmlFor={perm.key}
                            className="text-sm leading-none cursor-pointer select-none"
                          >
                            {perm.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        </div>

        {/* Submit */}
        <div className={cn('flex items-center gap-3', isModal && 'shrink-0 border-t border-border/60 pt-4')}>
          <Button type="submit" disabled={isSubmitting} className="crm-btn-primary gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'create' ? 'Create Role' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => (onCancel ? onCancel() : router.back())}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
