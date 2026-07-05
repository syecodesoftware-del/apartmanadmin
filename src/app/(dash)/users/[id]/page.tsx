import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getUserDetail } from '@/lib/data/users';
import { PageHeader, Card, Badge, EmptyState } from '@/components/ui';
import { UserControls } from '@/components/UserControls';
import { date, ROLE_LABEL } from '@/lib/format';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const u = await getUserDetail(id);
  if (!u) notFound();

  return (
    <div>
      <Link href="/users" className="mb-3 inline-block text-sm text-blue-700 hover:underline">← Kullanıcılar</Link>
      <PageHeader
        title={u.full_name ?? u.email}
        subtitle={u.email}
        action={u.is_active && u.approval_status === 'approved' ? <Badge tone="green">Aktif</Badge> : <Badge tone="slate">{u.approval_status}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Profil" className="lg:col-span-2">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <Row label="Telefon">{u.phone ?? '—'}</Row>
            <Row label="T.C. Kimlik">{u.tc_kimlik ?? '—'}</Row>
            <Row label="Aktif Site">{u.activeSiteName ?? '—'}</Row>
            <Row label="Rol">{ROLE_LABEL[u.role] ?? u.role}</Row>
            <Row label="Blok / Daire">{[u.block, u.apartment_number].filter(Boolean).join(' / ') || '—'}</Row>
            <Row label="Kat">{u.floor ?? '—'}</Row>
            <Row label="Kayıt">{date(u.created_at)}</Row>
          </dl>
        </Card>

        <Card title="Yönetim" className="lg:col-span-1">
          <UserControls
            userId={u.id}
            email={u.email}
            role={u.role}
            approval={u.approval_status}
            isActive={u.is_active}
            isSelf={u.id === admin.id}
          />
        </Card>
      </div>

      <Card title={`Üyelikler (${u.memberships.length})`} className="mt-4">
        {u.memberships.length === 0 ? (
          <EmptyState>Üyelik kaydı yok.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Site</th>
                <th className="pb-2 font-medium">Rol</th>
                <th className="pb-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {u.memberships.map((m) => (
                <tr key={m.site_id}>
                  <td className="py-2">
                    <Link href={`/sites/${m.site_id}`} className="font-medium text-blue-700 hover:underline">{m.site_name}</Link>
                  </td>
                  <td className="py-2 text-slate-500">{ROLE_LABEL[m.role] ?? m.role}</td>
                  <td className="py-2">
                    {m.is_active && m.approval_status === 'approved'
                      ? <Badge tone="green">Aktif</Badge>
                      : <Badge tone="slate">{m.approval_status}</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800">{children}</dd>
    </div>
  );
}
