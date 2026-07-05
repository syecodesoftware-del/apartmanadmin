import { NextRequest, NextResponse } from "next/server";

/** A4 ek koruma katmanı: tüm panel HTTP Basic Auth arkasına alınır (Supabase login'in ÜSTÜNE,
 *  onun yerine değil). İki env de tanımlı değilse devre dışı — lokal geliştirme etkilenmez.
 *  Vercel'de: ADMIN_PANEL_BASIC_USER + ADMIN_PANEL_BASIC_PASS (server-only env). */
export function middleware(req: NextRequest) {
  const user = process.env.ADMIN_PANEL_BASIC_USER;
  const pass = process.env.ADMIN_PANEL_BASIC_PASS;
  if (!user || !pass) return NextResponse.next();

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const [u, p] = atob(header.slice(6)).split(":");
      if (u === user && p === pass) return NextResponse.next();
    } catch {
      // bozuk header → aşağıda 401
    }
  }

  return new NextResponse("Yetkilendirme gerekli", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Komsu Asistani Admin"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
