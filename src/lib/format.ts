const TRY = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
const TRY2 = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 });

export function money(value: number | null | undefined, decimals = false): string {
  const n = Number(value ?? 0);
  return decimals ? TRY2.format(n) : TRY.format(n);
}

export function date(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Bugünden p_days içinde mi? Negatif = geçmiş. */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

export const STATUS_LABEL: Record<string, string> = {
  trial: 'Deneme',
  active: 'Aktif',
  past_due: 'Ödeme Gecikti',
  suspended: 'Askıda',
  expired: 'Süresi Doldu',
  cancelled: 'İptal',
};

export const ROLE_LABEL: Record<string, string> = {
  resident: 'Sakin',
  manager: 'Yönetici',
  accountant: 'Muhasebeci',
  admin: 'Admin',
};
