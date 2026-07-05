import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * service_role istemcisi — RLS'i BYPASS eder, tüm siteleri okur/yazar.
 * YALNIZCA sunucu tarafında kullanılır (Server Component / Server Action / Route Handler).
 * Bu modül 'server-only' ile işaretli; istemci bundle'ına dahil edilirse build hata verir.
 */
let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
