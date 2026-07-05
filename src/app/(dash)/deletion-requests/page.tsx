import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PageHeader, Card, EmptyState, Badge } from '@/components/ui';
import { dateTime } from '@/lib/format';
import { DeletionRequestActions } from '@/components/DeletionRequestActions';

export const dynamic = 'force-dynamic';

type Req = {
  id: string;
  site_id: string;
  reason: string | null;
  status: string;
  created_at: string;
  decided_at: string | null;
  decision_note: string | null;
  sites: { name: string | null } | null;
  users: { full_name: string | null } | null;
};

const STATUS: Record<string, { label: string; tone: 'amber' | 'red' | 'slate' | 'green' }> = {
  pending: { label: 'Bekliyor', tone: 'amber' },
  approved: { label: 'Onaylandı (pasif)', tone: 'red' },
  rejected: { label: 'Reddedildi', tone: 'slate' },
  cancelled: { label: 'Geri çekildi', tone: 'slate' },
};

export default async function DeletionRequestsPage() {
  await requireAdmin();
  const db = supabaseAdmin();

  const { data } = await db
    .from('site_deletion_requests')
    .select('id, site_id, reason, status, created_at, decided_at, decision_note, sites(name), users:requested_by(full_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  const all = (data ?? []) as unknown as Req[];
  const pending = all.filter((r) => r.status === 'pending');
  const history = all.filter((r) => r.status !== 'pending');

  return (
    <div>
      <PageHeader title="Site Silme Talepleri" subtitle={`${pending.length} bekleyen talep`} />

      <Card title="Bekleyen Talepler">
        {pending.length === 0 ? (
          <EmptyState>Bekleyen silme talebi yok.</EmptyState>
        ) : (
          <div className="space-y-4">
            {pending.map((r) => (
              <div key={r.id} className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{r.sites?.name ?? '—'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Talep eden: {r.users?.full_name ?? '—'} · {dateTime(r.created_at)}
                  </p>
                  {r.reason && <p className="mt-1 text-sm text-slate-700">Gerekçe: {r.reason}</p>}
                </div>
                <div className="shrink-0">
                  <DeletionRequestActions requestId={r.id} siteName={r.sites?.name ?? 'Site'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6">
        <Card title="Geçmiş">
          {history.length === 0 ? (
            <EmptyState>Henüz sonuçlanmış talep yok.</EmptyState>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">Site</th>
                  <th className="pb-2 font-medium">Durum</th>
                  <th className="pb-2 font-medium">Karar Tarihi</th>
                  <th className="pb-2 font-medium">Not</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((r) => {
                  const st = STATUS[r.status] ?? STATUS.pending;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-medium text-slate-700">{r.sites?.name ?? '—'}</td>
                      <td className="py-2.5"><Badge tone={st.tone}>{st.label}</Badge></td>
                      <td className="py-2.5 text-slate-500">{r.decided_at ? dateTime(r.decided_at) : '—'}</td>
                      <td className="py-2.5 text-slate-500">{r.decision_note ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
