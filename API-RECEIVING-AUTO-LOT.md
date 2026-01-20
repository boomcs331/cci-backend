# API รับเข้าวัตถุดิบ (Auto Lot Calculation)

## 📥 การรับวัตถุดิบเข้า - คำนวณ Lot อัตโนมัติ

ระบบจะคำนวณจำนวน Lot อัตโนมัติจาก `totalQuantity / material.lotSize` และปัดขึ้น

### Endpoint
```
POST /materials/transactions/receive
```

### Request Body (แบบใหม่ - ง่ายขึ้น)
```json
{
  "materialId": 1,
  "totalQuantity": 1000,
  "supplierId": 1,
  "poNo": "PO-2024-001",
  "locationId": 1,
  "expiryDate": "2025-12-31",
  "remark": "รับเหล็กแผ่น",
  "createBy": "admin"
}
```

### การคำนวณ Lot อัตโนมัติ

**สูตร:**
```
numberOfLots = Math.ceil(totalQuantity / material.lotSize)
```

**ตัวอย่างที่ 1:**
- Material: เหล็กแผ่น (lotSize = 100 kg)
- totalQuantity = 1000 kg
- จำนวน Lot = Math.ceil(1000 / 100) = **10 Lot**
- แต่ละ Lot = 100 kg

**ตัวอย่างที่ 2:**
- Material: พลาสติก (lotSize = 150 kg)
- totalQuantity = 500 kg
- จำนวน Lot = Math.ceil(500 / 150) = **4 Lot**
- Lot 1-3 = 150 kg แต่ละ Lot
- Lot 4 = 50 kg (เศษที่เหลือ)

**ตัวอย่างที่ 3:**
- Material: สารเคมี (lotSize = 25 kg)
- totalQuantity = 237 kg
- จำนวน Lot = Math.ceil(237 / 25) = **10 Lot**
- Lot 1-9 = 25 kg แต่ละ Lot
- Lot 10 = 12 kg (เศษที่เหลือ)

---

## 📊 ตัวอย่างการใช้งาน

### ตัวอย่างที่ 1: รับเหล็กแผ่น 1,000 kg (lotSize = 100)

**Request:**
```json
{
  "materialId": 1,
  "totalQuantity": 1000,
  "supplierId": 1,
  "poNo": "PO-2024-001",
  "locationId": 1,
  "createBy": "admin"
}
```

**ผลลัพธ์:**
- สร้าง 10 Lot อัตโนมัติ
- แต่ละ Lot = 100 kg
- QR Code สำหรับแต่ละ Lot

**Response:**
```json
{
  "success": true,
  "message": "Material received successfully",
  "data": {
    "id": 1,
    "receivingNo": "RCV-2024-0001",
    "totalQuantity": 1000,
    "unit": "KG",
    "lots": [
      {
        "id": 1,
        "lotNo": "LOT-2024-0001",
        "qrCode": "QR-LOT-2024-0001-ABC123",
        "quantity": 100,
        "remainingQuantity": 100,
        "status": "AVAILABLE"
      },
      {
        "id": 2,
        "lotNo": "LOT-2024-0002",
        "qrCode": "QR-LOT-2024-0002-DEF456",
        "quantity": 100,
        "remainingQuantity": 100,
        "status": "AVAILABLE"
      },
      // ... 8 Lot อื่นๆ
    ]
  }
}
```

---

### ตัวอย่างที่ 2: รับพลาสติก 500 kg (lotSize = 150)

**Request:**
```json
{
  "materialId": 2,
  "totalQuantity": 500,
  "supplierId": 3,
  "locationId": 2,
  "expiryDate": "2025-12-31",
  "createBy": "admin"
}
```

**การคำนวณ:**
- numberOfLots = Math.ceil(500 / 150) = 4 Lot
- Lot 1 = 150 kg
- Lot 2 = 150 kg
- Lot 3 = 150 kg
- Lot 4 = 50 kg (เศษ)

**Response:**
```json
{
  "success": true,
  "message": "Material received successfully",
  "data": {
    "id": 2,
    "receivingNo": "RCV-2024-0002",
    "totalQuantity": 500,
    "unit": "KG",
    "lots": [
      {
        "lotNo": "LOT-2024-0011",
        "quantity": 150,
        "remainingQuantity": 150
      },
      {
        "lotNo": "LOT-2024-0012",
        "quantity": 150,
        "remainingQuantity": 150
      },
      {
        "lotNo": "LOT-2024-0013",
        "quantity": 150,
        "remainingQuantity": 150
      },
      {
        "lotNo": "LOT-2024-0014",
        "quantity": 50,
        "remainingQuantity": 50
      }
    ]
  }
}
```

---

## 🎨 Frontend Example

### React Component

```tsx
import React, { useState } from 'react';
import axios from 'axios';

export const SimpleReceivingForm: React.FC = () => {
  const [form, setForm] = useState({
    materialId: 1,
    totalQuantity: 0,
    supplierId: 1,
    poNo: '',
    locationId: 1,
    expiryDate: '',
    remark: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:3000/materials/transactions/receive',
        {
          ...form,
          createBy: 'admin'
        }
      );

      const result = response.data.data;
      alert(`รับวัตถุดิบสำเร็จ!\n` +
            `เลขที่ใบรับ: ${result.receivingNo}\n` +
            `จำนวน Lot: ${result.lots.length} Lot`);
      
      // แสดง QR Codes
      console.log('QR Codes:', result.lots.map(lot => ({
        lotNo: lot.lotNo,
        qrCode: lot.qrCode,
        quantity: lot.quantity
      })));
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="receiving-form">
      <h2>รับวัตถุดิบเข้า (Auto Lot)</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>วัตถุดิบ:</label>
          <select 
            value={form.materialId}
            onChange={(e) => setForm({...form, materialId: Number(e.target.value)})}
            required
          >
            <option value={1}>เหล็กแผ่น (Lot Size: 100 kg)</option>
            <option value={2}>พลาสติก (Lot Size: 150 kg)</option>
          </select>
        </div>

        <div>
          <label>จำนวนรวม:</label>
          <input
            type="number"
            value={form.totalQuantity}
            onChange={(e) => setForm({...form, totalQuantity: Number(e.target.value)})}
            placeholder="1000"
            required
          />
          <small>ระบบจะแยก Lot อัตโนมัติตาม Lot Size</small>
        </div>

        <div>
          <label>ซัพพลายเออร์:</label>
          <select
            value={form.supplierId}
            onChange={(e) => setForm({...form, supplierId: Number(e.target.value)})}
          >
            <option value={1}>ABC Steel</option>
            <option value={2}>Global Electronics</option>
          </select>
        </div>

        <div>
          <label>เลขที่ PO:</label>
          <input
            type="text"
            value={form.poNo}
            onChange={(e) => setForm({...form, poNo: e.target.value})}
            placeholder="PO-2024-001"
          />
        </div>

        <div>
          <label>คลังจัดเก็บ:</label>
          <select
            value={form.locationId}
            onChange={(e) => setForm({...form, locationId: Number(e.target.value)})}
          >
            <option value={1}>คลังวัตถุดิบ A</option>
            <option value={2}>คลังวัตถุดิบ B</option>
          </select>
        </div>

        <div>
          <label>วันหมดอายุ:</label>
          <input
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({...form, expiryDate: e.target.value})}
          />
        </div>

        <div>
          <label>หมายเหตุ:</label>
          <textarea
            value={form.remark}
            onChange={(e) => setForm({...form, remark: e.target.value})}
            rows={3}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึกการรับวัตถุดิบ'}
        </button>
      </form>
    </div>
  );
};
```

---

## 📋 ข้อดีของระบบใหม่

### ✅ ง่ายขึ้น
- ไม่ต้องระบุ lots array
- ระบบคำนวณอัตโนมัติ

### ✅ ถูกต้องแม่นยำ
- ใช้ lotSize จาก Material
- ปัดขึ้นอัตโนมัติ (Math.ceil)

### ✅ สม่ำเสมอ
- Lot ทุก Lot มีขนาดเท่ากัน (ยกเว้น Lot สุดท้าย)
- Lot สุดท้ายเก็บเศษที่เหลือ

### ✅ ลด Error
- ไม่ต้องกังวลเรื่อง totalQuantity ไม่ตรงกับ lots
- ไม่ต้องคำนวณเอง

---

## 🔍 การตรวจสอบ

### ตรวจสอบ Material Lot Size
```sql
SELECT id, mat_code, lot_size, unit 
FROM materials 
WHERE id = 1;
```

### ตรวจสอบ Lots ที่สร้าง
```sql
SELECT 
  lot_no,
  quantity,
  remaining_quantity,
  qr_code
FROM material_receiving_lots
WHERE receiving_id = 1
ORDER BY id;
```

---

## 📝 สรุป

**Request แบบเดิม (ซับซ้อน):**
```json
{
  "materialId": 1,
  "totalQuantity": 1000,
  "lots": [
    {"quantity": 100}, {"quantity": 100}, {"quantity": 100},
    {"quantity": 100}, {"quantity": 100}, {"quantity": 100},
    {"quantity": 100}, {"quantity": 100}, {"quantity": 100},
    {"quantity": 100}
  ]
}
```

**Request แบบใหม่ (ง่าย):**
```json
{
  "materialId": 1,
  "totalQuantity": 1000
}
```

ระบบจะสร้าง 10 Lot อัตโนมัติ! 🎉
