'use server';

import { redirect } from 'next/navigation';
import { supabaseAuthServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit, clearRateLimit } from '@/lib/rateLimit';

export type LoginState = { error?: string };

/** E-posta/şifre ile giriş; yalnız role='admin' kullanıcılar kabul edilir. */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'E-posta ve şifre gerekli.' };

  if (!(await checkRateLimit(`login:${email.toLowerCase()}`))) {
    return { error: 'Çok fazla deneme. Lütfen birkaç dakika sonra tekrar deneyin.' };
  }

  const auth = await supabaseAuthServer();
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: 'E-posta veya şifre hatalı.' };

  // Rol doğrulaması — güvenilir kaynak (service_role)
  const { data: profile } = await supabaseAdmin()
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    await auth.auth.signOut();
    return { error: 'Bu hesabın admin paneline erişim yetkisi yok.' };
  }

  await clearRateLimit(`login:${email.toLowerCase()}`);
  redirect('/');
}

export async function logout() {
  const auth = await supabaseAuthServer();
  await auth.auth.signOut();
  redirect('/login');
}
