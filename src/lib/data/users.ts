import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type UserListItem = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: string;
  approval_status: string;
  is_active: boolean;
  created_at: string | null;
  site: { name: string } | null;
};

export type UserFilters = { q?: string; role?: string; approval?: string };

export async function listUsers(filters: UserFilters): Promise<UserListItem[]> {
  let query = supabaseAdmin()
    .from('users')
    .select('id, full_name, email, phone, role, approval_status, is_active, created_at, sites(name)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters.role) query = query.eq('role', filters.role);
  if (filters.approval) query = query.eq('approval_status', filters.approval);
  if (filters.q) {
    const q = `%${filters.q}%`;
    query = query.or(`full_name.ilike.${q},email.ilike.${q},phone.ilike.${q}`);
  }

  const { data } = await query;
  return ((data ?? []) as unknown as Array<Omit<UserListItem, 'site'> & { sites: { name: string } | null }>).map((u) => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    approval_status: u.approval_status,
    is_active: u.is_active,
    created_at: u.created_at,
    site: u.sites,
  }));
}

export type UserDetail = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: string;
  approval_status: string;
  is_active: boolean;
  tc_kimlik: string | null;
  block: string | null;
  apartment_number: string | null;
  floor: number | null;
  site_id: string | null;
  created_at: string | null;
  activeSiteName: string | null;
  memberships: Array<{ site_id: string; site_name: string; role: string; approval_status: string; is_active: boolean }>;
};

export async function getUserDetail(id: string): Promise<UserDetail | null> {
  const db = supabaseAdmin();
  const { data: u } = await db
    .from('users')
    .select('id, full_name, email, phone, role, approval_status, is_active, tc_kimlik, block, apartment_number, floor, site_id, created_at, sites(name)')
    .eq('id', id)
    .single();
  if (!u) return null;

  const { data: mem } = await db
    .from('site_memberships')
    .select('site_id, role, approval_status, is_active, sites(name)')
    .eq('user_id', id);

  const user = u as unknown as { sites: { name: string } | null } & Omit<UserDetail, 'activeSiteName' | 'memberships'>;
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    approval_status: user.approval_status,
    is_active: user.is_active,
    tc_kimlik: user.tc_kimlik,
    block: user.block,
    apartment_number: user.apartment_number,
    floor: user.floor,
    site_id: user.site_id,
    created_at: user.created_at,
    activeSiteName: user.sites?.name ?? null,
    memberships: ((mem ?? []) as unknown as Array<{ site_id: string; role: string; approval_status: string; is_active: boolean; sites: { name: string } | null }>).map((m) => ({
      site_id: m.site_id,
      site_name: m.sites?.name ?? '—',
      role: m.role,
      approval_status: m.approval_status,
      is_active: m.is_active,
    })),
  };
}
