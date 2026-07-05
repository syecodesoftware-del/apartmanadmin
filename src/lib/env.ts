import 'server-only';

/** Ortam değişkenlerini sunucu tarafında doğrular. service_role anahtarı asla istemciye sızmaz. */
function required(name: string): string {
  const v = process.env[name];
  if (!v || v.startsWith('BURAYA_')) {
    throw new Error(
      `Eksik ortam değişkeni: ${name}. admin-panel/.env.local dosyasını .env.local.example'a göre doldurun.`,
    );
  }
  return v;
}

export const env = {
  supabaseUrl: () => required('SUPABASE_URL'),
  supabaseAnonKey: () => required('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: () => required('SUPABASE_SERVICE_ROLE_KEY'),
};
