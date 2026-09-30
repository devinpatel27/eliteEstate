'use client';

import { useEffect } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export function CRMShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('crm-app');
    return () => document.documentElement.classList.remove('crm-app');
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-[100dvh] overflow-hidden crm-shell">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
