import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type ContentItem = { id: string; title: string; meta: string; site: string; created_at: string | null };

function siteName(row: { sites?: { name: string } | null }): string {
  return row.sites?.name ?? '—';
}

export async function getContent() {
  const db = supabaseAdmin();
  const [annc, cmpl, bkng, poll] = await Promise.all([
    db.from('announcements').select('id, title, created_at, sites(name)').order('created_at', { ascending: false }).limit(50),
    db.from('complaints').select('id, title, status, created_at, sites(name)').order('created_at', { ascending: false }).limit(50),
    db.from('bookings').select('id, area_name, status, start_datetime, created_at, sites(name)').order('created_at', { ascending: false }).limit(50),
    db.from('polls').select('id, question, is_active, created_at, sites(name)').order('created_at', { ascending: false }).limit(50),
  ]);

  const map = <T extends Record<string, unknown>>(rows: T[] | null, title: (r: T) => string, meta: (r: T) => string): ContentItem[] =>
    (rows ?? []).map((r) => ({
      id: String(r.id),
      title: title(r),
      meta: meta(r),
      site: siteName(r as { sites?: { name: string } | null }),
      created_at: (r.created_at as string) ?? null,
    }));

  type Row = Record<string, unknown>;
  return {
    announcements: map(annc.data as unknown as Row[], (r) => (r.title as string) ?? '—', () => ''),
    complaints: map(cmpl.data as unknown as Row[], (r) => (r.title as string) ?? '—', (r) => (r.status as string) ?? ''),
    bookings: map(bkng.data as unknown as Row[], (r) => (r.area_name as string) ?? '—', (r) => (r.status as string) ?? ''),
    polls: map(poll.data as unknown as Row[], (r) => (r.question as string) ?? '—', (r) => ((r.is_active as boolean) ? 'aktif' : 'kapalı')),
  };
}

export type AuditRow = { id: string; action: string; target_table: string | null; target_id: string | null; created_at: string | null; admin: string | null };

export async function getAuditLog(): Promise<AuditRow[]> {
  const db = supabaseAdmin();
  const { data } = await db
    .from('admin_audit_log')
    .select('id, action, target_table, target_id, created_at, users(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200);

  return ((data ?? []) as unknown as Array<{ id: string; action: string; target_table: string | null; target_id: string | null; created_at: string | null; users: { full_name: string | null; email: string | null } | null }>).map((r) => ({
    id: r.id,
    action: r.action,
    target_table: r.target_table,
    target_id: r.target_id,
    created_at: r.created_at,
    admin: r.users?.full_name ?? r.users?.email ?? null,
  }));
}
