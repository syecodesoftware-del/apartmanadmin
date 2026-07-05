# Komşu Asistanı — Platform Admin Paneli

Mobil uygulamadan **ayrı**, kendi sunucunda barınan web yönetim paneli. Tüm siteleri/kullanıcıları görüp yönetir.

- **Next.js 16** (App Router) + TypeScript + Tailwind
- Supabase **service_role** ile çalışır → RLS bypass → tüm siteler. Anahtar **yalnız sunucuda** kalır.
- Erişim: yalnız `users.role = 'admin'` hesaplar.

## Mimari güvenlik
- `service_role` anahtarı sadece sunucu kodunda (`src/lib/supabaseAdmin.ts`, `import 'server-only'`). Tarayıcıya/bundle'a **sızmaz** (`NEXT_PUBLIC_` değil).
- Mevcut mobil uygulamanın RLS politikalarına **dokunulmaz** → canlıya sıfır risk.
- Her mutasyon `admin_audit_log` tablosuna yazılır (Denetim Kaydı ekranı).
- Giriş hız sınırı (5 deneme / 5 dk), güvenlik başlıkları (`next.config.ts`).

## Kurulum (ilk kez)

### 1. Ortam değişkenleri
`.env.local.example` → `.env.local` olarak kopyala ve **service_role** anahtarını doldur:
```
SUPABASE_URL=...                 (dolu)
SUPABASE_ANON_KEY=...            (dolu)
SUPABASE_SERVICE_ROLE_KEY=...    ← Supabase Dashboard → Settings → API → service_role (secret)
```
`.env.local` gitignore'dadır; anahtarı asla repoya koyma.

### 2. Bağımlılıklar
```bash
npm install
```

### 3. Admin hesabı oluştur (tek seferlik)
```bash
node scripts/create-admin.mjs eposta@ornek.com güçlü-şifre "Ad Soyad"
```
Site'siz, `role=admin` bir hesap oluşturur (mevcut kullanıcılara dokunmaz, idempotent).

## Çalıştırma

### Local (geliştirme)
```bash
npm run dev
# http://localhost:3000 → giriş
```

### Production (kendi sunucun)
```bash
npm run build
npm run start        # varsayılan port 3000; PORT=8080 npm run start ile değiştir
```
Reverse proxy (Nginx) arkasında HTTPS ile yayınlaman önerilir. Tek `node` süreci yeterli; istersen `pm2` / `systemd` ile servis yap.

## Bölümler
- **Genel Bakış** — site/kullanıcı/daire sayıları, tahmini MRR, deneme bitişleri, ödeme gecikenler, son kayıtlar.
- **Siteler** — liste + detay: üyeler, mali özet, abonelik yönetimi (durum/trial/birim fiyat), abonelik ödemeleri.
- **Kullanıcılar** — çapraz-site arama/filtre + detay: rol/onay/aktiflik, şifre sıfırlama bağlantısı, hesap silme.
- **Faturalama** — platform ayarları (deneme gün, birim fiyat) + site bazlı aylık ücretler.
- **İçerik** — duyuru/şikayet/rezervasyon/anket denetimi (kötüye kullanım kaldırma).
- **Denetim Kaydı** — panelden yapılan tüm değişikliklerin kaydı.

## Notlar
- Hız sınırı in-memory'dir (restart'ta sıfırlanır) — tek sunuculu kurulum için yeterli; çok örnekli dağıtımda Redis tabanlıya geçilebilir.
- service_role tanrı-modudur: paneli yalnız güvendiğin kişilere aç, HTTPS arkasında çalıştır.
