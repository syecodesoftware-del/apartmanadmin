import { requireAdmin } from '@/lib/auth';
import { getContent, type ContentItem } from '@/lib/data/content';
import { PageHeader, Card, EmptyState } from '@/components/ui';
import { DeleteContentButton } from '@/components/DeleteContentButton';
import { date } from '@/lib/format';

export default async function ContentPage() {
  await requireAdmin();
  const c = await getContent();

  return (
    <div>
      <PageHeader title="İçerik Denetimi" subtitle="Tüm sitelerdeki içerikler — kötüye kullanımı kaldırın" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Duyurular" table="announcements" items={c.announcements} />
        <Section title="Şikayetler" table="complaints" items={c.complaints} />
        <Section title="Rezervasyonlar" table="bookings" items={c.bookings} />
        <Section title="Anketler" table="polls" items={c.polls} />
      </div>
    </div>
  );
}

function Section({ title, table, items }: { title: string; table: string; items: ContentItem[] }) {
  return (
    <Card title={`${title} (${items.length})`}>
      {items.length === 0 ? (
        <EmptyState>Kayıt yok.</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">{it.title}</p>
                <p className="text-xs text-slate-400">
                  {it.site}{it.meta ? ` · ${it.meta}` : ''} · {date(it.created_at)}
                </p>
              </div>
              <DeleteContentButton table={table} id={it.id} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
