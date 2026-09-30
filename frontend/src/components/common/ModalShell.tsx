'use client';

import { LucideIcon } from 'lucide-react';
import { CloseButton } from '@/components/common/CloseButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon: LucideIcon;
  children: React.ReactNode;
  maxWidth?: string;
}

export function ModalShell({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  children,
  maxWidth = 'sm:max-w-lg',
}: ModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'crm-dialog flex max-h-[92vh] flex-col gap-0 p-0',
          maxWidth
        )}
        data-row-click-ignore
        hideCloseButton
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-datepicker-popover]')) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-datepicker-popover]')) {
            e.preventDefault();
          }
        }}
      >
        <div className="relative shrink-0 border-b border-border/60 px-6 py-5 pr-14">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-xl font-bold">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
          <CloseButton
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
