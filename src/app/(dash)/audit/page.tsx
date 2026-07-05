import { requireAdmin } from '@/lib/auth';
import { getAuditLog } from '@/lib/data/content';
import { PageHeader, Card, EmptyState } from '@/components/ui';
import { dateTime } from '@/lib/format';

export default async function AuditPage() {
  await requireAdmin();
  const rows = await getAuditLog();

  return (
    <div>
      <PageHeader title="Denetim Kaydı" subtitle="Panelden yapılan tüm değişiklikler" />
      <Card>
        {rows.length === 0 ? (
          <EmptyState>Henüz kayıt yok.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Zaman</th>
                <th className="pb-2 font-medium">Admin</th>
                <th className="pb-2 font-medium">İşlem</th>
                <th className="pb-2 font-medium">Hedef</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 text-slate-400">{dateTime(r.created_at)}</td>
                  <td className="py-2 text-slate-600">{r.admin ?? '—'}</td>
                  <td className="py-2 font-medium text-slate-700">{r.action}</td>
                  <td className="py-2 text-slate-500">{r.target_table ?? '—'}{r.target_id ? ` · ${r.target_id.slice(0, 8)}…` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
