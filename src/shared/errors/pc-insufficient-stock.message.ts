/**
 * ข้อความสต็อกวัตถุดิบไม่พอ (ภาษาไทย) — ใช้ร่วมกับ PcErrorCode.PC_INSUFFICIENT_STOCK
 */
export function pcInsufficientStockMessage(
  matCode: string | undefined,
  available: number,
  needed: number,
): string {
  const avail = Number(available).toLocaleString('th-TH');
  const need = Number(needed).toLocaleString('th-TH');
  if (matCode?.trim()) {
    return `สต็อกวัตถุดิบ ${matCode.trim()} ไม่เพียงพอ (คงเหลือ ${avail}, ต้องการ ${need})`;
  }
  return `สต็อกวัตถุดิบไม่เพียงพอ (คงเหลือ ${avail}, ต้องการ ${need})`;
}
