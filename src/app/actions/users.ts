'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { writeAudit } from '@/lib/audit';
import type { ActionState } from './sites';

const VALID_ROLES = ['resident', 'manager', 'accountant', 'auditor', 'admin'];
const VALID_APPROVAL = ['pending', 'approved', 'rejected'];

export async function setUserRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };
  const userId = String(formData.get('userId') ?? '');
  const role = String(formData.get('role') ?? '');
  if (!userId || !VALID_ROLES.includes(role)) return { error: 'Geçersiz rol.' };

  const { error } = await supabaseAdmin().from('users').update({ role }).eq('id', userId);
  if (error) return { error: error.message };
  await writeAudit({ adminUserId: admin.id, action: 'user.set_role', targetTable: 'users', targetId: userId, payload: { role } });
  revalidatePath(`/users/${userId}`);
  revalidatePath('/users');
  return { ok: true, message: 'Rol güncellendi.' };
}

export async function setUserApproval(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };
  const userId = String(formData.get('userId') ?? '');
  const approval = String(formData.get('approval') ?? '');
  if (!userId || !VALID_APPROVAL.includes(approval)) return { error: 'Geçersiz onay durumu.' };

  const patch: Record<string, unknown> = { approval_status: approval };
  if (approval === 'approved') patch.is_active = true;
  const { error } = await supabaseAdmin().from('users').update(patch).eq('id', userId);
  if (error) return { error: error.message };
  await writeAudit({ adminUserId: admin.id, action: 'user.set_approval', targetTable: 'users', targetId: userId, payload: { approval } });
  revalidatePath(`/users/${userId}`);
  revalidatePath('/users');
  return { ok: true, message: 'Onay durumu güncellendi.' };
}

export async function toggleUserActive(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };
  const userId = String(formData.get('userId') ?? '');
  const next = String(formData.get('active') ?? '') === 'true';
  if (!userId) return { error: 'Kullanıcı bulunamadı.' };

  const { error } = await supabaseAdmin().from('users').update({ is_active: next }).eq('id', userId);
  if (error) return { error: error.message };
  await writeAudit({ adminUserId: admin.id, action: 'user.toggle_active', targetTable: 'users', targetId: userId, payload: { is_active: next } });
  revalidatePath(`/users/${userId}`);
  revalidatePath('/users');
  return { ok: true, message: next ? 'Hesap aktifleştirildi.' : 'Hesap pasifleştirildi.' };
}

/** Şifre sıfırlama (recovery) bağlantısı üretir; admin kullanıcıya iletir. */
export async function generateRecoveryLink(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };
  const userId = String(formData.get('userId') ?? '');
  const email = String(formData.get('email') ?? '');
  if (!email) return { error: 'E-posta bulunamadı.' };

  const { data, error } = await supabaseAdmin().auth.admin.generateLink({ type: 'recovery', email });
  if (error) return { error: error.message };
  await writeAudit({ adminUserId: admin.id, action: 'user.recovery_link', targetTable: 'users', targetId: userId });
  return { ok: true, message: data.properties?.action_link ?? 'Bağlantı üretildi.' };
}

/** Hesabı kalıcı siler (auth + cascade). Dikkat: geri alınamaz. */
export async function deleteUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };
  const userId = String(formData.get('userId') ?? '');
  if (!userId) return { error: 'Kullanıcı bulunamadı.' };
  if (userId === admin.id) return { error: 'Kendi hesabınızı silemezsiniz.' };

  const { error } = await supabaseAdmin().auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  await writeAudit({ adminUserId: admin.id, action: 'user.delete', targetTable: 'users', targetId: userId });
  revalidatePath('/users');
  return { ok: true, message: 'Hesap silindi.' };
}
