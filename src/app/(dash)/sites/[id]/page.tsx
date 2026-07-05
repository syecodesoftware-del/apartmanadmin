import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getSiteDetail } from '@/lib/data/sites';
import { PageHeader, Card, StatCard, StatusBadge, Badge, EmptyState } from '@/components/ui';
import { SiteSubscriptionControls } from '@/components/SiteSubscriptionControls';
import { AddPaymentForm } from '@/components/AddPaymentForm';
import { money, date, ROLE_LABEL } from '@/lib/format';

export default async function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const d = await getSiteDetail(id);
  if (!d) notFound();

  const s = d.site;
  const addr = [s.neighborhood, s.street, s.building_number, s.district, s.city].filter(Boolean).join(' ') || s.address || '—';

  return (
    <div>
      <Link href="/sites" className="mb-3 inline-block text-sm text-blue-700 hover:underline">← Siteler</Link>
      <PageHeader
        title={s.name}
        subtitle={`${s.site_code ?? '—'} · ${addr}`}
        action={<StatusBadge status={s.subscription_status} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Bağımsız Bölüm" value={s.independent_unit_count ?? 0} hint={`Beyan: ${s.apartment_count ?? 0} daire`} />
        <StatCard label="Birim Fiyat" value={money(d.effectivePrice)} hint={s.billing_unit_price != null ? 'site override' : 'platform varsayılanı'} />
        <StatCard label="Aylık Ücret" value={money(d.monthly)} tone={d.monthly > 0 ? 'success' : 'default'} />
        <StatCard label="Cari Alacak" value={money(d.finance.cariAlacak, true)} tone={d.finance.cariAlacak > 0 ? 'danger' : 'default'} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="Abonelik" className="lg:col-span-1">
          <dl className="space-y-2 text-sm">
            <Row label="Durum"><StatusBadge status={s.subscription_status} /></Row>
            <Row label="Deneme başlangıç">{date(s.trial_started_at)}</Row>
            <Row label="Deneme bitiş">{date(s.trial_ends_at)}</Row>
            <Row label="Abonelik başlangıç">{date(s.subscription_start_date)}</Row>
            <Row label="Abonelik bitiş">{date(s.subscription_end_date)}</Row>
            <Row label="Oluşturulma">{date(s.created_at)}</Row>
          </dl>
        </Card>

        <Card title="Mali Özet" className="lg:col-span-1">
          <dl className="space-y-2 text-sm">
            <Row label="Cari alacak (borç)">{money(d.finance.cariAlacak, true)}</Row>
            <Row label="Kasa/banka toplam">{money(d.finance.kasaToplam, true)}</Row>
            <Row label="Eşleşmeyen banka hareketi">{d.finance.eslesmeyen}</Row>
          </dl>
        </Card>

        <Card title="Modüller" className="lg:col-span-1">
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">{d.moduleCounts.announcements} duyuru</Badge>
            <Badge tone="amber">{d.moduleCounts.complaints} şikayet</Badge>
            <Badge tone="slate">{d.moduleCounts.bookings} rezervasyon</Badge>
            <Badge tone="slate">{d.moduleCounts.polls} anket</Badge>
          </div>
        </Card>
      </div>

      <Card title="Abonelik Yönetimi" className="mt-4">
        <SiteSubscriptionControls
          siteId={s.id}
          status={s.subscription_status}
          unitPrice={s.billing_unit_price}
          effectivePrice={d.effectivePrice}
        />
      </Card>

      <Card title={`Üyeler (${d.members.length})`} className="mt-4">
        {d.members.length === 0 ? (
          <EmptyState>Üye yok.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Ad</th>
                <th className="pb-2 font-medium">E-posta</th>
                <th className="pb-2 font-medium">Telefon</th>
                <th className="pb-2 font-medium">Rol</th>
                <th className="pb-2 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {d.members.map((m) => (
                <tr key={m.user_id}>
                  <td className="py-2">
                    <Link href={`/users/${m.user_id}`} className="font-medium text-slate-800 hover:text-blue-700">{m.full_name ?? '—'}</Link>
                  </td>
                  <td className="py-2 text-slate-500">{m.email ?? '—'}</td>
                  <td className="py-2 text-slate-500">{m.phone ?? '—'}</td>
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

      <Card title="Abonelik Ödemeleri" className="mt-4">
        {d.payments.length === 0 ? (
          <EmptyState>Abonelik ödemesi kaydı yok.</EmptyState>
        ) : (
          <table className="mb-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Tutar</th>
                <th className="pb-2 font-medium">Durum</th>
                <th className="pb-2 font-medium">Dönem</th>
                <th className="pb-2 text-right font-medium">Ödendi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {d.payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 text-slate-700">{money(p.amount, true)}</td>
                  <td className="py-2 text-slate-500">{p.status}</td>
                  <td className="py-2 text-slate-500">{date(p.period_start)} – {date(p.period_end)}</td>
                  <td className="py-2 text-right text-slate-400">{date(p.paid_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <AddPaymentForm siteId={s.id} />
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{children}</dd>
    </div>
  );
}
