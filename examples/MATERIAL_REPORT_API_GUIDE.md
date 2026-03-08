# รายงานการรับเข้า-จ่ายออกวัตถุดิบ - คู่มือการใช้งาน

## API Endpoint

```
GET /materials/transactions/report/transactions
```

## Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| startDate | string | No | วันที่เริ่มต้น (YYYY-MM-DD) | 2024-01-01 |
| endDate | string | No | วันที่สิ้นสุด (YYYY-MM-DD) | 2024-12-31 |
| materialId | number | No | รหัสวัตถุดิบ | 1 |
| materialCode | string | No | รหัสวัตถุดิบ (ไม่ได้ใช้ในเวอร์ชันนี้) | MAT-001 |

## Response Format

```json
{
  "success": true,
  "message": "Transaction report retrieved successfully",
  "data": [
    {
      "materialId": 1,
      "materialCode": "MAT-001",
      "materialName": "วัตถุดิบ A",
      "transactionDate": "2024-01-15",
      "received": 500,
      "issued": 200,
      "balance": 300
    },
    {
      "materialId": 1,
      "materialCode": "MAT-001",
      "materialName": "วัตถุดิบ A",
      "transactionDate": "2024-01-16",
      "received": 300,
      "issued": 150,
      "balance": 150
    }
  ]
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| materialId | number | รหัสวัตถุดิบ |
| materialCode | string | รหัสวัตถุดิบ (MAT-XXX) |
| materialName | string | ชื่อวัตถุดิบ |
| transactionDate | string | วันที่ทำรายการ (YYYY-MM-DD) |
| received | number | ยอดรับเข้าในวันนั้น |
| issued | number | ยอดจ่ายออกในวันนั้น |
| balance | number | ยอดคงเหลือ (รับเข้า - จ่ายออก) |

## ตัวอย่างการใช้งาน

### 1. ดึงรายงานทั้งหมด
```bash
curl -X GET "http://localhost:3000/api/materials/transactions/report/transactions"
```

### 2. ดึงรายงานตามช่วงวันที่
```bash
curl -X GET "http://localhost:3000/api/materials/transactions/report/transactions?startDate=2024-01-01&endDate=2024-12-31"
```

### 3. ดึงรายงานของวัตถุดิบเฉพาะ
```bash
curl -X GET "http://localhost:3000/api/materials/transactions/report/transactions?materialId=1"
```

### 4. ดึงรายงานตามช่วงวันที่และวัตถุดิบ
```bash
curl -X GET "http://localhost:3000/api/materials/transactions/report/transactions?startDate=2024-01-01&endDate=2024-12-31&materialId=1"
```

## ตัวอย่างโค้ด Frontend

### React/TypeScript
ดูไฟล์: `material-transaction-report-frontend.tsx`

### Vue.js
ดูไฟล์: `material-transaction-report-frontend.vue`

### JavaScript Vanilla
ดูไฟล์: `material-transaction-report-frontend.html`

## การติดตั้งและใช้งาน

### React
```bash
npm install axios
```

```typescript
import { materialReportService } from './material-transaction-report-frontend';

// ใช้งาน
const report = await materialReportService.getTransactionReport({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  materialId: 1
});
```

### Vue.js
```bash
npm install axios
```

```vue
<script setup>
import MaterialTransactionReport from './material-transaction-report-frontend.vue';
</script>

<template>
  <MaterialTransactionReport />
</template>
```

### JavaScript Vanilla
เปิดไฟล์ `material-transaction-report-frontend.html` ในเบราว์เซอร์

## หมายเหตุ

1. ต้องเปลี่ยน `API_BASE_URL` ให้ตรงกับ URL ของ Backend
2. ถ้าใช้ CORS ต้องตั้งค่า Backend ให้รองรับ
3. ข้อมูลจะถูกคำนวณจาก `material_transaction` table
4. การคำนวณ:
   - ข้อมูลจะถูกกรุ๊ปตามวันที่และวัตถุดิบ
   - `received` = ผลรวมของ quantity ที่เป็นบวก (RECEIVE) ในวันนั้น
   - `issued` = ผลรวมของ quantity ที่เป็นลบ (ISSUE) ในวันนั้น แปลงเป็นค่าบวก
   - `balance` = received - issued

## Error Handling

```typescript
try {
  const report = await materialReportService.getTransactionReport(filters);
  // ใช้งานข้อมูล
} catch (error) {
  if (error.response?.status === 404) {
    console.error('ไม่พบข้อมูล');
  } else if (error.response?.status === 500) {
    console.error('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์');
  } else {
    console.error('เกิดข้อผิดพลาด:', error.message);
  }
}
```
