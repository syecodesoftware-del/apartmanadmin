import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type CompanyListItem = {
  id: string;
  name: string;
  vkn: string | null;
  is_active: boolean;
  created_at: string | null;
  memberCount: number;
  siteCount: number;
};

/** Platform genelindeki tüm yönetim firmaları + üye/site sayıları (service_role, salt-okunur). */
export async function listCompanies(): Promise<{ companies: CompanyListItem[] }> {
  const db = supabaseAdmin();
  const [{ data: companies }, { data: members }, { data: sites }] = await Promise.all([
    db.from('companies').select('id, name, vkn, is_active, created_at').order('created_at', { ascending: false }),
    db.from('company_memberships').select('company_id').eq('is_active', true),
    db.from('sites').select('company_id').not('company_id', 'is', null).is('deleted_at', null),
  ]);

  const memberCounts = new Map<string, number>();
  for (const m of (members ?? []) as Array<{ company_id: string }>) {
    memberCounts.set(m.company_id, (memberCounts.get(m.company_id) ?? 0) + 1);
  }
  const siteCounts = new Map<string, number>();
  for (const s of (sites ?? []) as Array<{ company_id: string | null }>) {
    if (s.company_id) siteCounts.set(s.company_id, (siteCounts.get(s.company_id) ?? 0) + 1);
  }

  const list = ((companies ?? []) as Array<{ id: string; name: string; vkn: string | null; is_active: boolean; created_at: string | null }>).map((c) => ({
    ...c,
    memberCount: memberCounts.get(c.id) ?? 0,
    siteCount: siteCounts.get(c.id) ?? 0,
  }));

  return { companies: list };
}
