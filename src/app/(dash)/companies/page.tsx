import { requireAdmin } from '@/lib/auth';
import { listCompanies } from '@/lib/data/companies';
import { PageHeader, Card, EmptyState, Badge } from '@/components/ui';
import { date } from '@/lib/format';

export default async function CompaniesPage() {
  await requireAdmin();
  const { companies } = await listCompanies();

  const totalSites = companies.reduce((a, c) => a + c.siteCount, 0);

  return (
    <div>
      <PageHeader
        title="Firmalar"
        subtitle={`${companies.length} yönetim firması · ${totalSites} bağlı site`}
      />
      <Card>
        {companies.length === 0 ? (
          <EmptyState>Henüz yönetim firması oluşturulmamış.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Firma</th>
                <th className="pb-2 font-medium">VKN / TCKN</th>
                <th className="pb-2 text-center font-medium">Üye</th>
                <th className="pb-2 text-center font-medium">Site</th>
                <th className="pb-2 font-medium">Durum</th>
                <th className="pb-2 text-right font-medium">Oluşturma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="py-2.5 font-medium text-slate-800">{c.name}</td>
                  <td className="py-2.5 text-slate-500">{c.vkn ?? '—'}</td>
                  <td className="py-2.5 text-center text-slate-600">{c.memberCount}</td>
                  <td className="py-2.5 text-center text-slate-600">{c.siteCount}</td>
                  <td className="py-2.5">
                    {c.is_active ? <Badge tone="green">Aktif</Badge> : <Badge tone="slate">Pasif</Badge>}
                  </td>
                  <td className="py-2.5 text-right text-slate-400">{date(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
