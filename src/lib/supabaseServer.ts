import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from './env';

/**
 * Oturum (auth) istemcisi — publishable/anon anahtarla, çerez tabanlı.
 * Yalnızca admin giriş/oturum doğrulaması için. DB işlemleri service_role ile yapılır.
 */
export async function supabaseAuthServer() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookieOptions: { name: 'sb-admin-auth' },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component'ten çağrıldığında set edilemez; middleware oturumu tazeler.
        }
      },
    },
  });
}
