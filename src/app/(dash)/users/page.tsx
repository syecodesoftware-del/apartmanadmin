import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { listUsers } from '@/lib/data/users';
import { PageHeader, Card, Badge, EmptyState } from '@/components/ui';
import { date, ROLE_LABEL } from '@/lib/format';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; approval?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const users = await listUsers({ q: sp.q, role: sp.role, approval: sp.approval });

  return (
    <div>
      <PageHeader title="Kullanıcılar" subtitle={`${users.length} kayıt`} />

      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-2" method="get">
          <div className="flex-1 min-w-48">
            <label className="mb-1 block text-xs font-medium text-slate-500">Ara (ad / e-posta / telefon)</label>
            <input name="q" defaultValue={sp.q ?? ''} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Rol</label>
            <select name="role" defaultValue={sp.role ?? ''} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">Hepsi</option>
              <option value="resident">Sakin</option>
              <option value="manager">Yönetici</option>
              <option value="accountant">Muhasebeci</option>
              <option value="auditor">Denetçi</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Onay</label>
            <select name="approval" defaultValue={sp.approval ?? ''} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">Hepsi</option>
              <option value="pending">Bekliyor</option>
              <option value="approved">Onaylı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
          <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">Filtrele</button>
          <Link href="/users" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Temizle</Link>
        </form>
      </Card>

      <Card>
        {users.length === 0 ? (
          <EmptyState>Sonuç yok.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Ad</th>
                <th className="pb-2 font-medium">E-posta</th>
                <th className="pb-2 font-medium">Site</th>
                <th className="pb-2 font-medium">Rol</th>
                <th className="pb-2 font-medium">Durum</th>
                <th className="pb-2 text-right font-medium">Kayıt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-2.5">
                    <Link href={`/users/${u.id}`} className="font-medium text-blue-700 hover:underline">{u.full_name ?? '—'}</Link>
                  </td>
                  <td className="py-2.5 text-slate-500">{u.email}</td>
                  <td className="py-2.5 text-slate-500">{u.site?.name ?? '—'}</td>
                  <td className="py-2.5 text-slate-500">{ROLE_LABEL[u.role] ?? u.role}</td>
                  <td className="py-2.5">
                    {u.is_active && u.approval_status === 'approved'
                      ? <Badge tone="green">Aktif</Badge>
                      : u.approval_status === 'pending'
                        ? <Badge tone="amber">Bekliyor</Badge>
                        : <Badge tone="slate">{u.approval_status}</Badge>}
                  </td>
                  <td className="py-2.5 text-right text-slate-400">{date(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
