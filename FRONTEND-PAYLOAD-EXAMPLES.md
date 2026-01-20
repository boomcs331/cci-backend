# Frontend Payload Examples - Receiving & Issuing API

## 📦 TypeScript Types

```typescript
// types/receiving-issuing.types.ts

// ==================== REQUEST TYPES ====================

// รับวัตถุดิบเข้า
export interface CreateReceivingRequest {
  materialId: number;
  totalQuantity: number;
  supplierId?: number;
  poNo?: string;
  locationId?: number;
  expiryDate?: string;  // YYYY-MM-DD
  remark?: string;
  createBy?: string;
}

// จ่ายวัตถุดิบออก
export interface CreateIssuingRequest {
  materialId: number;
  quantity: number;
  department?: string;
  workOrderNo?: string;
  remark?: string;
  createBy?: string;
}

// ==================== RESPONSE TYPES ====================

export interface Lot {
  id: number;
  lotNo: string;
  qrCode: string;
  quantity: number;
  remainingQuantity: number;
  unit: string;
  status: 'AVAILABLE' | 'PARTIAL_USED' | 'USED_UP' | 'EXPIRED';
  locationId?: number;
  expiryDate?: string;
  createDate: string;
}

export interface Material {
  id: number;
  matCode: string;
  unit: string;
  itemsName: {
    name: string;
    description?: string;
  };
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
}

export interface ReceivingResponse {
  id: number;
  receivingNo: string;
  receivingDate: string;
  materialId: number;
  supplierId?: number;
  totalQuantity: number;
  unit: string;
  poNo?: string;
  remark?: string;
  status: string;
  material: Material;
  supplier?: Supplier;
  lots: Lot[];
}

export interface IssuingLot {
  id: number;
  lotId: number;
  qrCode: string;
  quantity: number;
  unit: string;
  lot: {
    lotNo: string;
    remainingQuantity: number;
    status: string;
  };
}

export interface IssuingResponse {
  id: number;
  issuingNo: string;
  issuingDate: string;
  materialId: number;
  totalQuantity: number;
  unit: string;
  department?: string;
  workOrderNo?: string;
  remark?: string;
  status: string;
  material: Material;
  lots: IssuingLot[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 📥 1. รับวัตถุดิบเข้า (Receiving)

### Endpoint
```
POST /materials/transactions/receive
```

### Payload ตัวอย่างที่ 1: รับเหล็กแผ่น 1,000 kg

```json
{
  "materialId": 1,
  "totalQuantity": 1000,
  "supplierId": 1,
  "poNo": "PO-2024-001",
  "locationId": 1,
  "remark": "รับเหล็กแผ่นจากซัพพลายเออร์ ABC Steel",
  "createBy": "admin"
}
```

**ผลลัพธ์:** ระบบจะสร้าง 10 Lot อัตโนมัติ (ถ้า lotSize = 100)

---

### Payload ตัวอย่างที่ 2: รับพลาสติก 500 kg พร้อมวันหมดอายุ

```json
{
  "materialId": 2,
  "totalQuantity": 500,
  "supplierId": 3,
  "poNo": "PO-2024-002",
  "locationId": 2,
  "expiryDate": "2025-12-31",
  "remark": "รับพลาสติกชนิดพิเศษ",
  "createBy": "admin"
}
```

**ผลลัพธ์:** ระบบจะสร้าง 4 Lot (ถ้า lotSize = 150)
- Lot 1-3: 150 kg
- Lot 4: 50 kg

---

### Payload ตัวอย่างที่ 3: รับแบบขั้นต่ำ (Required fields only)

```json
{
  "materialId": 1,
  "totalQuantity": 250
}
```

---

### Response ตัวอย่าง

```json
{
  "success": true,
  "message": "Material received successfully",
  "data": {
    "id": 1,
    "receivingNo": "RCV-2024-0001",
    "receivingDate": "2024-01-15T10:30:00.000Z",
    "materialId": 1,
    "supplierId": 1,
    "totalQuantity": 1000,
    "unit": "KG",
    "poNo": "PO-2024-001",
    "remark": "รับเหล็กแผ่นจากซัพพลายเออร์ ABC Steel",
    "status": "ACTIVE",
    "material": {
      "id": 1,
      "matCode": "MAT-001",
      "unit": "KG",
      "itemsName": {
        "name": "เหล็กแผ่น",
        "description": "เหล็กแผ่นคุณภาพสูง"
      }
    },
    "supplier": {
      "id": 1,
      "code": "SUP001",
      "name": "ABC Steel Corporation"
    },
    "lots": [
      {
        "id": 1,
        "lotNo": "LOT-2024-0001",
        "qrCode": "QR-LOT-2024-0001-1705312345-ABC123",
        "quantity": 100,
        "remainingQuantity": 100,
        "unit": "KG",
        "status": "AVAILABLE",
        "locationId": 1,
        "createDate": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": 2,
        "lotNo": "LOT-2024-0002",
        "qrCode": "QR-LOT-2024-0002-1705312346-DEF456",
        "quantity": 100,
        "remainingQuantity": 100,
        "unit": "KG",
        "status": "AVAILABLE",
        "locationId": 1,
        "createDate": "2024-01-15T10:30:01.000Z"
      }
      // ... 8 lots อื่นๆ
    ]
  }
}
```

---

## 📤 2. จ่ายวัตถุดิบออก (Issuing)

### Endpoint
```
POST /materials/transactions/issue
```

### Payload ตัวอย่างที่ 1: จ่ายให้แผนกผลิต 250 kg

```json
{
  "materialId": 1,
  "quantity": 250,
  "department": "Production",
  "workOrderNo": "WO-2024-001",
  "remark": "เบิกเหล็กแผ่นสำหรับผลิตชิ้นงาน A",
  "createBy": "admin"
}
```

**ผลลัพธ์:** ระบบจะจ่ายแบบ FIFO อัตโนมัติ
- LOT-0001: 100 kg (หมด)
- LOT-0002: 100 kg (หมด)
- LOT-0003: 50 kg (เหลือ 50 kg)

---

### Payload ตัวอย่างที่ 2: จ่ายแบบขั้นต่ำ

```json
{
  "materialId": 2,
  "quantity": 75,
  "department": "Assembly"
}
```

---

### Response ตัวอย่าง

```json
{
  "success": true,
  "message": "Material issued successfully",
  "data": {
    "id": 1,
    "issuingNo": "ISS-2024-0001",
    "issuingDate": "2024-01-20T14:30:00.000Z",
    "materialId": 1,
    "totalQuantity": 250,
    "unit": "KG",
    "department": "Production",
    "workOrderNo": "WO-2024-001",
    "remark": "เบิกเหล็กแผ่นสำหรับผลิตชิ้นงาน A",
    "status": "COMPLETED",
    "material": {
      "id": 1,
      "matCode": "MAT-001",
      "unit": "KG",
      "itemsName": {
        "name": "เหล็กแผ่น"
      }
    },
    "lots": [
      {
        "id": 1,
        "lotId": 1,
        "qrCode": "QR-LOT-2024-0001-1705312345-ABC123",
        "quantity": 100,
        "unit": "KG",
        "lot": {
          "lotNo": "LOT-2024-0001",
          "remainingQuantity": 0,
          "status": "USED_UP"
        }
      },
      {
        "id": 2,
        "lotId": 2,
        "qrCode": "QR-LOT-2024-0002-1705312346-DEF456",
        "quantity": 100,
        "unit": "KG",
        "lot": {
          "lotNo": "LOT-2024-0002",
          "remainingQuantity": 0,
          "status": "USED_UP"
        }
      },
      {
        "id": 3,
        "lotId": 3,
        "qrCode": "QR-LOT-2024-0003-1705312347-GHI789",
        "quantity": 50,
        "unit": "KG",
        "lot": {
          "lotNo": "LOT-2024-0003",
          "remainingQuantity": 50,
          "status": "PARTIAL_USED"
        }
      }
    ]
  }
}
```

---

## 🎨 React + Axios Examples

### Service Layer

```typescript
// services/receiving-issuing.service.ts
import axios from 'axios';
import { 
  CreateReceivingRequest, 
  CreateIssuingRequest,
  ReceivingResponse,
  IssuingResponse,
  ApiResponse 
} from '../types/receiving-issuing.types';

const API_BASE_URL = 'http://localhost:3000/materials/transactions';

export const receivingIssuingService = {
  // รับวัตถุดิบเข้า
  createReceiving: async (data: CreateReceivingRequest): Promise<ReceivingResponse> => {
    const response = await axios.post<ApiResponse<ReceivingResponse>>(
      `${API_BASE_URL}/receive`,
      data
    );
    return response.data.data;
  },

  // จ่ายวัตถุดิบออก
  createIssuing: async (data: CreateIssuingRequest): Promise<IssuingResponse> => {
    const response = await axios.post<ApiResponse<IssuingResponse>>(
      `${API_BASE_URL}/issue`,
      data
    );
    return response.data.data;
  }
};
```

---

### React Component - Receiving Form

```tsx
// components/ReceivingForm.tsx
import React, { useState } from 'react';
import { receivingIssuingService } from '../services/receiving-issuing.service';
import { CreateReceivingRequest } from '../types/receiving-issuing.types';

export const ReceivingForm: React.FC = () => {
  const [form, setForm] = useState<CreateReceivingRequest>({
    materialId: 1,
    totalQuantity: 0,
    supplierId: 1,
    poNo: '',
    locationId: 1,
    expiryDate: '',
    remark: '',
    createBy: 'admin'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await receivingIssuingService.createReceiving(form);
      
      alert(`✅ รับวัตถุดิบสำเร็จ!\n` +
            `เลขที่ใบรับ: ${result.receivingNo}\n` +
            `จำนวน Lot: ${result.lots.length} Lot\n` +
            `จำนวนรวม: ${result.totalQuantity} ${result.unit}`);
      
      // แสดง QR Codes
      console.log('📦 Lots Created:', result.lots);
      
      // Reset form
      setForm({
        ...form,
        totalQuantity: 0,
        poNo: '',
        remark: ''
      });
    } catch (error: any) {
      alert(`❌ เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>รับวัตถุดิบเข้า</h2>
      
      <div>
        <label>วัตถุดิบ *</label>
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
        <label>จำนวนรวม * (kg)</label>
        <input
          type="number"
          value={form.totalQuantity || ''}
          onChange={(e) => setForm({...form, totalQuantity: Number(e.target.value)})}
          placeholder="1000"
          required
        />
        <small>ระบบจะแยก Lot อัตโนมัติตาม Lot Size</small>
      </div>

      <div>
        <label>ซัพพลายเออร์</label>
        <select
          value={form.supplierId || ''}
          onChange={(e) => setForm({...form, supplierId: Number(e.target.value)})}
        >
          <option value="">-- เลือก --</option>
          <option value={1}>ABC Steel Corporation</option>
          <option value={2}>Global Electronics</option>
        </select>
      </div>

      <div>
        <label>เลขที่ PO</label>
        <input
          type="text"
          value={form.poNo || ''}
          onChange={(e) => setForm({...form, poNo: e.target.value})}
          placeholder="PO-2024-001"
        />
      </div>

      <div>
        <label>คลังจัดเก็บ</label>
        <select
          value={form.locationId || ''}
          onChange={(e) => setForm({...form, locationId: Number(e.target.value)})}
        >
          <option value={1}>คลังวัตถุดิบ A</option>
          <option value={2}>คลังวัตถุดิบ B</option>
        </select>
      </div>

      <div>
        <label>วันหมดอายุ</label>
        <input
          type="date"
          value={form.expiryDate || ''}
          onChange={(e) => setForm({...form, expiryDate: e.target.value})}
        />
      </div>

      <div>
        <label>หมายเหตุ</label>
        <textarea
          value={form.remark || ''}
          onChange={(e) => setForm({...form, remark: e.target.value})}
          rows={3}
        />
      </div>

      <button type="submit">บันทึกการรับวัตถุดิบ</button>
    </form>
  );
};
```

---

### React Component - Issuing Form

```tsx
// components/IssuingForm.tsx
import React, { useState } from 'react';
import { receivingIssuingService } from '../services/receiving-issuing.service';
import { CreateIssuingRequest } from '../types/receiving-issuing.types';

export const IssuingForm: React.FC = () => {
  const [form, setForm] = useState<CreateIssuingRequest>({
    materialId: 1,
    quantity: 0,
    department: '',
    workOrderNo: '',
    remark: '',
    createBy: 'admin'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await receivingIssuingService.createIssuing(form);
      
      alert(`✅ จ่ายวัตถุดิบสำเร็จ!\n` +
            `เลขที่ใบจ่าย: ${result.issuingNo}\n` +
            `จ่ายจาก ${result.lots.length} Lot (FIFO)\n` +
            `จำนวนรวม: ${result.totalQuantity} ${result.unit}`);
      
      // แสดง Lots ที่จ่าย
      console.log('📤 Lots Issued:', result.lots);
      
      // Reset form
      setForm({
        ...form,
        quantity: 0,
        workOrderNo: '',
        remark: ''
      });
    } catch (error: any) {
      alert(`❌ เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>จ่ายวัตถุดิบออก</h2>
      
      <div>
        <label>วัตถุดิบ *</label>
        <select 
          value={form.materialId}
          onChange={(e) => setForm({...form, materialId: Number(e.target.value)})}
          required
        >
          <option value={1}>เหล็กแผ่น</option>
          <option value={2}>พลาสติก</option>
        </select>
      </div>

      <div>
        <label>จำนวนที่ต้องการจ่าย * (kg)</label>
        <input
          type="number"
          value={form.quantity || ''}
          onChange={(e) => setForm({...form, quantity: Number(e.target.value)})}
          placeholder="250"
          required
        />
        <small>ระบบจะจ่ายแบบ FIFO อัตโนมัติ</small>
      </div>

      <div>
        <label>แผนกที่เบิก</label>
        <input
          type="text"
          value={form.department || ''}
          onChange={(e) => setForm({...form, department: e.target.value})}
          placeholder="Production"
        />
      </div>

      <div>
        <label>เลขที่ใบสั่งผลิต</label>
        <input
          type="text"
          value={form.workOrderNo || ''}
          onChange={(e) => setForm({...form, workOrderNo: e.target.value})}
          placeholder="WO-2024-001"
        />
      </div>

      <div>
        <label>หมายเหตุ</label>
        <textarea
          value={form.remark || ''}
          onChange={(e) => setForm({...form, remark: e.target.value})}
          rows={3}
        />
      </div>

      <button type="submit">บันทึกการจ่ายวัตถุดิบ</button>
    </form>
  );
};
```

---

## 📋 Quick Copy Payloads

### รับเข้า - ตัวอย่างพร้อมใช้

```javascript
// ตัวอย่างที่ 1: รับเหล็กแผ่น 1000 kg
const payload1 = {
  materialId: 1,
  totalQuantity: 1000,
  supplierId: 1,
  poNo: "PO-2024-001",
  locationId: 1,
  createBy: "admin"
};

// ตัวอย่างที่ 2: รับพลาสติก 500 kg พร้อมวันหมดอายุ
const payload2 = {
  materialId: 2,
  totalQuantity: 500,
  supplierId: 3,
  locationId: 2,
  expiryDate: "2025-12-31",
  createBy: "admin"
};

// ตัวอย่างที่ 3: แบบขั้นต่ำ
const payload3 = {
  materialId: 1,
  totalQuantity: 250
};
```

### จ่ายออก - ตัวอย่างพร้อมใช้

```javascript
// ตัวอย่างที่ 1: จ่ายให้แผนกผลิต
const payload1 = {
  materialId: 1,
  quantity: 250,
  department: "Production",
  workOrderNo: "WO-2024-001",
  createBy: "admin"
};

// ตัวอย่างที่ 2: แบบขั้นต่ำ
const payload2 = {
  materialId: 2,
  quantity: 75
};
```

---

## ✅ Validation Rules

### Receiving
- ✅ `materialId` - Required, must exist
- ✅ `totalQuantity` - Required, > 0
- ⚪ `supplierId` - Optional, must exist if provided
- ⚪ `poNo` - Optional, string
- ⚪ `locationId` - Optional, must exist if provided
- ⚪ `expiryDate` - Optional, format: YYYY-MM-DD
- ⚪ `remark` - Optional, string

### Issuing
- ✅ `materialId` - Required, must exist
- ✅ `quantity` - Required, > 0, must have enough stock
- ⚪ `department` - Optional, string
- ⚪ `workOrderNo` - Optional, string
- ⚪ `remark` - Optional, string
