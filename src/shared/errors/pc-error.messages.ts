import { PcErrorCode } from './pc-error.codes';

export const PC_ERROR_MESSAGES: Record<PcErrorCode, string> = {
  [PcErrorCode.VALIDATION_FAILED]: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  [PcErrorCode.PC_PO_NO_REQUIRED]: 'กรุณาระบุเลขที่ PO',
  [PcErrorCode.PC_PO_NO_INVALID]:
    'เลขที่ PO ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และอักขระพิเศษ (ไม่รองรับภาษาไทย)',
  [PcErrorCode.PC_PO_NO_TOO_LONG]: 'เลขที่ PO ต้องไม่เกิน 50 ตัวอักษร',
  [PcErrorCode.PC_MFG_DATE_REQUIRED]: 'กรุณาระบุวันที่ผลิต',
  [PcErrorCode.PC_MFG_DATE_INVALID]: 'วันที่ผลิตไม่ถูกต้อง',
  [PcErrorCode.PC_MFG_DATE_FUTURE]: 'วันที่ผลิตต้องไม่เกินวันปัจจุบัน',
  [PcErrorCode.PC_MATERIAL_REQUIRED]: 'กรุณาเลือกวัตถุดิบ',
  [PcErrorCode.PC_QUANTITY_INVALID]: 'กรุณาระบุจำนวนวัตถุดิบ',
  [PcErrorCode.PC_MATERIAL_NOT_FOUND]: 'ไม่พบข้อมูลวัตถุดิบ',
  [PcErrorCode.PC_INSUFFICIENT_STOCK]: 'สต็อกวัตถุดิบไม่เพียงพอ',
};
