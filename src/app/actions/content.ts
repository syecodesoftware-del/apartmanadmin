'use server';

import { revalidatePath } from 'next/cache';
import { getAdminUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { writeAudit } from '@/lib/audit';
import type { ActionState } from './sites';

const DELETABLE = ['announcements', 'complaints', 'bookings', 'polls'];

/** İçerik kaydını siler (kötüye kullanım denetimi). Yalnız whitelisted tablolar. */
export async function deleteContent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await getAdminUser();
  if (!admin) return { error: 'Yetkisiz.' };

  const table = String(formData.get('table') ?? '');
  const id = String(formData.get('id') ?? '');
  if (!DELETABLE.includes(table) || !id) return { error: 'Geçersiz silme isteği.' };

  const { error } = await supabaseAdmin().from(table).delete().eq('id', id);
  if (error) return { error: error.message };

  await writeAudit({ adminUserId: admin.id, action: 'content.delete', targetTable: table, targetId: id });
  revalidatePath('/content');
  return { ok: true, message: 'Kayıt silindi.' };
}
