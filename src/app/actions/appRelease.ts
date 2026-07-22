'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { writeAudit } from '@/lib/audit';
import type { ActionState } from './sites';

const PLATFORMS = ['ios', 'android'] as const;
type Platform = (typeof PLATFORMS)[number];

/** "1.2.3" biçimini kabaca doğrula (1-4 sayısal parça). */
function isVersionLike(v: string): boolean {
  return /^\d+(\.\d+){0,3}$/.test(v.trim());
}

/**
 * Mobil zorunlu/opsiyonel güncelleme eşiklerini günceller (platform başına).
 * Yeni bir mağaza sürümü yayınlarken min_supported_version yükseltilir → eski sürümler kapıda bloklanır.
 */
export async function updateAppRelease(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };

  const platform = String(formData.get('platform') ?? '') as Platform;
  if (!PLATFORMS.includes(platform)) return { error: 'Geçersiz platform.' };

  const minVersion = String(formData.get('minVersion') ?? '').trim();
  const latestVersion = String(formData.get('latestVersion') ?? '').trim();
  const storeUrl = String(formData.get('storeUrl') ?? '').trim();
  const forceMessage = String(formData.get('forceMessage') ?? '').trim();
  const softMessage = String(formData.get('softMessage') ?? '').trim();

  if (!isVersionLike(minVersion)) return { error: 'Zorunlu (min) sürüm 1.2.3 biçiminde olmalı.' };
  if (!isVersionLike(latestVersion)) return { error: 'Güncel sürüm 1.2.3 biçiminde olmalı.' };
  if (storeUrl && !/^https?:\/\//.test(storeUrl)) return { error: 'Mağaza bağlantısı http(s) ile başlamalı.' };

  const patch: Record<string, unknown> = {
    min_supported_version: minVersion,
    latest_version: latestVersion,
    store_url: storeUrl,
  };
  if (forceMessage) patch.force_message = forceMessage;
  if (softMessage) patch.soft_message = softMessage;

  const { error } = await supabaseAdmin()
    .from('app_release_config')
    .update(patch)
    .eq('platform', platform);
  if (error) return { error: error.message };

  await writeAudit({
    adminUserId: admin.id,
    action: 'app_release.update',
    targetTable: 'app_release_config',
    targetId: platform,
    payload: { minVersion, latestVersion, storeUrl },
  });
  revalidatePath('/app-release');
  return { ok: true, message: `${platform === 'ios' ? 'iOS' : 'Android'} sürüm ayarları kaydedildi.` };
}
