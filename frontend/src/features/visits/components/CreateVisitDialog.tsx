'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin } from 'lucide-react';
import { ModalShell } from '@/components/common/ModalShell';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/common/DatePicker';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { visitService } from '../services/visit.service';
import { leadService } from '@/features/leads/services/lead.service';
import { Lead } from '@/features/leads/types/lead.types';
import { VISIT_TYPES } from '@/lib/constants';
import { toast } from 'sonner';

const schema = z.object({
  leadId: z.string().min(1, 'Lead is required'),
  type: z.enum(['property_visit', 'site_visit', 'revisit']),
  scheduledDate: z.string().min(1, 'Date is required'),
  scheduledTime: z.string().optional(),
  remark: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateVisitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateVisitDialog({ open, onOpenChange, onSuccess }: CreateVisitDialogProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      leadId: '',
      type: 'property_visit',
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: '',
      remark: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    setLoadingLeads(true);
    leadService
      .list({ limit: 100, page: 1 })
      .then((res) => {
        if (res.success) setLeads(res.data || []);
      })
      .catch(() => toast.error('Failed to load leads'))
      .finally(() => setLoadingLeads(false));
  }, [open]);

  const onSubmit = async (values: FormValues) => {
    try {
      await visitService.create(values);
      toast.success('Visit created');
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || 'Failed to create visit');
    }
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Schedule Visit"
      description="Create a visit manually for an assigned lead"
      icon={MapPin}
      maxWidth="sm:max-w-md"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="leadId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={leads.map((lead) => ({
                      value: lead._id,
                      label: `${lead.customerName} (${lead.leadId})`,
                    }))}
                    placeholder={loadingLeads ? 'Loading leads...' : 'Select lead'}
                    searchPlaceholder="Search lead..."
                    disabled={loadingLeads}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visit Type <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={VISIT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                    placeholder="Select type"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scheduled Date <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} placeholder="Select date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="scheduledTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input className="crm-input" placeholder="e.g. 10:30 AM" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="remark"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remark</FormLabel>
                <FormControl>
                  <textarea
                    className="crm-input min-h-[70px] w-full resize-y px-3 py-2"
                    placeholder="Visit notes..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="crm-btn-primary flex-1 gap-2" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Visit
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </ModalShell>
  );
}
