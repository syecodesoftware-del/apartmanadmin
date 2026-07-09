export type NavItem = { href: string; label: string; icon: string };

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Genel Bakış', icon: '📊' },
  { href: '/sites', label: 'Siteler', icon: '🏢' },
  { href: '/companies', label: 'Firmalar', icon: '🏛️' },
  { href: '/deletion-requests', label: 'Silme Talepleri', icon: '🗑️' },
  { href: '/users', label: 'Kullanıcılar', icon: '👥' },
  { href: '/billing', label: 'Faturalama', icon: '💳' },
  { href: '/content', label: 'İçerik', icon: '📣' },
  { href: '/audit', label: 'Denetim Kaydı', icon: '🛡️' },
];
