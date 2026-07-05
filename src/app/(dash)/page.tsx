import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getOverview } from '@/lib/data/overview';
import { PageHeader, StatCard, Card, StatusBadge, EmptyState } from '@/components/ui';
import { money, date, ROLE_LABEL } from '@/lib/format';

export default async function DashboardPage() {
  await requireAdmin();
  const o = await getOverview();

  return (
    <div>
      <PageHeader title="Genel Bakış" subtitle="Platform geneli özet" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Toplam Site" value={o.totals.sites} hint={`${o.totals.trial} deneme · ${o.totals.active} aktif`} />
        <StatCard label="Toplam Kullanıcı" value={o.totals.users} />
        <StatCard label="Toplam Daire" value={o.totals.units} />
        <StatCard label="Tahmini Aylık Gelir (MRR)" value={money(o.totals.mrr)} hint={o.settings.default_unit_price === 0 ? 'Birim fiyat 0 — Faturalama’dan ayarla' : undefined} tone={o.totals.mrr > 0 ? 'success' : 'default'} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ödeme Gecikti" value={o.totals.pastDue} tone={o.totals.pastDue > 0 ? 'danger' : 'default'} />
        <StatCard label="Askıda" value={o.totals.suspended} tone={o.totals.suspended > 0 ? 'warning' : 'default'} />
        <StatCard label="Denemesi Bitenler (7g)" value={o.trialSoon.length} tone={o.trialSoon.length > 0 ? 'warning' : 'default'} />
        <StatCard label="Varsayılan Birim Fiyat" value={money(o.settings.default_unit_price)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Yaklaşan Deneme Bitişleri">
          {o.trialSoon.length === 0 ? (
            <EmptyState>7 gün içinde denemesi biten site yok.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {o.trialSoon.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/sites/${s.id}`} className="font-medium text-blue-700 hover:underline">{s.name}</Link>
                  <span className={s.days < 0 ? 'text-red-600' : 'text-amber-600'}>
                    {s.days < 0 ? `${-s.days} gün geçti` : `${s.days} gün kaldı`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Ödeme Geciken Siteler">
          {o.pastDueSites.length === 0 ? (
            <EmptyState>Ödeme geciken site yok.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {o.pastDueSites.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <Link href={`/sites/${s.id}`} className="font-medium text-blue-700 hover:underline">{s.name}</Link>
                  <StatusBadge status={s.subscription_status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Son Kayıtlar" className="mt-4">
        {o.recentUsers.length === 0 ? (
          <EmptyState>Henüz kayıt yok.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Ad</th>
                <th className="pb-2 font-medium">Site</th>
                <th className="pb-2 font-medium">Rol</th>
                <th className="pb-2 text-right font-medium">Kayıt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {o.recentUsers.map((u) => (
                <tr key={u.id}>
                  <td className="py-2">
                    <Link href={`/users/${u.id}`} className="font-medium text-slate-800 hover:text-blue-700">{u.full_name ?? u.email}</Link>
                  </td>
                  <td className="py-2 text-slate-500">{u.sites?.name ?? '—'}</td>
                  <td className="py-2 text-slate-500">{ROLE_LABEL[u.role] ?? u.role}</td>
                  <td className="py-2 text-right text-slate-400">{date(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
