# Prompt: แก้ไขระบบ PO Validation

## Objective
ตรวจสอบและแก้ไขระบบ `/pc`

ฟิลด์: `เลขที่ PO`

เงื่อนไข:
- อนุญาตให้กรอกได้เฉพาะ:
  - ตัวเลข (0-9)
  - ภาษาอังกฤษ (A-Z, a-z)
- ไม่อนุญาต:
  - ภาษาไทย
  - อักขระพิเศษ
  - ช่องว่าง

ตัวอย่างที่ถูกต้อง:
- PO2026
- ABC123
- TEST001

ตัวอย่างที่ไม่ถูกต้อง:
- PO-001
- PO 001
- ใบสั่งซื้อ01
- #PO123

---

## Tech Stack
- Backend: NestJS
- Frontend: NextJS
- Database: PostgreSQL

---

## Requirements

1. Frontend Validation
- ตรวจสอบ input ทันทีขณะกรอกข้อมูล
- หากกรอกข้อมูลไม่ถูกต้อง ให้แสดงข้อความแจ้งเตือน
- จำกัดการกรอกเฉพาะภาษาอังกฤษและตัวเลขเท่านั้น

2. Backend Validation
- Validate ซ้ำที่ API ด้วย NestJS Validation Pipe
- ป้องกันการส่งข้อมูลผิดรูปแบบจากภายนอก
- Return error message ที่ชัดเจน

3. Database Validation
- ตรวจสอบว่าข้อมูลที่บันทึกลง PostgreSQL เป็น format ที่ถูกต้อง
- ป้องกันข้อมูล invalid ถูกบันทึกลงฐานข้อมูล

4. Regex Validation
ใช้ Regex:
```regex
^[A-Za-z0-9]+$