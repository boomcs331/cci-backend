# ระบบรับ-จ่ายวัตถุดิบพร้อม QR Code Tracking และ FIFO

## 📋 ภาพรวมระบบ

ระบบนี้ออกแบบมาเพื่อจัดการการรับและจ่ายวัตถุดิบในโรงงาน โดยมีคุณสมบัติหลัก:

- ✅ **รับวัตถุดิบเป็นก้อนใหญ่** แล้วแยกย่อยเป็น Lot ย่อยๆ
- ✅ **สร้าง QR Code** สำหรับแต่ละ Lot เพื่อติดตามและสแกน
- ✅ **ติดตามสถานะ** ว่าแต่ละ Lot ใช้หมดหรือยัง
- ✅ **จ่ายแบบ FIFO** (First In First Out) - จ่าย Lot เก่าก่อนเสมอ
- ✅ **บันทึก Transaction Log** ทุกการเคลื่อนไหว

---

## 🗄️ โครงสร้างฐานข้อมูล

### 1. `material_receiving` - ใบรับวัตถุดิบ (Header)

เก็บข้อมูลหลักของการรับวัตถุดิบแต่ละครั้ง

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `receiving_no` | VARCHAR(50) | เลขที่ใบรับ (RCV-2024-0001) - Unique |
| `receiving_date` | TIMESTAMP | วันที่รับวัตถุดิบ |
| `supplier_id` | INT | FK → supplier(id) |
| `material_id` | INT | FK → materials(id) |
| `total_quantity` | DECIMAL(15,2) | จำนวนรวมที่รับทั้งหมด |
| `unit` | VARCHAR(50) | หน่วย (KG, PCS, etc.) |
| `po_no` | VARCHAR(50) | เลขที่ใบสั่งซื้อ (Optional) |
| `remark` | TEXT | หมายเหตุ |
| `status` | VARCHAR(20) | ACTIVE, COMPLETED, CANCELLED |
| `create_date` | TIMESTAMP | วันที่สร้างเอกสาร |
| `create_by` | VARCHAR(255) | ผู้สร้าง |

**ตัวอย่าง:** รับเหล็กแผ่น 1,000 kg จากซัพพลายเออร์ ABC Steel

---

### 2. `material_receiving_lots` - รายการ Lot ย่อย (พร้อม QR Code)

แยกวัตถุดิบที่รับเป็น Lot ย่อยๆ แต่ละ Lot มี QR Code เป็นของตัวเอง

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `receiving_id` | INT | FK → material_receiving(id) |
| `lot_no` | VARCHAR(50) | เลข Lot (LOT-2024-0001) - Unique |
| `qr_code` | VARCHAR(100) | QR Code - Unique |
| `material_id` | INT | FK → materials(id) |
| `quantity` | DECIMAL(15,2) | จำนวนเริ่มต้นใน Lot นี้ |
| `remaining_quantity` | DECIMAL(15,2) | **จำนวนคงเหลือ** (สำคัญมาก!) |
| `unit` | VARCHAR(50) | หน่วย |
| `location_id` | INT | FK → materials_location(id) |
| `expiry_date` | DATE | วันหมดอายุ (ถ้ามี) |
| `status` | VARCHAR(20) | **AVAILABLE, PARTIAL_USED, USED_UP, EXPIRED** |
| `create_date` | TIMESTAMP | วันที่สร้าง Lot (ใช้สำหรับ FIFO) |
| `create_by` | VARCHAR(255) | ผู้สร้าง |

**Status อธิบาย:**
- `AVAILABLE` - ยังไม่ได้ใช้เลย (remaining_quantity = quantity)
- `PARTIAL_USED` - ใช้ไปบางส่วน (0 < remaining_quantity < quantity)
- `USED_UP` - ใช้หมดแล้ว (remaining_quantity = 0)
- `EXPIRED` - หมดอายุ

**ตัวอย่าง:** แยกเหล็กแผ่น 1,000 kg เป็น 10 Lot (Lot ละ 100 kg) แต่ละ Lot มี QR Code

---

### 3. `material_issuing` - ใบจ่ายวัตถุดิบ (Header)

เก็บข้อมูลหลักของการจ่ายวัตถุดิบแต่ละครั้ง

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `issuing_no` | VARCHAR(50) | เลขที่ใบจ่าย (ISS-2024-0001) - Unique |
| `issuing_date` | TIMESTAMP | วันที่จ่าย |
| `material_id` | INT | FK → materials(id) |
| `total_quantity` | DECIMAL(15,2) | จำนวนรวมที่จ่าย |
| `unit` | VARCHAR(50) | หน่วย |
| `department` | VARCHAR(100) | แผนกที่เบิก |
| `work_order_no` | VARCHAR(50) | เลขที่ใบสั่งผลิต (Optional) |
| `remark` | TEXT | หมายเหตุ |
| `status` | VARCHAR(20) | COMPLETED, CANCELLED |
| `create_date` | TIMESTAMP | วันที่สร้างเอกสาร |
| `create_by` | VARCHAR(255) | ผู้สร้าง |

**ตัวอย่าง:** แผนกผลิตเบิกเหล็กแผ่น 250 kg

---

### 4. `material_issuing_lots` - รายการจ่ายแยกตาม Lot (FIFO)

บันทึกว่าจ่ายจาก Lot ไหนบ้าง จำนวนเท่าไร (ระบบจะหยิบจาก Lot เก่าสุดก่อนอัตโนมัติ)

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `issuing_id` | INT | FK → material_issuing(id) |
| `lot_id` | INT | FK → material_receiving_lots(id) |
| `qr_code` | VARCHAR(100) | QR Code ของ Lot ที่จ่าย |
| `quantity` | DECIMAL(15,2) | จำนวนที่จ่ายจาก Lot นี้ |
| `unit` | VARCHAR(50) | หน่วย |
| `create_date` | TIMESTAMP | วันที่จ่าย |

**ตัวอย่าง:** จ่าย 250 kg มาจาก 3 Lot:
- LOT-0001: 100 kg (หมด)
- LOT-0002: 100 kg (หมด)
- LOT-0003: 50 kg (เหลือ 50 kg)

---

### 5. `material_transactions` - Transaction Log

บันทึกทุกการเคลื่อนไหวของวัตถุดิบ (Audit Trail)

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `transaction_no` | VARCHAR(50) | เลขที่ Transaction - Unique |
| `transaction_type` | VARCHAR(20) | **RECEIVE, ISSUE, ADJUST, RETURN** |
| `transaction_date` | TIMESTAMP | วันที่ทำรายการ |
| `material_id` | INT | FK → materials(id) |
| `lot_id` | INT | FK → material_receiving_lots(id) |
| `qr_code` | VARCHAR(100) | QR Code |
| `quantity` | DECIMAL(15,2) | จำนวน (+รับ / -จ่าย) |
| `remaining_quantity` | DECIMAL(15,2) | คงเหลือหลัง Transaction |
| `reference_no` | VARCHAR(50) | เลขที่เอกสารอ้างอิง |
| `remark` | TEXT | หมายเหตุ |
| `create_date` | TIMESTAMP | วันที่บันทึก |
| `create_by` | VARCHAR(255) | ผู้ทำรายการ |

---

## 🔄 Flow การทำงาน

### 📥 การรับวัตถุดิบ (Receiving)

```
1. สร้างใบรับ (material_receiving)
   ↓
2. แยกเป็น Lot ย่อย พร้อมสร้าง QR Code (material_receiving_lots)
   ↓
3. บันทึก Transaction Log (material_transactions)
   ↓
4. อัพเดท Stock (materials_stock)
```

**ตัวอย่าง:**
```sql
-- รับเหล็กแผ่น 1,000 kg
INSERT INTO material_receiving (...) VALUES ('RCV-2024-0001', NOW(), 1, 1, 1000, 'KG', ...);

-- แยกเป็น 10 Lot (Lot ละ 100 kg)
INSERT INTO material_receiving_lots (...) VALUES 
  (1, 'LOT-2024-0001', 'QR-LOT-2024-0001-ABC123', 1, 100, 100, 'KG', ...),
  (1, 'LOT-2024-0002', 'QR-LOT-2024-0002-DEF456', 1, 100, 100, 'KG', ...),
  ...
```

---

### 📤 การจ่ายวัตถุดิบ (Issuing) - FIFO

```
1. ระบุวัตถุดิบและจำนวนที่ต้องการจ่าย
   ↓
2. ระบบหา Lot ที่ใช้ได้ เรียงตาม create_date ASC (FIFO)
   ↓
3. หยิบจาก Lot เก่าสุดก่อน จนครบจำนวน
   ↓
4. สร้างใบจ่าย (material_issuing + material_issuing_lots)
   ↓
5. อัพเดท remaining_quantity และ status ของแต่ละ Lot
   ↓
6. บันทึก Transaction Log
   ↓
7. อัพเดท Stock
```

**ตัวอย่าง Logic FIFO:**
```sql
-- ต้องการจ่าย 250 kg
-- ระบบจะ Query Lot ที่ใช้ได้ตาม FIFO
SELECT * FROM material_receiving_lots
WHERE material_id = 1 
  AND status IN ('AVAILABLE', 'PARTIAL_USED')
  AND remaining_quantity > 0
ORDER BY create_date ASC, id ASC;

-- ผลลัพธ์:
-- LOT-0001: remaining = 100 kg (เอา 100 kg หมด)
-- LOT-0002: remaining = 100 kg (เอา 100 kg หมด)
-- LOT-0003: remaining = 100 kg (เอา 50 kg เหลือ 50 kg)

-- บันทึกการจ่าย
INSERT INTO material_issuing_lots VALUES
  (1, 1, 'QR-LOT-2024-0001-ABC123', 100, 'KG'),
  (1, 2, 'QR-LOT-2024-0002-DEF456', 100, 'KG'),
  (1, 3, 'QR-LOT-2024-0003-GHI789', 50, 'KG');

-- อัพเดท Lot
UPDATE material_receiving_lots SET remaining_quantity = 0, status = 'USED_UP' WHERE id IN (1, 2);
UPDATE material_receiving_lots SET remaining_quantity = 50, status = 'PARTIAL_USED' WHERE id = 3;
```

---

## 📱 การใช้งาน QR Code

### 1. สแกน QR Code เพื่อดูข้อมูล Lot

```sql
SELECT 
  mrl.lot_no,
  mrl.qr_code,
  mrl.quantity as "จำนวนเริ่มต้น",
  mrl.remaining_quantity as "คงเหลือ",
  mrl.status,
  m.mat_code,
  i.name as material_name,
  ml.name as location_name,
  mr.receiving_no,
  mr.receiving_date,
  s.name as supplier_name
FROM material_receiving_lots mrl
JOIN material_receiving mr ON mrl.receiving_id = mr.id
JOIN materials m ON mrl.material_id = m.id
JOIN items_name i ON m.id = i.material_id
LEFT JOIN materials_location ml ON mrl.location_id = ml.id
LEFT JOIN supplier s ON mr.supplier_id = s.id
WHERE mrl.qr_code = 'QR-LOT-2024-0001-ABC123';
```

**ผลลัพธ์:**
```
lot_no: LOT-2024-0001
qr_code: QR-LOT-2024-0001-ABC123
จำนวนเริ่มต้น: 100.00 KG
คงเหลือ: 0.00 KG
status: USED_UP
mat_code: MAT-001
material_name: เหล็กแผ่น
location_name: คลังวัตถุดิบ A
receiving_no: RCV-2024-0001
receiving_date: 2024-01-15
supplier_name: ABC Steel Corporation
```

---

### 2. ดูประวัติการใช้งานของ QR Code

```sql
SELECT 
  mt.transaction_no,
  mt.transaction_type,
  mt.transaction_date,
  mt.quantity,
  mt.remaining_quantity,
  mt.reference_no,
  mt.create_by
FROM material_transactions mt
WHERE mt.qr_code = 'QR-LOT-2024-0001-ABC123'
ORDER BY mt.create_date DESC;
```

**ผลลัพธ์:**
```
transaction_no | transaction_type | transaction_date | quantity | remaining_quantity | reference_no
---------------|------------------|------------------|----------|-------------------|-------------
TXN-0003       | ISSUE           | 2024-01-20       | -100.00  | 0.00              | ISS-2024-0001
TXN-0001       | RECEIVE         | 2024-01-15       | +100.00  | 100.00            | RCV-2024-0001
```

---

### 3. ตรวจสอบว่า QR Code ใช้หมดหรือยัง

```sql
SELECT 
  qr_code,
  lot_no,
  remaining_quantity,
  status,
  CASE 
    WHEN status = 'USED_UP' THEN 'ใช้หมดแล้ว'
    WHEN status = 'EXPIRED' THEN 'หมดอายุ'
    WHEN status = 'PARTIAL_USED' THEN 'ใช้ไปบางส่วน'
    WHEN status = 'AVAILABLE' THEN 'ยังไม่ได้ใช้'
  END as status_th
FROM material_receiving_lots
WHERE qr_code = 'QR-LOT-2024-0001-ABC123';
```

---

## 📊 Queries ที่มีประโยชน์

### 1. ดู Lot ทั้งหมดของวัตถุดิบ (เรียงตาม FIFO)

```sql
SELECT 
  lot_no,
  qr_code,
  quantity,
  remaining_quantity,
  status,
  create_date
FROM material_receiving_lots
WHERE material_id = 1 
  AND status IN ('AVAILABLE', 'PARTIAL_USED')
  AND remaining_quantity > 0
ORDER BY create_date ASC, id ASC;
```

---

### 2. สรุปยอดคงเหลือแต่ละวัตถุดิบ

```sql
SELECT 
  m.mat_code,
  i.name as material_name,
  COUNT(mrl.id) as total_lots,
  SUM(mrl.remaining_quantity) as total_remaining,
  m.unit
FROM materials m
JOIN items_name i ON m.id = i.material_id
LEFT JOIN material_receiving_lots mrl ON m.id = mrl.material_id 
  AND mrl.status IN ('AVAILABLE', 'PARTIAL_USED')
GROUP BY m.id, m.mat_code, i.name, m.unit;
```

**ผลลัพธ์:**
```
mat_code | material_name | total_lots | total_remaining | unit
---------|---------------|------------|-----------------|-----
MAT-001  | เหล็กแผ่น      | 7          | 750.00          | KG
MAT-002  | พลาสติก       | 5          | 500.00          | KG
```

---

### 3. รายงาน Lot ที่ใกล้หมดอายุ

```sql
SELECT 
  mrl.lot_no,
  mrl.qr_code,
  m.mat_code,
  i.name as material_name,
  mrl.remaining_quantity,
  mrl.expiry_date,
  (mrl.expiry_date - CURRENT_DATE) as days_to_expire
FROM material_receiving_lots mrl
JOIN materials m ON mrl.material_id = m.id
JOIN items_name i ON m.id = i.material_id
WHERE mrl.status IN ('AVAILABLE', 'PARTIAL_USED')
  AND mrl.expiry_date IS NOT NULL
  AND mrl.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY mrl.expiry_date ASC;
```

---

### 4. รายงานการจ่ายวัตถุดิบรายวัน

```sql
SELECT 
  DATE(mi.issuing_date) as issuing_date,
  m.mat_code,
  i.name as material_name,
  SUM(mi.total_quantity) as total_issued,
  m.unit,
  COUNT(mi.id) as transaction_count
FROM material_issuing mi
JOIN materials m ON mi.material_id = m.id
JOIN items_name i ON m.id = i.material_id
WHERE mi.issuing_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(mi.issuing_date), m.mat_code, i.name, m.unit
ORDER BY issuing_date DESC, m.mat_code;
```

---

## 🎯 Best Practices

### 1. การสร้าง QR Code
```
Format: QR-{LOT_NO}-{TIMESTAMP}-{RANDOM}
Example: QR-LOT-2024-0001-1705312345-ABC123
```

### 2. การตั้งชื่อเลขที่เอกสาร
```
Receiving: RCV-{YEAR}-{SEQUENCE}  → RCV-2024-0001
Issuing:   ISS-{YEAR}-{SEQUENCE}  → ISS-2024-0001
Lot:       LOT-{YEAR}-{SEQUENCE}  → LOT-2024-0001
```

### 3. การจัดการ Transaction
- ใช้ Database Transaction เพื่อความปลอดภัย
- บันทึก Log ทุกครั้งที่มีการเปลี่ยนแปลง
- Validate ข้อมูลก่อนทำรายการ

### 4. Performance Optimization
- สร้าง Index ตามที่กำหนดไว้
- ใช้ Composite Index สำหรับ FIFO Query
- Archive ข้อมูลเก่าเป็นระยะ

---

## 🔐 Security & Validation

### ก่อนรับวัตถุดิบ
- ✅ ตรวจสอบว่า material_id มีอยู่จริง
- ✅ ตรวจสอบว่า supplier_id มีอยู่จริง
- ✅ ตรวจสอบว่า location_id มีอยู่จริง
- ✅ Validate quantity > 0

### ก่อนจ่ายวัตถุดิบ
- ✅ ตรวจสอบว่ามี Stock เพียงพอ
- ✅ ตรวจสอบว่ามี Lot ที่ใช้ได้
- ✅ ตรวจสอบ Lot ไม่หมดอายุ
- ✅ Validate quantity > 0

### การสแกน QR Code
- ✅ ตรวจสอบว่า QR Code มีอยู่จริง
- ✅ ตรวจสอบสถานะ Lot
- ✅ แสดงข้อมูลที่ถูกต้องและครบถ้วน

---

## 📈 การขยายระบบในอนาคต

1. **Barcode Support** - รองรับ Barcode นอกจาก QR Code
2. **Mobile App** - แอพสแกน QR Code บนมือถือ
3. **Alert System** - แจ้งเตือนเมื่อ Stock ต่ำหรือใกล้หมดอายุ
4. **Batch Processing** - รับ/จ่ายหลายรายการพร้อมกัน
5. **Return Process** - รองรับการคืนวัตถุดิบ
6. **Transfer Between Locations** - ย้ายวัตถุดิบระหว่างคลัง
7. **Reporting Dashboard** - Dashboard แสดงสถิติและกราฟ

---

## 📞 สรุป

ระบบนี้ช่วยให้:
- ✅ ติดตามวัตถุดิบได้ละเอียดถึงระดับ Lot
- ✅ จ่ายแบบ FIFO อัตโนมัติ
- ✅ สแกน QR Code เพื่อดูข้อมูลและประวัติ
- ✅ รู้ว่าแต่ละ Lot ใช้หมดหรือยัง
- ✅ มี Audit Trail ครบถ้วน
- ✅ จัดการ Stock ได้แม่นยำ
