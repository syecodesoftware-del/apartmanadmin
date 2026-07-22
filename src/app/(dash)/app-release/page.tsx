import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PageHeader, Card, EmptyState } from '@/components/ui';
import { AppReleaseForm, type AppReleaseRow } from '@/components/AppReleaseForm';

export default async function AppReleasePage() {
  await requireAdmin();

  const { data } = await supabaseAdmin()
    .from('app_release_config')
    .select('platform, min_supported_version, latest_version, store_url, force_message, soft_message, updated_at')
    .order('platform');
  const rows = (data ?? []) as AppReleaseRow[];

  const label = (p: string) => (p === 'ios' ? 'iOS (App Store)' : p === 'android' ? 'Android (Play Store)' : p);

  return (
    <div>
      <PageHeader
        title="Mobil Sürüm Yönetimi"
        subtitle="Zorunlu güncelleme kapısı — eski/bozuk sürümleri kullanım dışı bırakın"
      />

      <Card className="mt-2 mb-4" title="Nasıl çalışır?">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li><strong>Zorunlu (min) sürüm:</strong> Kullanıcının yüklü sürümü bunun altındaysa uygulama açılışta kapatılamaz bir “Güncelle” ekranı gösterir.</li>
          <li><strong>Güncel sürüm:</strong> Yüklü sürüm min’in üstünde ama bunun altındaysa atlanabilir bir öneri gösterilir.</li>
          <li>Yeni bir mağaza sürümü yayınladıktan sonra <strong>min’i o sürüme çekin</strong> ki eski sürümde kalanlar zorunlu güncellensin.</li>
        </ul>
      </Card>

      {rows.length === 0 ? (
        <EmptyState>Sürüm yapılandırması bulunamadı.</EmptyState>
      ) : (
        rows.map((row) => (
          <Card key={row.platform} title={label(row.platform)} className="mb-4">
            <AppReleaseForm row={row} />
          </Card>
        ))
      )}
    </div>
  );
}
