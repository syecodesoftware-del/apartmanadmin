import 'server-only';
import { supabaseAdmin } from './supabaseAdmin';

/**
 * Her admin mutasyonunu admin_audit_log'a yazar (kim, ne, hangi kayıt, ne değişti).
 * Audit yazımı asla ana işlemi bozmamalı → hata yutulur, loglanır.
 */
export async function writeAudit(params: {
  adminUserId: string;
  action: string;
  targetTable?: string | null;
  targetId?: string | null;
  payload?: unknown;
}): Promise<void> {
  try {
    await supabaseAdmin().from('admin_audit_log').insert({
      admin_user_id: params.adminUserId,
      action: params.action,
      target_table: params.targetTable ?? null,
      target_id: params.targetId ?? null,
      payload: params.payload ?? null,
    });
  } catch (e) {
    console.error('[audit] yazılamadı:', e);
  }
}
