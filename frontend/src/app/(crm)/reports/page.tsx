import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function ReportsPage() {
  redirect(ROUTES.REPORTS_OVERVIEW);
}
