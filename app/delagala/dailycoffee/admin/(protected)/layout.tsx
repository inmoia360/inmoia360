import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import AdminShell from '../AdminShell';

export const metadata = { title: 'Admin · Daily Coffee · DELAGALA' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/delagala/dailycoffee/admin/login');

  return <AdminShell>{children}</AdminShell>;
}
