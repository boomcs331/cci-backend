# Migration Guide: Add lot_pd_no field

## วัตถุประสงค์
เพิ่มฟีลด์ `lot_pd_no` ในตาราง `material_receiving_lots` เพื่อเก็บเลขที่ผลิต (Production Date Number) ในรูปแบบ PD20260101-001

## การ Migrate

### 1. รัน Migration
```bash
psql -U your_username -d your_database -f migrations/add-lot-pd-no.sql
```

### 2. ตรวจสอบการเปลี่ยนแปลง
```sql
-- ตรวจสอบว่าฟีลด์ถูกเพิ่มแล้ว
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'material_receiving_lots' AND column_name = 'lot_pd_no';

-- ตรวจสอบ index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'material_receiving_lots' AND indexname = 'idx_material_receiving_lots_lot_pd_no';
```

## การ Rollback
หากต้องการย้อนกลับการเปลี่ยนแปลง:
```bash
psql -U your_username -d your_database -f migrations/rollback-lot-pd-no.sql
```

## การใช้งาน

### ระบบจะ Generate อัตโนมัติ
- **Lot Number (lot_no)**: รูปแบบ `PC{YYYYMMDD}-{RUN}` เช่น `PC20260101-001`
- **Production Date Number (lot_pd_no)**: รูปแบบ `PD{YYYYMMDD}-{RUN}` เช่น `PD20260101-001`
- **Running Number**: นับรอบในแต่ละวัน (001, 002, 003, ...)

### API Request Example
```json
{
  "materialId": 1,
  "totalQuantity": 100,
  "locationId": 1,
  "mfgDate": "2026-01-01",
  "createBy": "admin"
}
```

### API Response Example
```json
{
  "success": true,
  "data": {
    "id": 1,
    "receivingNo": "RCV-2026-00000001",
    "lots": [
      {
        "lotNo": "PC20260101-001",
        "lotPdNo": "PD20260101-001",
        "qrCode": "QR-PC20260101-001-1735689600000-ABC123"
      }
    ]
  }
}
```

## หมายเหตุ
- ฟีลด์ `lot_pd_no` เป็น nullable (สามารถเป็นค่าว่างได้)
- ฟีลด์ `lot_no` ยังคงเป็น unique และ required
- ระบบจะ generate เลข running number อัตโนมัติโดยนับจากเลขที่มีอยู่ในวันนั้น
- Running number จะรีเซ็ตทุกวัน (เริ่มใหม่ที่ 001 ในแต่ละวัน)
