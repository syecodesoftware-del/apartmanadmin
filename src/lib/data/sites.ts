import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getBillingSettings, siteMonthly, effectiveUnitPrice, type SiteRow, type BillingSettings } from './overview';

export type SiteListItem = SiteRow & { userCount: number; monthly: number };

export async function listSites(): Promise<{ sites: SiteListItem[]; settings: BillingSettings }> {
  const db = supabaseAdmin();
  const settings = await getBillingSettings();
  const [{ data: sites }, { data: users }] = await Promise.all([
    db.from('sites').select('id, name, site_code, city, subscription_status, trial_ends_at, billing_unit_price, independent_unit_count, apartment_count, is_individual, created_at').order('created_at', { ascending: false }),
    db.from('users').select('site_id'),
  ]);

  const counts = new Map<string, number>();
  for (const u of (users ?? []) as Array<{ site_id: string | null }>) {
    if (u.site_id) counts.set(u.site_id, (counts.get(u.site_id) ?? 0) + 1);
  }

  const list = ((sites ?? []) as SiteRow[]).map((s) => ({
    ...s,
    userCount: counts.get(s.id) ?? 0,
    monthly: siteMonthly(s, settings),
  }));
  return { sites: list, settings };
}

export type SiteDetail = {
  site: SiteRow & { address: string | null; district: string | null; neighborhood: string | null; street: string | null; building_number: string | null; subscription_start_date: string | null; subscription_end_date: string | null; trial_started_at: string | null };
  settings: BillingSettings;
  effectivePrice: number;
  monthly: number;
  members: Array<{ user_id: string; role: string; approval_status: string; is_active: boolean; full_name: string | null; email: string | null; phone: string | null }>;
  finance: { cariAlacak: number; kasaToplam: number; eslesmeyen: number };
  payments: Array<{ id: string; plan: string | null; amount: number; status: string; paid_at: string | null; period_start: string | null; period_end: string | null; created_at: string | null }>;
  moduleCounts: { announcements: number; complaints: number; bookings: number; polls: number };
};

export async function getSiteDetail(id: string): Promise<SiteDetail | null> {
  const db = supabaseAdmin();
  const settings = await getBillingSettings();

  const { data: site } = await db
    .from('sites')
    .select('id, name, site_code, city, address, district, neighborhood, street, building_number, subscription_status, subscription_start_date, subscription_end_date, trial_started_at, trial_ends_at, billing_unit_price, independent_unit_count, apartment_count, created_at')
    .eq('id', id)
    .single();
  if (!site) return null;

  const [members, balances, cash, recon, payments, annc, cmpl, bkng, poll] = await Promise.all([
    db.from('site_memberships').select('user_id, role, approval_status, is_active, users(full_name, email, phone)').eq('site_id', id),
    db.from('unit_balances').select('toplam_borc').eq('site_id', id),
    db.from('cash_account_balances').select('balance').eq('site_id', id),
    db.from('bank_reconciliation').select('eslesmeyen_sayi').eq('site_id', id),
    db.from('subscription_payments').select('id, plan, amount, status, paid_at, period_start, period_end, created_at').eq('site_id', id).order('created_at', { ascending: false }),
    db.from('announcements').select('id', { count: 'exact', head: true }).eq('site_id', id),
    db.from('complaints').select('id', { count: 'exact', head: true }).eq('site_id', id),
    db.from('bookings').select('id', { count: 'exact', head: true }).eq('site_id', id),
    db.from('polls').select('id', { count: 'exact', head: true }).eq('site_id', id),
  ]);

  const sum = (rows: unknown[], key: string): number =>
    (rows ?? []).reduce<number>((acc, r) => acc + Number((r as Record<string, unknown>)[key] ?? 0), 0);

  return {
    site: site as SiteDetail['site'],
    settings,
    effectivePrice: effectiveUnitPrice(site as SiteRow, settings),
    monthly: siteMonthly(site as SiteRow, settings),
    members: ((members.data ?? []) as unknown as Array<{ user_id: string; role: string; approval_status: string; is_active: boolean; users: { full_name: string | null; email: string | null; phone: string | null } | null }>).map((m) => ({
      user_id: m.user_id,
      role: m.role,
      approval_status: m.approval_status,
      is_active: m.is_active,
      full_name: m.users?.full_name ?? null,
      email: m.users?.email ?? null,
      phone: m.users?.phone ?? null,
    })),
    finance: {
      cariAlacak: sum(balances.data ?? [], 'toplam_borc'),
      kasaToplam: sum(cash.data ?? [], 'balance'),
      eslesmeyen: sum(recon.data ?? [], 'eslesmeyen_sayi'),
    },
    payments: (payments.data ?? []) as SiteDetail['payments'],
    moduleCounts: {
      announcements: annc.count ?? 0,
      complaints: cmpl.count ?? 0,
      bookings: bkng.count ?? 0,
      polls: poll.count ?? 0,
    },
  };
}
