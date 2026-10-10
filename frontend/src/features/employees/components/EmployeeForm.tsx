'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2,
  Eye,
  EyeOff,
  User,
  Shield,
  MapPin,
  Camera,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/common/ImageUpload';
import { DatePicker } from '@/components/common/DatePicker';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from '../schemas/employee.schema';
import { employeeService } from '../services/employee.service';
import { roleService } from '@/features/roles/services/role.service';
import { Employee } from '../types/employee.types';
import { Role } from '@/features/roles/types/role.types';
import { INDIAN_STATES } from '@/lib/constants';
import { cn, getImageUrl, formatRoleName } from '@/lib/utils';

interface EmployeeFormProps {
  employee?: Employee;
  mode: 'create' | 'edit';
  variant?: 'page' | 'modal';
  onSuccess?: () => void;
  onCancel?: () => void;
}

function FormSection({
  icon: Icon,
  title,
  children,
  compact,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn('crm-form-section', compact && 'p-4')}>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function EmployeeForm({
  employee,
  mode,
  variant = 'page',
  onSuccess,
  onCancel,
}: EmployeeFormProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const isModal = variant === 'modal';

  const schema = mode === 'create' ? createEmployeeSchema : updateEmployeeSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues:
      mode === 'edit' && employee
        ? {
            name: employee.name || '',
            email: employee.email || '',
            mobile: employee.mobile || '',
            role: employee.role?._id || '',
            address: employee.address || '',
            city: employee.city || '',
            state: employee.state || '',
            pincode: employee.pincode || '',
            joiningDate: employee.joiningDate && !Number.isNaN(new Date(employee.joiningDate).getTime())
              ? new Date(employee.joiningDate).toISOString().split('T')[0]
              : '',
            status: employee.status,
          }
        : {
            name: '',
            email: '',
            mobile: '',
            password: '',
            role: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            joiningDate: '',
            status: 'active' as const,
          },
  });

  useEffect(() => {
    roleService.list().then((res) => {
      if (res.success && res.data) {
        setRoles(res.data);
        if (mode === 'create' && !form.getValues('role')) {
          const employeeRole = res.data.find((r) => r.roleName === 'employee');
          if (employeeRole) {
            form.setValue('role', employeeRole._id);
          }
        }
      }
    });
  }, [form, mode]);

  const onSubmit = async (values: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          formData.append(key, String(val));
        }
      });
      if (!formData.has('status')) formData.append('status', 'active');
      if (profileImageFile) formData.append('profileImage', profileImageFile);

      if (mode === 'create') {
        await employeeService.create(formData);
        toast.success('Employee created successfully');
      } else {
        await employeeService.update(employee!._id, formData);
        toast.success('Employee updated successfully');
      }

      if (onSuccess) {
        onSuccess();
      } else if (mode === 'create') {
        router.push('/employees');
      } else {
        router.push(`/employees/${employee!._id}`);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: { field: string; message: string }[] } } };
      const apiErrors = error?.response?.data?.errors;
      if (apiErrors?.length) {
        apiErrors.forEach((e) => {
          form.setError(e.field as 'email', { message: e.message });
        });
      }
      toast.error(error?.response?.data?.message || 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else router.back();
  };

  return (
    <Form {...form}>
      <form
        id={isModal ? 'add-employee-form' : undefined}
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(isModal ? 'flex min-h-0 flex-1 flex-col' : 'space-y-5')}
      >
        <div className={cn(isModal ? 'min-h-0 flex-1 space-y-4 overflow-y-auto pr-1' : 'space-y-5')}>
        <FormSection icon={Camera} title="Profile Photo" compact={isModal}>
          <ImageUpload
            value={getImageUrl(employee?.profileImage)}
            onChange={setProfileImageFile}
            disabled={isSubmitting}
          />
        </FormSection>

        <FormSection icon={User} title="Personal Information" compact={isModal}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Full Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input className="crm-input" placeholder="John Doe" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="crm-input"
                      type="email"
                      placeholder="john@company.com"
                      disabled={isSubmitting || mode === 'edit'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile</FormLabel>
                  <FormControl>
                    <Input className="crm-input" placeholder="+91 9876543210" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="joiningDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Joining Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select joining date"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>

        <FormSection icon={Shield} title="Account Details" compact={isModal}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mode === 'create' && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Password <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="crm-input pr-10"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 8 chars, A-Z, a-z, 0-9"
                          disabled={isSubmitting}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Role <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger className="crm-select-trigger">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.filter((role) => role._id).map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                          {formatRoleName(role.roleName)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
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
          </div>
        </FormSection>

        <FormSection icon={MapPin} title="Address" compact={isModal}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input className="crm-input" placeholder="Street address" disabled={isSubmitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input className="crm-input" placeholder="Mumbai" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger className="crm-select-trigger">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INDIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode</FormLabel>
                  <FormControl>
                    <Input className="crm-input" placeholder="400001" maxLength={6} disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormSection>
        </div>

        <div
          className={cn(
            'flex shrink-0 items-center gap-3',
            isModal
              ? 'border-t border-border/60 bg-background/95 px-0 pt-4 backdrop-blur-sm'
              : 'pt-1'
          )}
        >
          <Button
            type="submit"
            disabled={isSubmitting}
            className="crm-btn-primary gap-2 rounded-xl px-6"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Employee' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
