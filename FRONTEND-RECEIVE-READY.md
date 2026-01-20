# Frontend Code - Material Receiving (พร้อมใช้งาน)

## 🎯 React + TypeScript (Copy & Paste)

### 1. Types Definition
```typescript
// types/receiving.types.ts
export interface ReceivingFormData {
  materialId: number;
  totalQuantity: number;
  supplierId?: number;
  poNo?: string;
  locationId?: number;
  expiryDate?: string;
  remark?: string;
}

export interface Lot {
  id: number;
  lotNo: string;
  qrCode: string;
  quantity: number;
  remainingQuantity: number;
  status: string;
}

export interface ReceivingResponse {
  id: number;
  receivingNo: string;
  receivingDate: string;
  totalQuantity: number;
  unit: string;
  lots: Lot[];
}
```

---

### 2. API Service (Axios)
```typescript
// services/receiving.service.ts
import axios from 'axios';
import { ReceivingFormData, ReceivingResponse } from '../types/receiving.types';

const API_URL = 'http://localhost:3000/materials/transactions/receive';

export const receivingService = {
  create: async (data: ReceivingFormData): Promise<ReceivingResponse> => {
    const response = await axios.post(API_URL, {
      ...data,
      createBy: 'admin'
    });
    return response.data.data;
  }
};
```

---

### 3. React Component (Simple Form)
```tsx
// components/ReceivingForm.tsx
import React, { useState } from 'react';
import axios from 'axios';

export const ReceivingForm: React.FC = () => {
  const [materialId, setMaterialId] = useState(1);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [supplierId, setSupplierId] = useState(1);
  const [poNo, setPoNo] = useState('');
  const [locationId, setLocationId] = useState(1);
  const [expiryDate, setExpiryDate] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:3000/materials/transactions/receive',
        {
          materialId,
          totalQuantity,
          supplierId,
          poNo,
          locationId,
          expiryDate: expiryDate || undefined,
          remark,
          createBy: 'admin'
        }
      );

      const result = response.data.data;
      alert(`✅ รับวัตถุดิบสำเร็จ!\n` +
            `เลขที่ใบรับ: ${result.receivingNo}\n` +
            `จำนวน Lot: ${result.lots.length} Lot`);

      // Reset form
      setTotalQuantity(0);
      setPoNo('');
      setRemark('');
    } catch (error: any) {
      alert(`❌ Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h2>รับวัตถุดิบเข้า</h2>

      <div style={{ marginBottom: 15 }}>
        <label>วัตถุดิบ *</label>
        <select 
          value={materialId}
          onChange={(e) => setMaterialId(Number(e.target.value))}
          style={{ width: '100%', padding: 8 }}
          required
        >
          <option value={1}>เหล็กแผ่น (Lot Size: 100 kg)</option>
          <option value={2}>พลาสติก (Lot Size: 150 kg)</option>
          <option value={3}>อลูมิเนียม (Lot Size: 50 kg)</option>
        </select>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>จำนวนรวม (kg) *</label>
        <input
          type="number"
          value={totalQuantity || ''}
          onChange={(e) => setTotalQuantity(Number(e.target.value))}
          style={{ width: '100%', padding: 8 }}
          placeholder="1000"
          required
        />
        <small style={{ color: '#666' }}>ระบบจะแยก Lot อัตโนมัติตาม Lot Size</small>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>ซัพพลายเออร์</label>
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(Number(e.target.value))}
          style={{ width: '100%', padding: 8 }}
        >
          <option value={1}>ABC Steel Corporation</option>
          <option value={2}>Global Electronics</option>
          <option value={3}>Premium Plastics</option>
        </select>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>เลขที่ PO</label>
        <input
          type="text"
          value={poNo}
          onChange={(e) => setPoNo(e.target.value)}
          style={{ width: '100%', padding: 8 }}
          placeholder="PO-2024-001"
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>คลังจัดเก็บ</label>
        <select
          value={locationId}
          onChange={(e) => setLocationId(Number(e.target.value))}
          style={{ width: '100%', padding: 8 }}
        >
          <option value={1}>คลังวัตถุดิบ A</option>
          <option value={2}>คลังวัตถุดิบ B</option>
          <option value={3}>คลังวัตถุดิบ C</option>
        </select>
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>วันหมดอายุ</label>
        <input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 15 }}>
        <label>หมายเหตุ</label>
        <textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          style={{ width: '100%', padding: 8 }}
          rows={3}
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        style={{ 
          width: '100%', 
          padding: 12, 
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'กำลังบันทึก...' : 'บันทึกการรับวัตถุดิบ'}
      </button>
    </form>
  );
};

export default ReceivingForm;
```

---

## 🎨 Vue 3 + Composition API (Copy & Paste)

```vue
<!-- components/ReceivingForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="receiving-form">
    <h2>รับวัตถุดิบเข้า</h2>

    <div class="form-group">
      <label>วัตถุดิบ *</label>
      <select v-model="form.materialId" required>
        <option :value="1">เหล็กแผ่น (Lot Size: 100 kg)</option>
        <option :value="2">พลาสติก (Lot Size: 150 kg)</option>
        <option :value="3">อลูมิเนียม (Lot Size: 50 kg)</option>
      </select>
    </div>

    <div class="form-group">
      <label>จำนวนรวม (kg) *</label>
      <input 
        v-model.number="form.totalQuantity" 
        type="number" 
        placeholder="1000"
        required 
      />
      <small>ระบบจะแยก Lot อัตโนมัติตาม Lot Size</small>
    </div>

    <div class="form-group">
      <label>ซัพพลายเออร์</label>
      <select v-model="form.supplierId">
        <option :value="1">ABC Steel Corporation</option>
        <option :value="2">Global Electronics</option>
        <option :value="3">Premium Plastics</option>
      </select>
    </div>

    <div class="form-group">
      <label>เลขที่ PO</label>
      <input v-model="form.poNo" type="text" placeholder="PO-2024-001" />
    </div>

    <div class="form-group">
      <label>คลังจัดเก็บ</label>
      <select v-model="form.locationId">
        <option :value="1">คลังวัตถุดิบ A</option>
        <option :value="2">คลังวัตถุดิบ B</option>
        <option :value="3">คลังวัตถุดิบ C</option>
      </select>
    </div>

    <div class="form-group">
      <label>วันหมดอายุ</label>
      <input v-model="form.expiryDate" type="date" />
    </div>

    <div class="form-group">
      <label>หมายเหตุ</label>
      <textarea v-model="form.remark" rows="3"></textarea>
    </div>

    <button type="submit" :disabled="loading" class="btn-submit">
      {{ loading ? 'กำลังบันทึก...' : 'บันทึกการรับวัตถุดิบ' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';

const form = ref({
  materialId: 1,
  totalQuantity: 0,
  supplierId: 1,
  poNo: '',
  locationId: 1,
  expiryDate: '',
  remark: ''
});

const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;

  try {
    const response = await axios.post(
      'http://localhost:3000/materials/transactions/receive',
      {
        ...form.value,
        createBy: 'admin'
      }
    );

    const result = response.data.data;
    alert(`✅ รับวัตถุดิบสำเร็จ!\n` +
          `เลขที่ใบรับ: ${result.receivingNo}\n` +
          `จำนวน Lot: ${result.lots.length} Lot`);

    // Reset form
    form.value.totalQuantity = 0;
    form.value.poNo = '';
    form.value.remark = '';
  } catch (error: any) {
    alert(`❌ Error: ${error.response?.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.receiving-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group small {
  color: #666;
  font-size: 12px;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
```

---

## 📱 Vanilla JavaScript (HTML + JS)

```html
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รับวัตถุดิบเข้า</title>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    input, select, textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      padding: 12px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    small {
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h2>รับวัตถุดิบเข้า</h2>

  <form id="receivingForm">
    <div class="form-group">
      <label>วัตถุดิบ *</label>
      <select id="materialId" required>
        <option value="1">เหล็กแผ่น (Lot Size: 100 kg)</option>
        <option value="2">พลาสติก (Lot Size: 150 kg)</option>
        <option value="3">อลูมิเนียม (Lot Size: 50 kg)</option>
      </select>
    </div>

    <div class="form-group">
      <label>จำนวนรวม (kg) *</label>
      <input type="number" id="totalQuantity" placeholder="1000" required>
      <small>ระบบจะแยก Lot อัตโนมัติตาม Lot Size</small>
    </div>

    <div class="form-group">
      <label>ซัพพลายเออร์</label>
      <select id="supplierId">
        <option value="1">ABC Steel Corporation</option>
        <option value="2">Global Electronics</option>
        <option value="3">Premium Plastics</option>
      </select>
    </div>

    <div class="form-group">
      <label>เลขที่ PO</label>
      <input type="text" id="poNo" placeholder="PO-2024-001">
    </div>

    <div class="form-group">
      <label>คลังจัดเก็บ</label>
      <select id="locationId">
        <option value="1">คลังวัตถุดิบ A</option>
        <option value="2">คลังวัตถุดิบ B</option>
        <option value="3">คลังวัตถุดิบ C</option>
      </select>
    </div>

    <div class="form-group">
      <label>วันหมดอายุ</label>
      <input type="date" id="expiryDate">
    </div>

    <div class="form-group">
      <label>หมายเหตุ</label>
      <textarea id="remark" rows="3"></textarea>
    </div>

    <button type="submit" id="submitBtn">บันทึกการรับวัตถุดิบ</button>
  </form>

  <script>
    const API_URL = 'http://localhost:3000/materials/transactions/receive';

    document.getElementById('receivingForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังบันทึก...';

      const data = {
        materialId: Number(document.getElementById('materialId').value),
        totalQuantity: Number(document.getElementById('totalQuantity').value),
        supplierId: Number(document.getElementById('supplierId').value),
        poNo: document.getElementById('poNo').value || undefined,
        locationId: Number(document.getElementById('locationId').value),
        expiryDate: document.getElementById('expiryDate').value || undefined,
        remark: document.getElementById('remark').value || undefined,
        createBy: 'admin'
      };

      try {
        const response = await axios.post(API_URL, data);
        const result = response.data.data;

        alert(`✅ รับวัตถุดิบสำเร็จ!\n` +
              `เลขที่ใบรับ: ${result.receivingNo}\n` +
              `จำนวน Lot: ${result.lots.length} Lot\n` +
              `จำนวนรวม: ${result.totalQuantity} ${result.unit}`);

        // แสดง QR Codes
        console.log('📦 Lots Created:', result.lots);

        // Reset form
        document.getElementById('receivingForm').reset();
      } catch (error) {
        alert(`❌ Error: ${error.response?.data?.message || error.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'บันทึกการรับวัตถุดิบ';
      }
    });
  </script>
</body>
</html>
```

---

## 🔥 Quick Test (cURL)

```bash
# Test 1: รับเหล็กแผ่น 1000 kg
curl -X POST http://localhost:3000/materials/transactions/receive \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": 1,
    "totalQuantity": 1000,
    "supplierId": 1,
    "poNo": "PO-2024-001",
    "locationId": 1,
    "createBy": "admin"
  }'

# Test 2: รับแบบขั้นต่ำ
curl -X POST http://localhost:3000/materials/transactions/receive \
  -H "Content-Type: application/json" \
  -d '{
    "materialId": 1,
    "totalQuantity": 250
  }'
```

---

## ✅ สรุป

**3 Framework พร้อมใช้:**
1. ✅ React + TypeScript - Component เต็มรูปแบบ
2. ✅ Vue 3 + Composition API - Component พร้อม Style
3. ✅ Vanilla JavaScript - HTML เดียวใช้ได้เลย

**Copy ไปใช้ได้ทันที!** 🚀
