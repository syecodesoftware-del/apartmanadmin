import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { listSites } from '@/lib/data/sites';
import { PageHeader, Card, StatusBadge, EmptyState, Badge } from '@/components/ui';
import { money, date } from '@/lib/format';

export default async function SitesPage() {
  await requireAdmin();
  const { sites } = await listSites();

  return (
    <div>
      <PageHeader title="Siteler" subtitle={`${sites.length} site`} />
      <Card>
        {sites.length === 0 ? (
          <EmptyState>Henüz site yok.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Site</th>
                <th className="pb-2 font-medium">Kod</th>
                <th className="pb-2 font-medium">Şehir</th>
                <th className="pb-2 text-center font-medium">Kullanıcı</th>
                <th className="pb-2 text-center font-medium">Daire</th>
                <th className="pb-2 font-medium">Durum</th>
                <th className="pb-2 text-right font-medium">Aylık</th>
                <th className="pb-2 text-right font-medium">Deneme Bitiş</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sites.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-2.5">
                    <Link href={`/sites/${s.id}`} className="font-medium text-blue-700 hover:underline">{s.name}</Link>
                    {s.is_individual && <span className="ml-2 align-middle"><Badge tone="blue">Bireysel</Badge></span>}
                  </td>
                  <td className="py-2.5 text-slate-500">{s.site_code ?? '—'}</td>
                  <td className="py-2.5 text-slate-500">{s.city ?? '—'}</td>
                  <td className="py-2.5 text-center text-slate-600">{s.userCount}</td>
                  <td className="py-2.5 text-center text-slate-600">{s.independent_unit_count ?? s.apartment_count ?? 0}</td>
                  <td className="py-2.5"><StatusBadge status={s.subscription_status} /></td>
                  <td className="py-2.5 text-right text-slate-600">{money(s.monthly)}</td>
                  <td className="py-2.5 text-right text-slate-400">{date(s.trial_ends_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
