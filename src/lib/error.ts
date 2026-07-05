/**
 * DB/RPC hata mesajından yalnız bilinen teknik önekleri ayıklar (SQLSTATE kalıbı: "P0001: mesaj").
 * Eski kalıp (ilk iki noktaya kadar her şeyi silen regex) mesajın içindeki ilk iki noktaya kadar
 * her şeyi yutuyordu. Diğer iki projedeki error.ts ile aynı davranış.
 */
export function friendlyDbMessage(raw: string | null | undefined): string {
  const msg = (raw ?? '').trim();
  return msg.replace(/^[A-Z0-9]{5}:\s*/, '') || 'Beklenmeyen bir hata oluştu.';
}
