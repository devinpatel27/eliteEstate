import dynamic from 'next/dynamic';
import { TablePageSkeleton } from '@/components/common/PageSkeletons';

const ForcePasswordChangeForm = dynamic(
  () =>
    import('@/features/auth/components/ForcePasswordChangeForm').then((m) => ({
      default: m.ForcePasswordChangeForm,
    })),
  { loading: () => <TablePageSkeleton /> }
);

export const metadata = {
  title: 'Set New Password — Elite Estate CRM',
};

export default function ChangePasswordPage() {
  return <ForcePasswordChangeForm />;
}
