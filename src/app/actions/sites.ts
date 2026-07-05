'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { writeAudit } from '@/lib/audit';
import { friendlyDbMessage } from '@/lib/error';

export type ActionState = { ok?: boolean; error?: string; message?: string };

const VALID_STATUS = ['trial', 'active', 'past_due', 'suspended', 'cancelled'];

/** Sitenin abonelik durumunu değiştirir (trial/active/past_due/suspended/cancelled). */
export async function updateSubscriptionStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };

  const siteId = String(formData.get('siteId') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!siteId || !VALID_STATUS.includes(status)) return { error: 'Geçersiz durum.' };

  const db = supabaseAdmin();
  const patch: Record<string, unknown> = { subscription_status: status };
  // active'e geçişte abonelik başlangıcını işaretle — yalnız boşsa (askı→aktif dönüşünde orijinal tarih korunur)
  if (status === 'active') {
    const { data: cur } = await db.from('sites').select('subscription_start_date').eq('id', siteId).single();
    if (!cur?.subscription_start_date) patch.subscription_start_date = new Date().toISOString();
  }

  const { error } = await db.from('sites').update(patch).eq('id', siteId);
  if (error) return { error: error.message };

  await writeAudit({ adminUserId: admin.id, action: 'site.subscription_status', targetTable: 'sites', targetId: siteId, payload: { status } });
  revalidatePath(`/sites/${siteId}`);
  revalidatePath('/sites');
  revalidatePath('/');
  return { ok: true, message: 'Abonelik durumu güncellendi.' };
}

/** Deneme süresini gün ekleyerek uzatır (mevcut bitiş ya da bugünden itibaren). */
export async function extendTrial(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };

  const siteId = String(formData.get('siteId') ?? '');
  const days = Number(formData.get('days') ?? 0);
  if (!siteId || !Number.isFinite(days) || days <= 0) return { error: 'Geçerli bir gün sayısı girin.' };

  const db = supabaseAdmin();
  const { data: site } = await db.from('sites').select('trial_ends_at').eq('id', siteId).single();
  const base = site?.trial_ends_at ? new Date(site.trial_ends_at as string) : new Date();
  const start = base.getTime() > Date.now() ? base : new Date();
  const next = new Date(start.getTime() + days * 86400000);

  const { error } = await db.from('sites').update({ trial_ends_at: next.toISOString(), subscription_status: 'trial' }).eq('id', siteId);
  if (error) return { error: error.message };

  await writeAudit({ adminUserId: admin.id, action: 'site.extend_trial', targetTable: 'sites', targetId: siteId, payload: { days, trial_ends_at: next.toISOString() } });
  revalidatePath(`/sites/${siteId}`);
  revalidatePath('/');
  return { ok: true, message: `Deneme ${days} gün uzatıldı.` };
}

/** Site bazlı birim fiyat override'ı (boş = platform varsayılanını kullan). */
export async function setUnitPrice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };

  const siteId = String(formData.get('siteId') ?? '');
  const raw = String(formData.get('price') ?? '').trim().replace(',', '.');
  if (!siteId) return { error: 'Site bulunamadı.' };

  let price: number | null = null;
  if (raw !== '') {
    price = Number(raw);
    if (!Number.isFinite(price) || price < 0) return { error: 'Geçerli bir fiyat girin.' };
  }

  const { error } = await supabaseAdmin().from('sites').update({ billing_unit_price: price }).eq('id', siteId);
  if (error) return { error: error.message };

  await writeAudit({ adminUserId: admin.id, action: 'site.set_unit_price', targetTable: 'sites', targetId: siteId, payload: { billing_unit_price: price } });
  revalidatePath(`/sites/${siteId}`);
  revalidatePath('/sites');
  revalidatePath('/');
  return { ok: true, message: price === null ? 'Birim fiyat platform varsayılanına döndürüldü.' : 'Birim fiyat güncellendi.' };
}

/** Site silme talebini ONAYLAR → siteyi pasife alır (soft-delete: deleted_at), aboneliği iptal eder. */
export async function approveSiteDeletion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };

  const requestId = String(formData.get('requestId') ?? '');
  const note = String(formData.get('note') ?? '').trim() || null;
  if (!requestId) return { error: 'Talep bulunamadı.' };

  const db = supabaseAdmin();
  // O9: site soft-delete + talep kapatma tek atomik RPC'de (yarıda kalan durum imkânsız)
  const { data: siteId, error } = await db.rpc('admin_approve_site_deletion', {
    p_request_id: requestId, p_admin_id: admin.id, p_note: note ?? undefined,
  });
  if (error) return { error: friendlyDbMessage(error.message) };

  await writeAudit({ adminUserId: admin.id, action: 'site.deletion_approved', targetTable: 'sites', targetId: String(siteId), payload: { requestId, note } });
  revalidatePath('/deletion-requests');
  revalidatePath('/sites');
  revalidatePath('/');
  return { ok: true, message: 'Site pasife alındı (arşivlendi).' };
}

/** Site silme talebini REDDEDER (site aynen kalır). */
export async function rejectSiteDeletion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };

  const requestId = String(formData.get('requestId') ?? '');
  const note = String(formData.get('note') ?? '').trim() || null;
  if (!requestId) return { error: 'Talep bulunamadı.' };

  const db = supabaseAdmin();
  const { data: req } = await db.from('site_deletion_requests').select('id, site_id, status').eq('id', requestId).maybeSingle();
  if (!req) return { error: 'Talep bulunamadı.' };
  if (req.status !== 'pending') return { error: 'Bu talep zaten sonuçlanmış.' };

  const { error } = await db
    .from('site_deletion_requests')
    .update({ status: 'rejected', decided_by: admin.id, decided_at: new Date().toISOString(), decision_note: note })
    .eq('id', requestId);
  if (error) return { error: error.message };

  await writeAudit({ adminUserId: admin.id, action: 'site.deletion_rejected', targetTable: 'site_deletion_requests', targetId: requestId, payload: { siteId: req.site_id, note } });
  revalidatePath('/deletion-requests');
  return { ok: true, message: 'Talep reddedildi.' };
}
