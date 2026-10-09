'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2, User, Target, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/common/DatePicker';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { createLeadSchema, updateLeadSchema, CreateLeadFormValues } from '../schemas/lead.schema';
import { leadService } from '../services/lead.service';
import { masterService } from '../services/master.service';
import { employeeService } from '@/features/employees/services/employee.service';
import { propertyService } from '@/features/properties/services/property.service';
import { Lead, MasterItem } from '../types/lead.types';
import { Employee } from '@/features/employees/types/employee.types';
import { LEAD_CATEGORIES, LEAD_PRIORITIES, ROUTES, PERMISSIONS } from '@/lib/constants';
import { cn, normalizeMobileInput } from '@/lib/utils';
import { DuplicateLeadAlert } from './DuplicateLeadAlert';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';

const PROPERTY_CONFIG_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK'];
const RENT_BUDGET_OPTIONS = [
  { value: '0-10000', label: 'Up to ₹10,000 / month', min: 0, max: 10000 },
  { value: '10000-20000', label: '₹10,000 - ₹20,000 / month', min: 10000, max: 20000 },
  { value: '20000-30000', label: '₹20,000 - ₹30,000 / month', min: 20000, max: 30000 },
  { value: '30000-50000', label: '₹30,000 - ₹50,000 / month', min: 30000, max: 50000 },
  { value: '50000-100000', label: '₹50,000 - ₹1,00,000 / month', min: 50000, max: 100000 },
];
const BUDGET_RANGE_OPTIONS = [
  { value: '2500000-5000000', label: '25L - 50L', min: 2500000, max: 5000000 },
  { value: '5000000-7500000', label: '50L - 75L', min: 5000000, max: 7500000 },
  { value: '7500000-10000000', label: '75L - 1Cr', min: 7500000, max: 10000000 },
  { value: '10000000-15000000', label: '1Cr - 1.5Cr', min: 10000000, max: 15000000 },
  { value: '15000000-25000000', label: '1.5Cr - 2.5Cr', min: 15000000, max: 25000000 },
];

type MobileCheckStatus = 'idle' | 'checking' | 'available' | 'duplicate' | 'invalid';

function getConfigurationOptions(propertyTypeName?: string) {
  const name = propertyTypeName?.toLowerCase() || '';
  if (name.includes('villa') || name.includes('flat') || name.includes('apartment')) {
    return PROPERTY_CONFIG_OPTIONS.filter((option) => option !== '1 BHK');
  }
  if (name.includes('plot') || name.includes('land') || name.includes('shop') || name.includes('office')) {
    return [];
  }
  return PROPERTY_CONFIG_OPTIONS;
}

interface LeadFormProps {
  lead?: Lead;
  mode: 'create' | 'edit';
  variant?: 'page' | 'modal';
  onSuccess?: () => void;
  onCancel?: () => void;
}

function FormSection({ icon: Icon, title, children, compact }: { icon: React.ElementType; title: string; children: React.ReactNode; compact?: boolean }) {
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

export function LeadForm({ lead, mode, variant = 'page', onSuccess, onCancel }: LeadFormProps) {
  const [propertyTypes, setPropertyTypes] = useState<MasterItem[]>([]);
  const [leadSources, setLeadSources] = useState<MasterItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const [closedLeads, setClosedLeads] = useState<Lead[]>([]);
  const [mobileCheckStatus, setMobileCheckStatus] = useState<MobileCheckStatus>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const isModal = variant === 'modal';
  const { hasPermission, isReady, canViewAllLeads } = usePermissions();
  const canAssignOnCreate = isReady && canViewAllLeads() && hasPermission(PERMISSIONS.EMPLOYEE_READ);

  const [customBudget, setCustomBudget] = useState(Boolean(lead && (lead.budgetMin !== undefined || lead.budgetMax !== undefined) && !(lead.category === 'rent_property' ? RENT_BUDGET_OPTIONS : BUDGET_RANGE_OPTIONS).some(option => option.min === lead.budgetMin && option.max === lead.budgetMax)));
  const schema = mode === 'create' ? createLeadSchema : updateLeadSchema;

  const form = useForm<CreateLeadFormValues>({
    resolver: zodResolver(schema),
    defaultValues: mode === 'edit' && lead ? {
      customerName: lead.customerName,
      mobile: lead.mobile,
      alternateMobile: lead.alternateMobile || '',
      email: lead.email || '',
      city: lead.city || '',
      address: lead.address || '',
      category: lead.category as CreateLeadFormValues['category'],
      propertyType: typeof lead.propertyType === 'object' ? lead.propertyType._id : lead.propertyType,
      propertyConfiguration: lead.propertyConfiguration || '',
      leadSource: typeof lead.leadSource === 'object' ? lead.leadSource._id : lead.leadSource,
      budgetMin: lead.budgetMin,
      budgetMax: lead.budgetMax,
      nextFollowUpDate: lead.nextFollowUpDate ? lead.nextFollowUpDate.split('T')[0] : '',
      preferredArea: lead.preferredArea || '',
      assignedTo: lead.assignedTo?._id || '',
      priority: lead.priority,
      initialRemark: lead.initialRemark || '',
    } : {
      customerName: '', mobile: '', alternateMobile: '', email: '', city: '', address: '',
      category: 'buy_property', propertyType: '', propertyConfiguration: '', leadSource: '', preferredArea: '',
      assignedTo: '', priority: 'warm', nextFollowUpDate: '', initialRemark: '',
    },
  });
  const budgetOptions = form.watch('category') === 'rent_property' ? RENT_BUDGET_OPTIONS : BUDGET_RANGE_OPTIONS;
  const canAssign = canAssignOnCreate && hasPermission(PERMISSIONS.LEAD_TRANSFER);
  const watchedMobile = form.watch('mobile');
  const debouncedMobile = useDebounce(watchedMobile, 350);

  useEffect(() => {
    const loaders: Promise<unknown>[] = [
      masterService.listPropertyTypes(true),
      masterService.listLeadSources(true),
    ];

    if (canAssignOnCreate) {
      loaders.push(employeeService.list({ status: 'active', limit: 100 }));
    }

    Promise.all(loaders).then((results) => {
      const [pt, ls, emp] = results as [
        Awaited<ReturnType<typeof masterService.listPropertyTypes>>,
        Awaited<ReturnType<typeof masterService.listLeadSources>>,
        Awaited<ReturnType<typeof employeeService.list>> | undefined,
      ];
      if (pt.success) setPropertyTypes(pt.data || []);
      if (ls.success) setLeadSources(ls.data || []);
      if (emp?.success) setEmployees((emp.data || []).filter(employee => employee.role?.roleName !== 'master_admin'));
    }).catch(() => {
      /* masters still load individually if employee list fails */
    });
  }, [canAssignOnCreate, mode]);

  useEffect(() => {
    propertyService.list({ limit: 200 }).then((res) => {
      const nextAreas = Array.from(
        new Set((res.data || []).map((property) => property.area?.trim()).filter(Boolean) as string[])
      ).sort((a, b) => a.localeCompare(b));
      setAreas(nextAreas);
    }).catch(() => setAreas([]));
  }, []);

  const selectedPropertyType = propertyTypes.find((item) => item._id === form.watch('propertyType'));
  const configurationOptions = getConfigurationOptions(selectedPropertyType?.name);

  const verifyMobile = async (mobile: string) => {
    const normalized = normalizeMobileInput(mobile);
    if (mode !== 'create') return;
    if (!normalized) {
      setDuplicateLead(null);
      setClosedLeads([]);
      setMobileCheckStatus('idle');
      return;
    }
    if (normalized.length < 10) {
      setDuplicateLead(null);
      setClosedLeads([]);
      setMobileCheckStatus('invalid');
      return;
    }

    setMobileCheckStatus('checking');
    try {
      const res = await leadService.checkMobile(normalized);
      if (res.success) {
        const active = res.data?.activeLead || null;
        const closed = res.data?.closedLeads || [];
        setDuplicateLead(active);
        setClosedLeads(closed);
        setMobileCheckStatus(active ? 'duplicate' : 'available');
      } else {
        setDuplicateLead(null);
        setClosedLeads([]);
        setMobileCheckStatus('available');
      }
    } catch {
      setDuplicateLead(null);
      setClosedLeads([]);
      setMobileCheckStatus('idle');
    }
  };

  useEffect(() => {
    verifyMobile(debouncedMobile || '');
  }, [debouncedMobile]);

  const normalizeNumberField = (value: string) => value.replace(/\D/g, '').slice(-10);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    router.back();
  };

  const onSubmit = async (values: CreateLeadFormValues) => {
    if (duplicateLead && mode === 'create') {
      toast.error('Lead already exists for this mobile number');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        mobile: normalizeMobileInput(values.mobile),
        alternateMobile: values.alternateMobile ? normalizeMobileInput(values.alternateMobile) : undefined,
        propertyConfiguration: values.propertyConfiguration || undefined,
        budgetMin: values.budgetMin === '' || values.budgetMin === undefined ? undefined : Number(values.budgetMin),
        budgetMax: values.budgetMax === '' || values.budgetMax === undefined ? undefined : Number(values.budgetMax),
        nextFollowUpDate: values.nextFollowUpDate || undefined,
        assignedTo: values.assignedTo || undefined,
        email: values.email || undefined,
      };
      if (mode === 'create') {
        await leadService.create(payload);
        toast.success('Lead created successfully');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(ROUTES.LEADS);
        }
      } else {
        await leadService.update(lead!._id, { ...payload, mobile: undefined, assignedTo: undefined, budgetMin: payload.budgetMin ?? null, budgetMax: payload.budgetMax ?? null });
        if (canAssign && values.assignedTo && values.assignedTo !== lead?.assignedTo?._id) {
          await leadService.transfer(lead!._id, { assignedTo: values.assignedTo, transferRemark: 'Reassigned by admin from Edit Lead', sharePreviousRemarks: values.sharePreviousRemarks ?? false });
        }
        toast.success('Lead updated successfully');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(ROUTES.LEAD_DETAIL(lead!._id));
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      if (error?.response?.data?.message === 'Lead already exists.') {
        toast.error('Lead already exists.');
      } else {
        toast.error(error?.response?.data?.message || 'Failed to save lead');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          isModal ? 'flex min-h-0 flex-1 flex-col' : 'mx-auto max-w-4xl space-y-5'
        )}
      >
        <div className={cn(isModal && 'min-h-0 flex-1 space-y-5 overflow-y-auto pr-1', !isModal && 'space-y-5')}>
        {(duplicateLead || closedLeads.length > 0) && (
          <DuplicateLeadAlert
            activeLead={duplicateLead}
            closedLeads={closedLeads}
            onDismiss={() => {
              setDuplicateLead(null);
              setClosedLeads([]);
            }}
          />
        )}

        <FormSection icon={User} title="Customer Information" compact={isModal}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField control={form.control} name="customerName" render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input className="crm-input" placeholder="Customer name" disabled={isSubmitting} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="mobile" render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input
                    className={cn(
                      'crm-input',
                      mobileCheckStatus === 'available' && 'border-emerald-500 focus-visible:ring-emerald-500/25',
                      mobileCheckStatus === 'duplicate' && 'border-amber-500 focus-visible:ring-amber-500/25',
                      mobileCheckStatus === 'invalid' && field.value && 'border-destructive focus-visible:ring-destructive/25'
                    )}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    disabled={isSubmitting || mode === 'edit'}
                    {...field}
                    onChange={(e) => field.onChange(normalizeNumberField(e.target.value))}
                    onBlur={(e) => {
                      field.onBlur();
                      verifyMobile(e.target.value);
                    }}
                  />
                </FormControl>
                {mode === 'create' && mobileCheckStatus === 'checking' && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking mobile number...
                  </p>
                )}
                {mode === 'create' && mobileCheckStatus === 'available' && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Number available for new lead
                  </p>
                )}
                {mode === 'create' && mobileCheckStatus === 'duplicate' && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Lead already exists for this mobile number
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="alternateMobile" render={({ field }) => (
              <FormItem>
                <FormLabel>Alternate Mobile</FormLabel>
                <FormControl>
                  <Input
                    className="crm-input"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Alternate mobile"
                    disabled={isSubmitting}
                    {...field}
                    onChange={(e) => field.onChange(normalizeNumberField(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input className="crm-input" type="email" placeholder="email@example.com" disabled={isSubmitting} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl><Input className="crm-input" placeholder="City" disabled={isSubmitting} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="md:col-span-2">
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl><Input className="crm-input" placeholder="Street address" disabled={isSubmitting} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
        </FormSection>

        <FormSection icon={Target} title="Lead Information" compact={isModal}>
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {LEAD_CATEGORIES.map((category) => (
                    <label
                      key={category.value}
                      className={cn(
                        'cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                        field.value === category.value
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-border bg-background hover:border-primary/40'
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        value={category.value}
                        checked={field.value === category.value}
                        disabled={isSubmitting}
                        onChange={() => { field.onChange(category.value); form.setValue('budgetMin', undefined); form.setValue('budgetMax', undefined); }}
                      />
                      {category.shortLabel}
                    </label>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </FormSection>

        <FormSection icon={Briefcase} title="Lead Management" compact={isModal}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField control={form.control} name="propertyType" render={({ field }) => (
              <FormItem>
                <FormLabel>Property Type <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('propertyConfiguration', '', { shouldValidate: true });
                    }}
                    options={propertyTypes.map((item) => ({ value: item._id, label: item.name }))}
                    placeholder="Select property type"
                    searchPlaceholder="Search property types..."
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {configurationOptions.length > 0 && (
              <FormField control={form.control} name="propertyConfiguration" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      options={configurationOptions.map((item) => ({ value: item, label: item }))}
                      placeholder="Select 2BHK / 3BHK / 4BHK"
                      searchPlaceholder="Search property..."
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="leadSource" render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Source <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={leadSources.map((item) => ({ value: item._id, label: item.name }))}
                    placeholder="Select lead source"
                    searchPlaceholder="Search lead sources..."
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="priority" render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={LEAD_PRIORITIES.map((item) => ({ value: item.value, label: item.label }))}
                    placeholder="Select priority"
                    searchPlaceholder="Search priority..."
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="budgetMin" render={() => (
              <FormItem className="md:col-span-2">
                <FormLabel>Budget Range</FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={
                      customBudget ? 'custom' : budgetOptions.find((option) => option.min === form.watch('budgetMin') && option.max === form.watch('budgetMax'))?.value || ''
                    }
                    onValueChange={(value) => {
                      setCustomBudget(value === 'custom');
                      if (value === 'custom') return;
                      const option = budgetOptions.find((item) => item.value === value);
                      form.setValue('budgetMin', option?.min, { shouldValidate: true });
                      form.setValue('budgetMax', option?.max, { shouldValidate: true });
                    }}
                    options={[...budgetOptions.map((item) => ({ value: item.value, label: item.label })), { value: 'custom', label: 'Custom budget range' }]}
                    placeholder="Select budget range"
                    searchPlaceholder="Search budget range..."
                    disabled={isSubmitting}
                  />
                </FormControl>
                {customBudget && (
                  <div className="grid grid-cols-2 gap-3">
                    {(['budgetMin', 'budgetMax'] as const).map(name => (
                      <FormField key={name} control={form.control} name={name} render={({ field }) => (
                        <FormItem><FormLabel>{name === 'budgetMin' ? 'Minimum budget (₹)' : 'Maximum budget (₹)'}</FormLabel>
                          <FormControl><Input type="number" min={0} disabled={isSubmitting} value={field.value ?? ''} onChange={event => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    ))}
                  </div>
                )}
                {(form.formState.errors.budgetMin?.message || form.formState.errors.budgetMax?.message) && (
                  <p className="text-sm font-medium text-destructive">
                    {String(form.formState.errors.budgetMin?.message || form.formState.errors.budgetMax?.message)}
                  </p>
                )}
              </FormItem>
            )} />
            <FormField control={form.control} name="preferredArea" render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Area</FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={[
                      ...areas.map((area) => ({ value: area, label: area })),
                      ...(field.value && !areas.includes(field.value) ? [{ value: field.value, label: field.value }] : []),
                    ]}
                    placeholder="Select or type custom area"
                    searchPlaceholder="Type custom area..."
                    emptyText="Type area name and press Enter"
                    allowCustomValue
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {(mode === 'create' ? canAssignOnCreate : canAssign) && (
              <FormField control={form.control} name="assignedTo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To Employee</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      options={employees.map((employee) => ({
                        value: employee._id,
                        label: `${employee.name} (${employee.employeeId})`,
                      }))}
                      placeholder="Select employee"
                      searchPlaceholder="Search employees..."
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            {mode === 'edit' && canAssign && form.watch('assignedTo') !== (lead?.assignedTo?._id || '') && (
              <FormField control={form.control} name="sharePreviousRemarks" render={({ field }) => (
                <FormItem className="md:col-span-2"><FormLabel className="flex items-center gap-2">
                  <input type="checkbox" checked={field.value ?? false} disabled={isSubmitting} onChange={event => field.onChange(event.target.checked)} />
                  Allow new employee to see all previous remarks
                </FormLabel></FormItem>
              )} />
            )}
            {mode === 'create' && (
              <FormField control={form.control} name="nextFollowUpDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Follow-up Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select next follow-up date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <div className="md:col-span-2">
              <FormField control={form.control} name="initialRemark" render={({ field }) => (
                <FormItem>
                  <FormLabel>{mode === 'create' ? 'Initial Remark' : 'Initial Remark (Locked)'}</FormLabel>
                  <FormControl>
                    <textarea
                      className="crm-input min-h-[80px] w-full resize-y px-3 py-2"
                      placeholder="Initial notes about this lead..."
                      disabled={isSubmitting || mode === 'edit'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
        </FormSection>

        </div>

        <div
          className={cn(
            'flex items-center gap-3',
            isModal && 'shrink-0 border-t border-border/60 bg-background/95 px-0 pt-4 backdrop-blur-sm',
            !isModal && 'pt-1'
          )}
        >
          <Button type="submit" disabled={isSubmitting || !!duplicateLead} className="crm-btn-primary gap-2 rounded-xl px-6">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Lead' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" className="rounded-xl" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
