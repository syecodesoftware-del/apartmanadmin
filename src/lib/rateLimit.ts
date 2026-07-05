import 'server-only';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * O5 (KOD-DENETIM-RAPORU-2026-07-02): bellek-içi sayaç serverless'ta instance başına
 * sıfırlandığından etkisizdi. Sayaç artık DB'de (auth_rate_limits + check/clear RPC'leri,
 * service_role ile çağrılır). RPC'ye ulaşılamazsa fail-open (asıl koruma şifre doğrulamasıdır).
 */
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 5 * 60;

/** true = izin var; false = sınır aşıldı. Başarılı girişte clearRateLimit() çağırın. */
export async function checkRateLimit(key: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin().rpc('check_auth_rate_limit', {
      p_key: key, p_max: MAX_ATTEMPTS, p_window_seconds: WINDOW_SECONDS,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}

export async function clearRateLimit(key: string): Promise<void> {
  try {
    await supabaseAdmin().rpc('clear_auth_rate_limit', { p_key: key });
  } catch {
    // sayaç 1 gün içinde kendiliğinden temizlenir
  }
}
