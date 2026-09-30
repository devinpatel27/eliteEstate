import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default function CreateRolePage() {
  redirect(ROUTES.ROLES);
}
