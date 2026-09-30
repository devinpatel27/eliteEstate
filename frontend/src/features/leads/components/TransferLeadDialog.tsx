'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowLeftRight } from 'lucide-react';
import { ModalShell } from '@/components/common/ModalShell';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { transferLeadSchema, TransferLeadFormValues } from '../schemas/lead.schema';
import { employeeService } from '@/features/employees/services/employee.service';
import { Employee } from '@/features/employees/types/employee.types';

interface TransferLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAssigneeId?: string;
  onSubmit: (data: TransferLeadFormValues) => Promise<void>;
}

export function TransferLeadDialog({ open, onOpenChange, currentAssigneeId, onSubmit }: TransferLeadDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);

  const form = useForm<TransferLeadFormValues>({
    resolver: zodResolver(transferLeadSchema),
    defaultValues: { assignedTo: '', transferRemark: '' },
  });

  useEffect(() => {
    if (open) {
      employeeService.list({ status: 'active', limit: 100 }).then((res) => {
        if (res.success) setEmployees((res.data || []).filter((e) => e._id !== currentAssigneeId));
      });
    }
  }, [open, currentAssigneeId]);

  const handleSubmit = async (values: TransferLeadFormValues) => {
    await onSubmit(values);
    form.reset();
    onOpenChange(false);
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Transfer Lead"
      description="Assign this lead to another employee"
      icon={ArrowLeftRight}
      maxWidth="sm:max-w-md"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField control={form.control} name="assignedTo" render={({ field }) => (
            <FormItem>
              <FormLabel>Transfer To <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <SearchableSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  options={employees.map((e) => ({
                    value: e._id,
                    label: `${e.name} (${e.employeeId})`,
                  }))}
                  placeholder="Select employee"
                  searchPlaceholder="Search employees..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="transferRemark" render={({ field }) => (
            <FormItem>
              <FormLabel>Transfer Remark <span className="text-destructive">*</span></FormLabel>
              <FormControl><textarea className="crm-input min-h-[70px] w-full resize-y px-3 py-2" placeholder="Reason for transfer..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="crm-btn-primary flex-1 gap-2" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Transfer Lead
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
