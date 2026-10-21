'use client';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
export function CopyPhoneButton({ number }: { number?: string }) {
  return <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={!number} aria-label="Copy phone number" onClick={async () => {
    try { await navigator.clipboard.writeText(number!); toast.success('Number copied'); }
    catch { toast.error('Could not copy number'); }
  }}><Copy className="h-3.5 w-3.5" /></Button>;
}
