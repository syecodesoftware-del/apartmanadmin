import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PageHeader, Card, StatCard, EmptyState, Badge } from '@/components/ui';

type FeedbackRow = {
  id: string;
  sentiment: string;
  message: string | null;
  platform: string | null;
  app_version: string | null;
  created_at: string;
  users: { full_name: string | null } | null;
  sites: { name: string | null } | null;
};

export default async function FeedbackPage() {
  await requireAdmin();

  const { data } = await supabaseAdmin()
    .from('app_feedback')
    .select('id, sentiment, message, platform, app_version, created_at, users(full_name), sites(name)')
    .order('created_at', { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as FeedbackRow[];

  const negatives = rows.filter((r) => r.sentiment === 'negative');
  const withMessage = negatives.filter((r) => (r.message ?? '').trim().length > 0);

  return (
    <div>
      <PageHeader
        title="Uygulama Geri Bildirimi"
        subtitle="Mağaza yorumuna düşmeden yakalanan memnuniyetsizlikler"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Toplam Kayıt" value={rows.length} />
        <StatCard label="Olumsuz" value={negatives.length} tone={negatives.length > 0 ? 'warning' : 'default'} />
        <StatCard label="Yazılı Şikâyet" value={withMessage.length} tone={withMessage.length > 0 ? 'danger' : 'default'} />
      </div>

      <Card title="Son Geri Bildirimler" className="mt-6">
        {rows.length === 0 ? (
          <EmptyState>Henüz geri bildirim yok.</EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge tone={r.sentiment === 'negative' ? 'red' : 'green'}>
                    {r.sentiment === 'negative' ? 'Olumsuz' : 'Olumlu'}
                  </Badge>
                  <span className="font-medium text-slate-700">{r.users?.full_name ?? 'Bilinmeyen'}</span>
                  {r.sites?.name && <span className="text-slate-400">· {r.sites.name}</span>}
                  <span className="ml-auto text-xs text-slate-400">
                    {new Date(r.created_at).toLocaleString('tr-TR')}
                  </span>
                </div>
                {r.message && <p className="mt-1 text-sm text-slate-600">{r.message}</p>}
                <div className="mt-1 text-xs text-slate-400">
                  {[r.platform, r.app_version && `v${r.app_version}`].filter(Boolean).join(' · ')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
