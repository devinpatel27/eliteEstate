'use client';

import { CRMShell } from '@/components/layout/CRMShell';

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return <CRMShell>{children}</CRMShell>;
}
