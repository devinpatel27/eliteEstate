import Image from 'next/image';
import { cn } from '@/lib/utils';

export function CompanyLogo({ className }: { className?: string }) {
  return <Image src="/elite-estate-logo.png" alt="Elite Estate — Trust, Quality, Excellence" width={1488} height={3000} className={cn('h-full w-full object-contain', className)} priority />;
}
