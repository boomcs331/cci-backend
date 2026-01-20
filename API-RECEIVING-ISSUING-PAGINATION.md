# API Receiving & Issuing with Server-Side Pagination

## 📥 GET Receivings (รายการรับวัตถุดิบ)

### Endpoint
```
GET /materials/transactions/receivings
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | หน้าที่ต้องการ |
| `limit` | number | 10 | จำนวนรายการต่อหน้า |
| `search` | string | - | ค้นหา (receivingNo, poNo, matCode, materialName, supplierName) |
| `sortBy` | string | id | เรียงตาม (id, receivingNo, receivingDate, totalQuantity, createDate) |
| `sortOrder` | string | DESC | ASC หรือ DESC |
| `materialId` | number | - | กรองตาม Material ID |
| `supplierId` | number | - | กรองตาม Supplier ID |
| `status` | string | - | กรองตาม Status (ACTIVE, COMPLETED, CANCELLED) |

### Example Request
```bash
# ดูทั้งหมด
GET /materials/transactions/receivings?page=1&limit=10

# ค้นหา
GET /materials/transactions/receivings?search=RCV-2024

# กรองตาม Material
GET /materials/transactions/receivings?materialId=1

# กรองตาม Supplier
GET /materials/transactions/receivings?supplierId=1

# เรียงตามวันที่รับ
GET /materials/transactions/receivings?sortBy=receivingDate&sortOrder=DESC

# รวมหลายเงื่อนไข
GET /materials/transactions/receivings?page=1&limit=20&search=เหล็ก&materialId=1&sortBy=receivingDate&sortOrder=DESC
```

### Response
```json
{
  "success": true,
  "message": "Receivings retrieved successfully",
  "data": [
    {
      "id": 1,
      "receivingNo": "RCV-2024-0001",
      "receivingDate": "2024-01-15T10:30:00.000Z",
      "materialId": 1,
      "supplierId": 1,
      "totalQuantity": 1000,
      "unit": "KG",
      "poNo": "PO-2024-001",
      "remark": "รับเหล็กแผ่น",
      "status": "ACTIVE",
      "material": {
        "id": 1,
        "matCode": "MAT-001",
        "itemsName": {
          "name": "เหล็กแผ่น"
        }
      },
      "supplier": {
        "id": 1,
        "name": "ABC Steel Corporation"
      },
      "lots": [
        {
          "id": 1,
          "lotNo": "LOT-2024-0001",
          "qrCode": "QR-LOT-2024-0001-ABC123",
          "quantity": 100,
          "remainingQuantity": 50,
          "status": "PARTIAL_USED"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

## 📤 GET Issuings (รายการจ่ายวัตถุดิบ)

### Endpoint
```
GET /materials/transactions/issuings
```

### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | หน้าที่ต้องการ |
| `limit` | number | 10 | จำนวนรายการต่อหน้า |
| `search` | string | - | ค้นหา (issuingNo, workOrderNo, matCode, materialName, department) |
| `sortBy` | string | id | เรียงตาม (id, issuingNo, issuingDate, totalQuantity, createDate) |
| `sortOrder` | string | DESC | ASC หรือ DESC |
| `materialId` | number | - | กรองตาม Material ID |
| `department` | string | - | กรองตามแผนก |
| `status` | string | - | กรองตาม Status (COMPLETED, CANCELLED) |

### Example Request
```bash
# ดูทั้งหมด
GET /materials/transactions/issuings?page=1&limit=10

# ค้นหา
GET /materials/transactions/issuings?search=ISS-2024

# กรองตาม Material
GET /materials/transactions/issuings?materialId=1

# กรองตามแผนก
GET /materials/transactions/issuings?department=Production

# เรียงตามวันที่จ่าย
GET /materials/transactions/issuings?sortBy=issuingDate&sortOrder=DESC

# รวมหลายเงื่อนไข
GET /materials/transactions/issuings?page=1&limit=20&search=Production&materialId=1&sortBy=issuingDate
```

### Response
```json
{
  "success": true,
  "message": "Issuings retrieved successfully",
  "data": [
    {
      "id": 1,
      "issuingNo": "ISS-2024-0001",
      "issuingDate": "2024-01-20T14:30:00.000Z",
      "materialId": 1,
      "totalQuantity": 250,
      "unit": "KG",
      "department": "Production",
      "workOrderNo": "WO-2024-001",
      "remark": "เบิกสำหรับผลิต",
      "status": "COMPLETED",
      "material": {
        "id": 1,
        "matCode": "MAT-001",
        "itemsName": {
          "name": "เหล็กแผ่น"
        }
      },
      "lots": [
        {
          "id": 1,
          "lotId": 1,
          "qrCode": "QR-LOT-2024-0001-ABC123",
          "quantity": 100,
          "lot": {
            "lotNo": "LOT-2024-0001",
            "remainingQuantity": 0,
            "status": "USED_UP"
          }
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

---

## 🎨 Frontend Examples

### React + TypeScript

```typescript
// services/receiving.service.ts
import axios from 'axios';

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  materialId?: number;
  supplierId?: number;
  status?: string;
}

interface PaginatedResponse<T> {
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

export const receivingService = {
  getReceivings: async (params: PaginationParams): Promise<PaginatedResponse<any>> => {
    const response = await axios.get(
      'http://localhost:3000/materials/transactions/receivings',
      { params }
    );
    return response.data;
  },

  getIssuings: async (params: PaginationParams): Promise<PaginatedResponse<any>> => {
    const response = await axios.get(
      'http://localhost:3000/materials/transactions/issuings',
      { params }
    );
    return response.data;
  }
};
```

### React Component - Receiving List

```tsx
// components/ReceivingList.tsx
import React, { useState, useEffect } from 'react';
import { receivingService } from '../services/receiving.service';

export const ReceivingList: React.FC = () => {
  const [receivings, setReceivings] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [search, setSearch] = useState('');
  const [materialId, setMaterialId] = useState<number>();
  const [loading, setLoading] = useState(false);

  const fetchReceivings = async () => {
    setLoading(true);
    try {
      const result = await receivingService.getReceivings({
        page: pagination.page,
        limit: pagination.limit,
        search,
        materialId,
        sortBy: 'receivingDate',
        sortOrder: 'DESC'
      });
      
      setReceivings(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching receivings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivings();
  }, [pagination.page, pagination.limit, search, materialId]);

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 }); // Reset to page 1
    fetchReceivings();
  };

  return (
    <div className="receiving-list">
      <h2>รายการรับวัตถุดิบ</h2>

      {/* Search & Filter */}
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="ค้นหา..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <select
          value={materialId || ''}
          onChange={(e) => setMaterialId(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">ทุกวัตถุดิบ</option>
          <option value="1">เหล็กแผ่น</option>
          <option value="2">พลาสติก</option>
        </select>

        <button type="submit">ค้นหา</button>
      </form>

      {/* Table */}
      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>เลขที่ใบรับ</th>
                <th>วันที่รับ</th>
                <th>วัตถุดิบ</th>
                <th>ซัพพลายเออร์</th>
                <th>จำนวน</th>
                <th>PO</th>
                <th>จำนวน Lot</th>
              </tr>
            </thead>
            <tbody>
              {receivings.map((receiving) => (
                <tr key={receiving.id}>
                  <td>{receiving.receivingNo}</td>
                  <td>{new Date(receiving.receivingDate).toLocaleDateString('th-TH')}</td>
                  <td>{receiving.material?.itemsName?.name}</td>
                  <td>{receiving.supplier?.name}</td>
                  <td>{receiving.totalQuantity} {receiving.unit}</td>
                  <td>{receiving.poNo}</td>
                  <td>{receiving.lots?.length || 0} Lot</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              ก่อนหน้า
            </button>

            <span>
              หน้า {pagination.page} / {pagination.totalPages} 
              (ทั้งหมด {pagination.total} รายการ)
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              ถัดไป
            </button>
          </div>
        </>
      )}
    </div>
  );
};
```

---

## 📊 Use Cases

### 1. ดูรายการรับทั้งหมด (หน้าแรก)
```bash
GET /materials/transactions/receivings?page=1&limit=10
```

### 2. ค้นหาด้วยเลขที่ใบรับ
```bash
GET /materials/transactions/receivings?search=RCV-2024-0001
```

### 3. ดูรายการรับของวัตถุดิบเฉพาะ
```bash
GET /materials/transactions/receivings?materialId=1&page=1&limit=20
```

### 4. ดูรายการรับจากซัพพลายเออร์เฉพาะ
```bash
GET /materials/transactions/receivings?supplierId=1
```

### 5. ดูรายการจ่ายของแผนก Production
```bash
GET /materials/transactions/issuings?department=Production
```

### 6. ค้นหารายการจ่ายด้วย Work Order
```bash
GET /materials/transactions/issuings?search=WO-2024-001
```

---

## ✅ Features

- ✅ Server-side Pagination
- ✅ Search (receivingNo, poNo, matCode, materialName, supplierName)
- ✅ Filter (materialId, supplierId, department, status)
- ✅ Sort (id, receivingNo, receivingDate, totalQuantity, createDate)
- ✅ Relations (material, supplier, lots)
- ✅ Performance optimized with QueryBuilder
