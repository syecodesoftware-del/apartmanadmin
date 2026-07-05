import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { listSites } from '@/lib/data/sites';
import { PageHeader, Card, StatCard, StatusBadge, EmptyState } from '@/components/ui';
import { BillingSettingsForm } from '@/components/BillingSettingsForm';
import { money } from '@/lib/format';

export default async function BillingPage() {
  await requireAdmin();
  const { sites, settings } = await listSites();

  const billable = sites.filter((s) => s.subscription_status === 'trial' || s.subscription_status === 'active');
  const mrr = billable.reduce((sum, s) => sum + s.monthly, 0);
  const activeMrr = sites.filter((s) => s.subscription_status === 'active').reduce((sum, s) => sum + s.monthly, 0);

  return (
    <div>
      <PageHeader title="Faturalama" subtitle="Platform geneli abonelik ve fiyatlandırma" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Tahmini MRR (trial+aktif)" value={money(mrr)} tone={mrr > 0 ? 'success' : 'default'} />
        <StatCard label="Aktif MRR" value={money(activeMrr)} tone={activeMrr > 0 ? 'success' : 'default'} />
        <StatCard label="Varsayılan Birim Fiyat" value={money(settings.default_unit_price)} />
        <StatCard label="Varsayılan Deneme" value={`${settings.default_trial_days} gün`} />
      </div>

      <Card title="Platform Ayarları" className="mt-6">
        <BillingSettingsForm settings={settings} />
      </Card>

      <Card title="Site Bazlı Aylık Ücretler" className="mt-4">
        {sites.length === 0 ? (
          <EmptyState>Site yok.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Site</th>
                <th className="pb-2 font-medium">Durum</th>
                <th className="pb-2 text-center font-medium">Bağımsız Bölüm</th>
                <th className="pb-2 text-right font-medium">Birim Fiyat</th>
                <th className="pb-2 text-right font-medium">Aylık</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sites.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-2.5">
                    <Link href={`/sites/${s.id}`} className="font-medium text-blue-700 hover:underline">{s.name}</Link>
                  </td>
                  <td className="py-2.5"><StatusBadge status={s.subscription_status} /></td>
                  <td className="py-2.5 text-center text-slate-600">{s.independent_unit_count ?? 0}</td>
                  <td className="py-2.5 text-right text-slate-500">{money(s.billing_unit_price ?? settings.default_unit_price)}</td>
                  <td className="py-2.5 text-right font-medium text-slate-700">{money(s.monthly)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
