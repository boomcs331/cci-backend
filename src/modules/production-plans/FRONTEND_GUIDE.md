# ตัวอย่างสำหรับ Frontend

## 1. สร้างแผนการผลิต

### API Request
```typescript
POST /production-plans

// Request Body
{
  "planName": "แผนการผลิตเดือนมกราคม 2024",
  "planDate": "2024-01-15",
  "remarks": "หมายเหตุ (optional)",
  "items": [
    {
      "productId": 1,
      "quantity": 100,
      "unit": "ชิ้น",
      "remarks": "หมายเหตุสินค้า (optional)"
    }
  ]
}
```

### Response
```json
{
  "id": 1,
  "planCode": "PP2401-0001",
  "planName": "แผนการผลิตเดือนมกราคม 2024",
  "planDate": "2024-01-15",
  "status": "draft",
  "remarks": "หมายเหตุ",
  "createDate": "2024-01-10T10:00:00.000Z",
  "createBy": "admin",
  "updateDate": "2024-01-10T10:00:00.000Z",
  "updateBy": null,
  "items": [
    {
      "id": 1,
      "planId": 1,
      "productId": 1,
      "quantity": "100.0000",
      "unit": "ชิ้น",
      "remarks": "หมายเหตุสินค้า",
      "createDate": "2024-01-10T10:00:00.000Z",
      "product": {
        "id": 1,
        "productCode": "P001",
        "productName": "สินค้า A"
      }
    }
  ],
  "reservations": []
}
```

---

## 2. แบบฟอร์มสร้างแผน (React/Vue)

### TypeScript Interface
```typescript
interface ProductionPlanForm {
  planName: string;
  planDate: string;
  remarks?: string;
  items: PlanItem[];
}

interface PlanItem {
  productId: number;
  quantity: number;
  unit?: string;
  remarks?: string;
}

interface Product {
  id: number;
  productCode: string;
  productName: string;
}
```

### React Example
```tsx
import { useState } from 'react';

function CreatePlanForm() {
  const [form, setForm] = useState({
    planName: '',
    planDate: '',
    remarks: '',
    items: []
  });

  const [products, setProducts] = useState<Product[]>([]); // จาก API GET /products

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { productId: 0, quantity: 0, unit: 'ชิ้น', remarks: '' }]
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...form.items];
    newItems[index][field] = value;
    setForm({ ...form, items: newItems });
  };

  const removeItem = (index: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const submit = async () => {
    const response = await fetch('/production-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    console.log('Created:', data);
  };

  return (
    <div>
      <h2>สร้างแผนการผลิต</h2>
      
      <input
        type="text"
        placeholder="ชื่อแผน"
        value={form.planName}
        onChange={(e) => setForm({ ...form, planName: e.target.value })}
      />

      <input
        type="date"
        value={form.planDate}
        onChange={(e) => setForm({ ...form, planDate: e.target.value })}
      />

      <textarea
        placeholder="หมายเหตุ"
        value={form.remarks}
        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
      />

      <h3>รายการสินค้า</h3>
      {form.items.map((item, index) => (
        <div key={index}>
          <select
            value={item.productId}
            onChange={(e) => updateItem(index, 'productId', +e.target.value)}
          >
            <option value={0}>เลือกสินค้า</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.productName}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="จำนวน"
            value={item.quantity}
            onChange={(e) => updateItem(index, 'quantity', +e.target.value)}
          />

          <input
            type="text"
            placeholder="หน่วย"
            value={item.unit}
            onChange={(e) => updateItem(index, 'unit', e.target.value)}
          />

          <button onClick={() => removeItem(index)}>ลบ</button>
        </div>
      ))}

      <button onClick={addItem}>+ เพิ่มสินค้า</button>
      <button onClick={submit}>บันทึก</button>
    </div>
  );
}
```

---

## 3. ดูรายการแผนทั้งหมด

### API Request
```typescript
GET /production-plans
```

### Response
```json
[
  {
    "id": 1,
    "planCode": "PP2401-0001",
    "planName": "แผนการผลิตเดือนมกราคม 2024",
    "planDate": "2024-01-15",
    "status": "draft",
    "createDate": "2024-01-10T10:00:00.000Z",
    "items": [
      {
        "id": 1,
        "quantity": "100.0000",
        "product": {
          "id": 1,
          "productName": "สินค้า A"
        }
      }
    ]
  }
]
```

### React Table Example
```tsx
function PlanList() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetch('/production-plans')
      .then(res => res.json())
      .then(data => setPlans(data));
  }, []);

  const reserve = async (id: number) => {
    await fetch(`/production-plans/${id}/reserve`, { method: 'POST' });
    // Refresh list
  };

  const confirm = async (id: number) => {
    await fetch(`/production-plans/${id}/confirm`, { method: 'POST' });
    // Refresh list
  };

  return (
    <table>
      <thead>
        <tr>
          <th>รหัสแผน</th>
          <th>ชื่อแผน</th>
          <th>วันที่</th>
          <th>สถานะ</th>
          <th>จำนวนสินค้า</th>
          <th>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {plans.map(plan => (
          <tr key={plan.id}>
            <td>{plan.planCode}</td>
            <td>{plan.planName}</td>
            <td>{plan.planDate}</td>
            <td>
              <span className={`badge ${plan.status}`}>
                {plan.status === 'draft' && 'ร่าง'}
                {plan.status === 'reserved' && 'จองแล้ว'}
                {plan.status === 'confirmed' && 'ยืนยันแล้ว'}
                {plan.status === 'cancelled' && 'ยกเลิก'}
              </span>
            </td>
            <td>{plan.items?.length || 0} รายการ</td>
            <td>
              {plan.status === 'draft' && (
                <button onClick={() => reserve(plan.id)}>จอง Material</button>
              )}
              {plan.status === 'reserved' && (
                <button onClick={() => confirm(plan.id)}>ยืนยัน</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 4. จัดการรายการสินค้า (เพิ่ม/แก้ไข/ลบ)

### เพิ่มสินค้า
```typescript
POST /production-plans/:id/items

{
  "productId": 2,
  "quantity": 50,
  "unit": "ชิ้น",
  "remarks": "เพิ่มเติม"
}
```

### แก้ไขสินค้า
```typescript
PATCH /production-plans/:id/items/:itemId

{
  "quantity": 75
}
```

### ลบสินค้า
```typescript
DELETE /production-plans/:id/items/:itemId
```

---

## 5. Flow การใช้งาน

```
1. สร้างแผน (draft)
   ↓
2. เพิ่มสินค้า
   ↓
3. จอง Material (reserved)
   ↓
4. ยืนยันแผน (confirmed)
```

### Status Badge Colors
```css
.badge.draft { background: #gray; }
.badge.reserved { background: #orange; }
.badge.confirmed { background: #green; }
.badge.cancelled { background: #red; }
```

---

## 6. Validation Rules

- `planName`: required, string
- `planDate`: required, date format (YYYY-MM-DD)
- `items[].productId`: required, number
- `items[].quantity`: required, positive number
- สามารถแก้ไขได้เฉพาะสถานะ `draft`
- ต้องมีรายการสินค้าอย่างน้อย 1 รายการก่อนจอง material
