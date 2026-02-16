# โครงสร้างโปรเจคใหม่ (NestJS Best Practices)

## การเปลี่ยนแปลง

### ✅ ย้ายแล้ว

1. **ResponseHelper** 
   - จาก: `src/common/helpers/response.helper.ts`
   - ไป: `libs/common/src/response/response.helper.ts`
   - Import: `import { ResponseHelper } from '@app/common';`

2. **Feature Modules**
   - จาก: `src/auth`, `src/materials`, `src/products`
   - ไป: `src/modules/auth`, `src/modules/materials`, `src/modules/products`

3. **Audit System**
   - จาก: `src/common/entities`, `src/common/services`, `src/common/controllers`
   - ไป: `src/core/audit/`
   - สร้าง `AuditModule` แยกออกมา

### 📁 โครงสร้างใหม่

```
src/
├── modules/              # Feature modules
│   ├── auth/
│   ├── materials/
│   └── products/
├── core/                 # Core business logic
│   └── audit/
│       ├── entities/
│       ├── services/
│       ├── controllers/
│       └── audit.module.ts
├── common/               # Shared utilities
│   ├── interceptors/
│   ├── middleware/
│   └── common.module.ts
├── app.module.ts
└── main.ts

libs/common/src/
├── database/
├── logger/
├── response/            # ✨ ใหม่
│   ├── response.helper.ts
│   └── index.ts
└── index.ts
```

### 🔄 ขั้นตอนต่อไป (ต้องทำเอง)

1. **ลบ folder เก่า:**
   ```bash
   rmdir /s /q src\auth
   rmdir /s /q src\materials
   rmdir /s /q src\products
   rmdir /s /q src\database
   ```

2. **ลบไฟล์เก่าใน src/common:**
   ```bash
   rmdir /s /q src\common\entities
   rmdir /s /q src\common\services
   rmdir /s /q src\common\controllers
   rmdir /s /q src\common\helpers
   ```

3. **อัปเดต import paths ทั้งหมด:**
   - เปลี่ยน `'../common/helpers/response.helper'` → `'@app/common'`
   - เปลี่ยน `'./auth/'` → `'./modules/auth/'`
   - เปลี่ยน `'./materials/'` → `'./modules/materials/'`
   - เปลี่ยน `'./products/'` → `'./modules/products/'`

4. **ทดสอบ:**
   ```bash
   npm run build
   npm run start:dev
   ```

### 📝 หมายเหตุ

- ไฟล์ทั้งหมดถูกคัดลอกไปยังตำแหน่งใหม่แล้ว
- ยังไม่ได้ลบไฟล์เก่า (เพื่อความปลอดภัย)
- ต้องอัปเดต import paths ด้วยตนเอง
- ตรวจสอบให้แน่ใจว่าทุกอย่างทำงานก่อนลบไฟล์เก่า
