import { requireAdmin } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';
import { LogoutButton } from '@/components/LogoutButton';

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div />
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{admin.email}</span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
