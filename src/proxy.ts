import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabaseMiddleware';

/** A4 dış kapı: tüm panel HTTP Basic Auth arkasına alınır (Supabase login'in ÜSTÜNE,
 *  onun yerine değil). İki env de tanımlı değilse devre dışı — lokal geliştirme etkilenmez.
 *  Netlify/Vercel'de: ADMIN_PANEL_BASIC_USER + ADMIN_PANEL_BASIC_PASS (server-only env). */
function basicAuthGate(request: NextRequest): NextResponse | null {
  const user = process.env.ADMIN_PANEL_BASIC_USER;
  const pass = process.env.ADMIN_PANEL_BASIC_PASS;
  if (!user || !pass) return null;

  const header = request.headers.get('authorization') ?? '';
  if (header.startsWith('Basic ')) {
    try {
      const [u, p] = atob(header.slice(6)).split(':');
      if (u === user && p === pass) return null;
    } catch {
      // bozuk header → aşağıda 401
    }
  }

  return new NextResponse('Yetkilendirme gerekli', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Komsu Asistani Admin"' },
  });
}

// Next.js 16: 'middleware' → 'proxy' (runtime: nodejs). Konum src/ (app ile aynı seviye).
export async function proxy(request: NextRequest) {
  const gate = basicAuthGate(request);
  if (gate) return gate;
  return updateSession(request);
}

export const config = {
  // Statik dosyalar ve görseller hariç tüm yollar
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
