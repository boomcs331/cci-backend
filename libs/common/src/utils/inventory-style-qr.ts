/**
 * รูปแบบเดียวกับวัตถุดิบ (รับเข้า) และคำสั่งผลิต (ล็อต)
 * QR-{lotNo}-{timestamp}-{สุ่ม 6 ตัว base36}
 */
export function buildInventoryStyleQrCode(lotNo: string): string {
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `QR-${lotNo}-${Date.now()}-${suffix}`;
}
