import 'server-only';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type SiteRow = {
  id: string;
  name: string;
  site_code: string | null;
  city: string | null;
  subscription_status: string;
  trial_ends_at: string | null;
  billing_unit_price: number | null;
  independent_unit_count: number | null;
  apartment_count: number | null;
  is_individual?: boolean | null;
  created_at: string | null;
};

export type BillingSettings = {
  default_unit_price: number;
  default_trial_days: number;
  currency: string;
  billing_period: string;
};

/** Bir sitenin geçerli birim fiyatı: site override varsa o, yoksa platform varsayılanı. */
export function effectiveUnitPrice(site: SiteRow, settings: BillingSettings): number {
  return Number(site.billing_unit_price ?? settings.default_unit_price ?? 0);
}

/** Sitenin tahmini aylık ücreti = birim fiyat × bağımsız bölüm sayısı. */
export function siteMonthly(site: SiteRow, settings: BillingSettings): number {
  return effectiveUnitPrice(site, settings) * Number(site.independent_unit_count ?? 0);
}

export async function getBillingSettings(): Promise<BillingSettings> {
  const { data } = await supabaseAdmin()
    .from('platform_billing_settings')
    .select('default_unit_price, default_trial_days, currency, billing_period')
    .limit(1)
    .single();
  return {
    default_unit_price: Number(data?.default_unit_price ?? 0),
    default_trial_days: Number(data?.default_trial_days ?? 0),
    currency: data?.currency ?? 'TRY',
    billing_period: data?.billing_period ?? 'monthly',
  };
}

export async function getOverview() {
  const db = supabaseAdmin();
  const settings = await getBillingSettings();

  const [{ data: sites }, usersCount, unitsCount, { data: recentUsers }] = await Promise.all([
    db.from('sites').select('id, name, site_code, city, subscription_status, trial_ends_at, billing_unit_price, independent_unit_count, apartment_count, created_at'),
    db.from('users').select('id', { count: 'exact', head: true }),
    db.from('units').select('id', { count: 'exact', head: true }),
    db.from('users').select('id, full_name, email, role, created_at, site_id, sites(name)').order('created_at', { ascending: false }).limit(8),
  ]);

  const siteList = (sites ?? []) as SiteRow[];
  const byStatus = (s: string) => siteList.filter((x) => x.subscription_status === s).length;

  const mrr = siteList
    .filter((s) => s.subscription_status === 'trial' || s.subscription_status === 'active')
    .reduce((sum, s) => sum + siteMonthly(s, settings), 0);

  // 7 gün içinde denemesi bitecek siteler
  const now = Date.now();
  const soon = siteList
    .filter((s) => s.subscription_status === 'trial' && s.trial_ends_at)
    .map((s) => ({ ...s, days: Math.ceil((new Date(s.trial_ends_at!).getTime() - now) / 86400000) }))
    .filter((s) => s.days <= 7)
    .sort((a, b) => a.days - b.days);

  const pastDue = siteList.filter((s) => s.subscription_status === 'past_due');

  return {
    settings,
    totals: {
      sites: siteList.length,
      trial: byStatus('trial'),
      active: byStatus('active'),
      pastDue: byStatus('past_due'),
      suspended: byStatus('suspended'),
      users: usersCount.count ?? 0,
      units: unitsCount.count ?? 0,
      mrr,
    },
    trialSoon: soon,
    pastDueSites: pastDue,
    recentUsers: (recentUsers ?? []) as unknown as Array<{ id: string; full_name: string | null; email: string; role: string; created_at: string | null; sites: { name: string } | null }>,
  };
}
