// Tek-seferlik: platform admin hesabı oluşturur (role='admin', site'siz).
// Çalıştırma:  node scripts/create-admin.mjs <email> <sifre> ["Ad Soyad"]
// .env.local'dan SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY okunur (service_role gerekir).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const txt = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
  const env = {};
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const [email, password, fullName = 'Platform Admin'] = process.argv.slice(2);
if (!email || !password) {
  console.error('Kullanım: node scripts/create-admin.mjs <email> <sifre> ["Ad Soyad"]');
  process.exit(1);
}

const env = loadEnv();
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key.startsWith('BURAYA_')) {
  console.error('HATA: .env.local içinde SUPABASE_URL ve gerçek SUPABASE_SERVICE_ROLE_KEY olmalı.');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function findAuthUserByEmail(targetEmail) {
  // listUsers sayfalı; küçük projede ilk birkaç sayfa yeterli.
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  let authUser = await findAuthUserByEmail(email);

  if (authUser) {
    console.log(`Auth kullanıcı zaten var: ${authUser.id} — admin'e yükseltiliyor.`);
  } else {
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }, // site_id YOK → trigger users satırı oluşturmaz
    });
    if (error) throw error;
    authUser = data.user;
    console.log(`Auth kullanıcı oluşturuldu: ${authUser.id}`);
  }

  // users satırını admin olarak upsert et (site'siz, onaylı, aktif)
  const { error: upErr } = await sb.from('users').upsert(
    {
      id: authUser.id,
      email,
      full_name: fullName,
      role: 'admin',
      approval_status: 'approved',
      is_active: true,
      site_id: null,
      tc_kimlik: null,
    },
    { onConflict: 'id' },
  );
  if (upErr) throw upErr;

  console.log(`✅ Admin hazır: ${email} (id=${authUser.id}, role=admin)`);
}

main().catch((e) => {
  console.error('❌ Hata:', e.message ?? e);
  process.exit(1);
});
