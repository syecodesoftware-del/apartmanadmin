'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { writeAudit } from '@/lib/audit';
import type { ActionState } from './sites';

/** Platform geneli faturalama ayarları (varsayılan deneme gün, birim fiyat, para birimi, periyot). */
export async function updateBillingSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };

  const trialDays = Number(formData.get('trialDays') ?? 0);
  const unitPrice = Number(String(formData.get('unitPrice') ?? '0').replace(',', '.'));
  const currency = String(formData.get('currency') ?? 'TRY').trim() || 'TRY';
  const period = String(formData.get('period') ?? 'monthly').trim() || 'monthly';
  if (!Number.isFinite(trialDays) || trialDays < 0) return { error: 'Geçerli deneme gün sayısı girin.' };
  if (!Number.isFinite(unitPrice) || unitPrice < 0) return { error: 'Geçerli birim fiyat girin.' };

  const { error } = await supabaseAdmin()
    .from('platform_billing_settings')
    .update({ default_trial_days: trialDays, default_unit_price: unitPrice, currency, billing_period: period, updated_at: new Date().toISOString() })
    .eq('id', true);
  if (error) return { error: error.message };

  await writeAudit({ adminUserId: admin.id, action: 'billing.update_settings', targetTable: 'platform_billing_settings', payload: { trialDays, unitPrice, currency, period } });
  revalidatePath('/billing');
  revalidatePath('/');
  return { ok: true, message: 'Faturalama ayarları kaydedildi.' };
}

/** Bir siteye manuel abonelik ödemesi kaydı ekler. */
export async function addSubscriptionPayment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };

  const siteId = String(formData.get('siteId') ?? '');
  const amount = Number(String(formData.get('amount') ?? '0').replace(',', '.'));
  const status = String(formData.get('status') ?? 'paid');
  const periodStart = String(formData.get('periodStart') ?? '') || null;
  const periodEnd = String(formData.get('periodEnd') ?? '') || null;
  if (!siteId) return { error: 'Site bulunamadı.' };
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Geçerli tutar girin.' };

  const { error } = await supabaseAdmin().from('subscription_payments').insert({
    site_id: siteId,
    amount,
    status,
    period_start: periodStart,
    period_end: periodEnd,
    paid_at: status === 'paid' ? new Date().toISOString() : null,
  });
  if (error) return { error: error.message };

  await writeAudit({ adminUserId: admin.id, action: 'billing.add_payment', targetTable: 'subscription_payments', targetId: siteId, payload: { amount, status, periodStart, periodEnd } });
  revalidatePath(`/sites/${siteId}`);
  revalidatePath('/billing');
  return { ok: true, message: 'Ödeme kaydı eklendi.' };
}
