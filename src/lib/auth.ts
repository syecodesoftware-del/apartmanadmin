import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseAuthServer } from './supabaseServer';
import { supabaseAdmin } from './supabaseAdmin';

export type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
};

/**
 * Geçerli oturumu okur ve kullanıcının role='admin' olduğunu service_role ile DOĞRULAR.
 * Admin değilse null döner. Rol kontrolü her zaman sunucuda, güvenilir kaynaktan yapılır.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const auth = await supabaseAuthServer();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabaseAdmin()
    .from('users')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') return null;
  return { id: profile.id, email: profile.email, fullName: profile.full_name };
}

/** Korumalı sayfalarda kullanılır: admin değilse /login'e yönlendirir. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) redirect('/login');
  return admin;
}
