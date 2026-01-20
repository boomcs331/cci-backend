# API การรับเข้าวัตถุดิบ + ตัวอย่าง Frontend

## 📥 API: รับวัตถุดิบเข้า

### Endpoint
```
POST /materials/transactions/receive
```

### Request Body
```typescript
{
  materialId: number;           // ID ของวัตถุดิบ (required)
  totalQuantity: number;        // จำนวนรวมทั้งหมด (required)
  supplierId?: number;          // ID ของซัพพลายเออร์ (optional)
  poNo?: string;                // เลขที่ PO (optional)
  remark?: string;              // หมายเหตุ (optional)
  lots: [                       // รายการ Lot ย่อย (required)
    {
      quantity: number;         // จำนวนใน Lot นี้
      locationId?: number;      // ตำแหน่งจัดเก็บ
      expiryDate?: string;      // วันหมดอายุ (YYYY-MM-DD)
    }
  ];
  createBy?: string;            // ผู้สร้าง (optional)
}
```

### Response
```typescript
{
  success: true,
  message: "Material received successfully",
  data: {
    id: number,
    receivingNo: string,        // เลขที่ใบรับ (RCV-2024-0001)
    receivingDate: string,
    materialId: number,
    supplierId: number,
    totalQuantity: number,
    unit: string,
    poNo: string,
    status: string,
    lots: [
      {
        id: number,
        lotNo: string,          // เลข Lot (LOT-2024-0001)
        qrCode: string,         // QR Code
        quantity: number,
        remainingQuantity: number,
        status: string
      }
    ]
  }
}
```

---

## 🎨 ตัวอย่าง Frontend Code

### 1. React + TypeScript + Axios

#### Types Definition
```typescript
// types/receiving.types.ts
export interface CreateReceivingLot {
  quantity: number;
  locationId?: number;
  expiryDate?: string;
}

export interface CreateReceivingRequest {
  materialId: number;
  totalQuantity: number;
  supplierId?: number;
  poNo?: string;
  remark?: string;
  lots: CreateReceivingLot[];
  createBy?: string;
}

export interface ReceivingLot {
  id: number;
  lotNo: string;
  qrCode: string;
  quantity: number;
  remainingQuantity: number;
  status: string;
  unit: string;
}

export interface ReceivingResponse {
  id: number;
  receivingNo: string;
  receivingDate: string;
  materialId: number;
  supplierId: number;
  totalQuantity: number;
  unit: string;
  poNo: string;
  status: string;
  lots: ReceivingLot[];
}
```

#### API Service
```typescript
// services/receiving.service.ts
import axios from 'axios';
import { CreateReceivingRequest, ReceivingResponse } from '../types/receiving.types';

const API_BASE_URL = 'http://localhost:3000';

export const receivingService = {
  // รับวัตถุดิบเข้า
  createReceiving: async (data: CreateReceivingRequest): Promise<ReceivingResponse> => {
    const response = await axios.post(
      `${API_BASE_URL}/materials/transactions/receive`,
      data
    );
    return response.data.data;
  },

  // ดูรายการรับทั้งหมด
  getAllReceivings: async (): Promise<ReceivingResponse[]> => {
    const response = await axios.get(
      `${API_BASE_URL}/materials/transactions/receivings`
    );
    return response.data.data;
  }
};
```

#### React Component - Form รับวัตถุดิบ
```tsx
// components/ReceivingForm.tsx
import React, { useState } from 'react';
import { receivingService } from '../services/receiving.service';
import { CreateReceivingLot } from '../types/receiving.types';

export const ReceivingForm: React.FC = () => {
  const [materialId, setMaterialId] = useState<number>(1);
  const [supplierId, setSupplierId] = useState<number>(1);
  const [poNo, setPoNo] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [lots, setLots] = useState<CreateReceivingLot[]>([
    { quantity: 100, locationId: 1 }
  ]);
  const [loading, setLoading] = useState(false);

  // เพิ่ม Lot
  const addLot = () => {
    setLots([...lots, { quantity: 0, locationId: 1 }]);
  };

  // ลบ Lot
  const removeLot = (index: number) => {
    setLots(lots.filter((_, i) => i !== index));
  };

  // อัพเดท Lot
  const updateLot = (index: number, field: keyof CreateReceivingLot, value: any) => {
    const newLots = [...lots];
    newLots[index] = { ...newLots[index], [field]: value };
    setLots(newLots);
  };

  // คำนวณจำนวนรวม
  const totalQuantity = lots.reduce((sum, lot) => sum + (lot.quantity || 0), 0);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (totalQuantity === 0) {
      alert('กรุณาระบุจำนวนวัตถุดิบ');
      return;
    }

    setLoading(true);
    try {
      const result = await receivingService.createReceiving({
        materialId,
        totalQuantity,
        supplierId,
        poNo,
        remark,
        lots,
        createBy: 'admin'
      });

      alert(`รับวัตถุดิบสำเร็จ!\nเลขที่ใบรับ: ${result.receivingNo}`);
      
      // แสดง QR Codes
      console.log('QR Codes:', result.lots.map(lot => ({
        lotNo: lot.lotNo,
        qrCode: lot.qrCode
      })));

      // Reset form
      setPoNo('');
      setRemark('');
      setLots([{ quantity: 100, locationId: 1 }]);
    } catch (error: any) {
      alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="receiving-form">
      <h2>รับวัตถุดิบเข้า</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Material Selection */}
        <div className="form-group">
          <label>วัตถุดิบ:</label>
          <select 
            value={materialId} 
            onChange={(e) => setMaterialId(Number(e.target.value))}
            required
          >
            <option value={1}>เหล็กแผ่น (MAT-001)</option>
            <option value={2}>พลาสติก (MAT-002)</option>
          </select>
        </div>

        {/* Supplier Selection */}
        <div className="form-group">
          <label>ซัพพลายเออร์:</label>
          <select 
            value={supplierId} 
            onChange={(e) => setSupplierId(Number(e.target.value))}
          >
            <option value={1}>ABC Steel Corporation</option>
            <option value={2}>Global Electronics</option>
          </select>
        </div>

        {/* PO Number */}
        <div className="form-group">
          <label>เลขที่ PO:</label>
          <input 
            type="text" 
            value={poNo}
            onChange={(e) => setPoNo(e.target.value)}
            placeholder="PO-2024-001"
          />
        </div>

        {/* Lots */}
        <div className="lots-section">
          <h3>รายการ Lot (แยกย่อย)</h3>
          
          {lots.map((lot, index) => (
            <div key={index} className="lot-item">
              <span>Lot {index + 1}</span>
              
              <input
                type="number"
                placeholder="จำนวน"
                value={lot.quantity || ''}
                onChange={(e) => updateLot(index, 'quantity', Number(e.target.value))}
                required
              />

              <select
                value={lot.locationId || ''}
                onChange={(e) => updateLot(index, 'locationId', Number(e.target.value))}
              >
                <option value={1}>คลังวัตถุดิบ A</option>
                <option value={2}>คลังวัตถุดิบ B</option>
              </select>

              <input
                type="date"
                value={lot.expiryDate || ''}
                onChange={(e) => updateLot(index, 'expiryDate', e.target.value)}
                placeholder="วันหมดอายุ"
              />

              <button type="button" onClick={() => removeLot(index)}>
                ลบ
              </button>
            </div>
          ))}

          <button type="button" onClick={addLot}>
            + เพิ่ม Lot
          </button>
        </div>

        {/* Total */}
        <div className="total-section">
          <strong>จำนวนรวม: {totalQuantity} KG</strong>
        </div>

        {/* Remark */}
        <div className="form-group">
          <label>หมายเหตุ:</label>
          <textarea 
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
          />
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}>
          {loading ? 'กำลังบันทึก...' : 'บันทึกการรับวัตถุดิบ'}
        </button>
      </form>
    </div>
  );
};
```

---

### 2. Vue 3 + TypeScript + Axios

```vue
<!-- components/ReceivingForm.vue -->
<template>
  <div class="receiving-form">
    <h2>รับวัตถุดิบเข้า</h2>
    
    <form @submit.prevent="handleSubmit">
      <!-- Material -->
      <div class="form-group">
        <label>วัตถุดิบ:</label>
        <select v-model="form.materialId" required>
          <option :value="1">เหล็กแผ่น (MAT-001)</option>
          <option :value="2">พลาสติก (MAT-002)</option>
        </select>
      </div>

      <!-- Supplier -->
      <div class="form-group">
        <label>ซัพพลายเออร์:</label>
        <select v-model="form.supplierId">
          <option :value="1">ABC Steel Corporation</option>
          <option :value="2">Global Electronics</option>
        </select>
      </div>

      <!-- PO Number -->
      <div class="form-group">
        <label>เลขที่ PO:</label>
        <input v-model="form.poNo" type="text" placeholder="PO-2024-001" />
      </div>

      <!-- Lots -->
      <div class="lots-section">
        <h3>รายการ Lot</h3>
        
        <div v-for="(lot, index) in form.lots" :key="index" class="lot-item">
          <span>Lot {{ index + 1 }}</span>
          
          <input
            v-model.number="lot.quantity"
            type="number"
            placeholder="จำนวน"
            required
          />

          <select v-model="lot.locationId">
            <option :value="1">คลังวัตถุดิบ A</option>
            <option :value="2">คลังวัตถุดิบ B</option>
          </select>

          <input
            v-model="lot.expiryDate"
            type="date"
            placeholder="วันหมดอายุ"
          />

          <button type="button" @click="removeLot(index)">ลบ</button>
        </div>

        <button type="button" @click="addLot">+ เพิ่ม Lot</button>
      </div>

      <!-- Total -->
      <div class="total-section">
        <strong>จำนวนรวม: {{ totalQuantity }} KG</strong>
      </div>

      <!-- Remark -->
      <div class="form-group">
        <label>หมายเหตุ:</label>
        <textarea v-model="form.remark" rows="3"></textarea>
      </div>

      <!-- Submit -->
      <button type="submit" :disabled="loading">
        {{ loading ? 'กำลังบันทึก...' : 'บันทึกการรับวัตถุดิบ' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';

interface Lot {
  quantity: number;
  locationId?: number;
  expiryDate?: string;
}

const form = ref({
  materialId: 1,
  supplierId: 1,
  poNo: '',
  remark: '',
  lots: [{ quantity: 100, locationId: 1 }] as Lot[]
});

const loading = ref(false);

const totalQuantity = computed(() => {
  return form.value.lots.reduce((sum, lot) => sum + (lot.quantity || 0), 0);
});

const addLot = () => {
  form.value.lots.push({ quantity: 0, locationId: 1 });
};

const removeLot = (index: number) => {
  form.value.lots.splice(index, 1);
};

const handleSubmit = async () => {
  if (totalQuantity.value === 0) {
    alert('กรุณาระบุจำนวนวัตถุดิบ');
    return;
  }

  loading.value = true;
  try {
    const response = await axios.post(
      'http://localhost:3000/materials/transactions/receive',
      {
        ...form.value,
        totalQuantity: totalQuantity.value,
        createBy: 'admin'
      }
    );

    const result = response.data.data;
    alert(`รับวัตถุดิบสำเร็จ!\nเลขที่ใบรับ: ${result.receivingNo}`);
    
    // Reset form
    form.value.poNo = '';
    form.value.remark = '';
    form.value.lots = [{ quantity: 100, locationId: 1 }];
  } catch (error: any) {
    alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};
</script>
```

---

### 3. ตัวอย่างการใช้งานแบบง่าย (Vanilla JavaScript)

```html
<!DOCTYPE html>
<html>
<head>
  <title>รับวัตถุดิบเข้า</title>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
</head>
<body>
  <h2>รับวัตถุดิบเข้า</h2>
  
  <form id="receivingForm">
    <div>
      <label>วัตถุดิบ:</label>
      <select id="materialId">
        <option value="1">เหล็กแผ่น</option>
        <option value="2">พลาสติก</option>
      </select>
    </div>

    <div>
      <label>ซัพพลายเออร์:</label>
      <select id="supplierId">
        <option value="1">ABC Steel</option>
        <option value="2">Global Electronics</option>
      </select>
    </div>

    <div>
      <label>เลขที่ PO:</label>
      <input type="text" id="poNo" placeholder="PO-2024-001">
    </div>

    <div id="lotsContainer">
      <h3>รายการ Lot</h3>
      <div class="lot-item">
        <input type="number" class="lot-quantity" placeholder="จำนวน" value="100">
        <select class="lot-location">
          <option value="1">คลังวัตถุดิบ A</option>
          <option value="2">คลังวัตถุดิบ B</option>
        </select>
      </div>
    </div>

    <button type="button" onclick="addLot()">+ เพิ่ม Lot</button>
    <br><br>

    <div>
      <label>หมายเหตุ:</label>
      <textarea id="remark" rows="3"></textarea>
    </div>

    <button type="submit">บันทึกการรับวัตถุดิบ</button>
  </form>

  <script>
    const API_URL = 'http://localhost:3000/materials/transactions/receive';

    // เพิ่ม Lot
    function addLot() {
      const container = document.getElementById('lotsContainer');
      const lotItem = document.createElement('div');
      lotItem.className = 'lot-item';
      lotItem.innerHTML = `
        <input type="number" class="lot-quantity" placeholder="จำนวน" value="0">
        <select class="lot-location">
          <option value="1">คลังวัตถุดิบ A</option>
          <option value="2">คลังวัตถุดิบ B</option>
        </select>
        <button type="button" onclick="this.parentElement.remove()">ลบ</button>
      `;
      container.appendChild(lotItem);
    }

    // Submit Form
    document.getElementById('receivingForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      // รวบรวมข้อมูล Lots
      const lotElements = document.querySelectorAll('.lot-item');
      const lots = Array.from(lotElements).map(item => ({
        quantity: Number(item.querySelector('.lot-quantity').value),
        locationId: Number(item.querySelector('.lot-location').value)
      }));

      // คำนวณจำนวนรวม
      const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);

      if (totalQuantity === 0) {
        alert('กรุณาระบุจำนวนวัตถุดิบ');
        return;
      }

      // เตรียมข้อมูล
      const data = {
        materialId: Number(document.getElementById('materialId').value),
        supplierId: Number(document.getElementById('supplierId').value),
        poNo: document.getElementById('poNo').value,
        remark: document.getElementById('remark').value,
        totalQuantity,
        lots,
        createBy: 'admin'
      };

      try {
        const response = await axios.post(API_URL, data);
        const result = response.data.data;
        
        alert(`รับวัตถุดิบสำเร็จ!\nเลขที่ใบรับ: ${result.receivingNo}`);
        
        // แสดง QR Codes
        console.log('QR Codes:', result.lots);
        
        // Reset form
        document.getElementById('receivingForm').reset();
      } catch (error) {
        alert(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    });
  </script>
</body>
</html>
```

---

## 📋 ตัวอย่างข้อมูลที่ส่ง

### ตัวอย่างที่ 1: รับเหล็กแผ่น 1,000 kg แยกเป็น 10 Lot
```json
{
  "materialId": 1,
  "totalQuantity": 1000,
  "supplierId": 1,
  "poNo": "PO-2024-001",
  "remark": "รับเหล็กแผ่นจากซัพพลายเออร์ ABC",
  "lots": [
    { "quantity": 100, "locationId": 1 },
    { "quantity": 100, "locationId": 1 },
    { "quantity": 100, "locationId": 1 },
    { "quantity": 100, "locationId": 1 },
    { "quantity": 100, "locationId": 1 },
    { "quantity": 100, "locationId": 1 },
    { "quantity": 100, "locationId": 1 },
    { "quantity": 100, "locationId": 1 },
    { "quantity": 100, "locationId": 1 },
    { "quantity": 100, "locationId": 1 }
  ],
  "createBy": "admin"
}
```

### ตัวอย่างที่ 2: รับพลาสติก 500 kg แยกเป็น 5 Lot พร้อมวันหมดอายุ
```json
{
  "materialId": 2,
  "totalQuantity": 500,
  "supplierId": 3,
  "poNo": "PO-2024-002",
  "lots": [
    { "quantity": 100, "locationId": 2, "expiryDate": "2025-12-31" },
    { "quantity": 100, "locationId": 2, "expiryDate": "2025-12-31" },
    { "quantity": 100, "locationId": 2, "expiryDate": "2025-12-31" },
    { "quantity": 100, "locationId": 2, "expiryDate": "2025-12-31" },
    { "quantity": 100, "locationId": 2, "expiryDate": "2025-12-31" }
  ],
  "createBy": "admin"
}
```

---

## 🎯 Tips สำหรับ Frontend

1. **Validation**: ตรวจสอบว่า totalQuantity = ผลรวมของ lots
2. **QR Code Display**: ใช้ library เช่น `qrcode.react` หรือ `qrcode` เพื่อแสดง QR Code
3. **Print Labels**: สร้างฟังก์ชันพิมพ์ Label สำหรับแต่ละ Lot
4. **Error Handling**: จัดการ error ที่อาจเกิดขึ้น (material not found, insufficient data)
5. **Loading State**: แสดง loading indicator ขณะบันทึกข้อมูล

---

## 🔗 Related APIs

- `GET /materials` - ดูรายการวัตถุดิบทั้งหมด
- `GET /materials/suppliers/all` - ดูรายการซัพพลายเออร์
- `GET /materials/locations/all` - ดูรายการคลัง
- `GET /materials/transactions/receivings` - ดูรายการรับทั้งหมด
