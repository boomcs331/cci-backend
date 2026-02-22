# Database Migration - Issuing with Documents

## วิธีการรัน Migration

### 1. รัน Migration (สร้างตารางใหม่)
```bash
node run-issuing-migration.js
```

สิ่งที่จะเกิดขึ้น:
- ✅ สร้างตาราง `issuing_types` (Master Data)
- ✅ สร้างตาราง `material_issuing_documents`
- ✅ เพิ่มคอลัมน์ `issuing_type_id` ในตาราง `material_issuing`
- ✅ Seed ข้อมูล 3 ประเภทการจ่าย: BACKORDER, NORMAL, OTHER
- ✅ สร้าง indexes

### 2. Rollback Migration (ลบตารางที่สร้าง)
```bash
node rollback-issuing-migration.js
```

สิ่งที่จะเกิดขึ้น:
- ✅ ลบตาราง `material_issuing_documents`
- ✅ ลบตาราง `issuing_types`
- ✅ ลบคอลัมน์ `issuing_type_id` จากตาราง `material_issuing`
- ✅ คืนค่า default ของคอลัมน์ `issuing_type`

## ตรวจสอบผลลัพธ์

เข้า PostgreSQL และตรวจสอบ:

```sql
-- ดูตารางที่สร้าง
\dt

-- ดูข้อมูลประเภทการจ่าย
SELECT * FROM issuing_types;

-- ดูโครงสร้างตาราง material_issuing
\d material_issuing

-- ดูโครงสร้างตาราง material_issuing_documents
\d material_issuing_documents
```

## หมายเหตุ

- ตรวจสอบไฟล์ `.env` ให้มีการตั้งค่า database ที่ถูกต้อง
- สำรองข้อมูลก่อนรัน migration ในระบบ production
