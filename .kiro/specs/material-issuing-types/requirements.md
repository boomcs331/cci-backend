# Requirements: Material Issuing Types

## Feature Overview
ระบบการจ่ายออกวัตถุดิบ/อะไหล่ สำหรับโรงงานผลิตชิ้นส่วนยานยนต์ ที่รองรับ 3 ประเภทการจ่ายออก:
1. จ่ายออกแบบสั่งผลิตปกติ (Production Order Issuing)
2. จ่ายออกแบบตัดสต็อก (Stock Adjustment Issuing)
3. จ่ายออกแบบเบิกอะไหล่ทดแทน (Spare Parts Replacement Issuing)

## Business Context
ปัจจุบันระบบมีการจ่ายออกแบบเดียว (generic issuing) ซึ่งไม่เพียงพอสำหรับการจัดการที่หลากหลาย ต้องการแยกประเภทการจ่ายออกเพื่อ:
- ติดตามต้นทุนการผลิตได้แม่นยำ
- จัดการสต็อกที่เสียหาย/หมดอายุ
- ติดตามการใช้อะไหล่ในการบำรุงรักษาเครื่องจักร
- รายงานและวิเคราะห์ข้อมูลได้ละเอียดขึ้น

## User Stories

### 1. Production Order Issuing (จ่ายออกสั่งผลิต)

**As a** พนักงานคลังวัตถุดิบ  
**I want to** จ่ายวัตถุดิบออกตามใบสั่งผลิต  
**So that** สามารถติดตามว่าวัตถุดิบถูกใช้กับใบสั่งผลิตไหน และคำนวณต้นทุนการผลิตได้

**Acceptance Criteria:**
1.1 ระบบต้องบันทึกเลขที่ใบสั่งผลิต (Production Order No)  
1.2 ระบบต้องบันทึกรหัสสินค้าที่ผลิต (Product Code)  
1.3 ระบบต้องบันทึกแผนก/สายการผลิต (Department/Production Line)  
1.4 ระบบต้องบันทึกวันที่กำหนดส่ง (Due Date)  
1.5 ระบบต้องตัดสต็อกจาก Lot แบบ FIFO (First In First Out)  
1.6 ระบบต้องสร้างเลขที่จ่ายออกอัตโนมัติ รูปแบบ `ISS-PROD-YYYY-NNNN`  
1.7 ระบบต้องตรวจสอบว่ามีสต็อกเพียงพอก่อนจ่ายออก  
1.8 ระบบต้องบันทึก Transaction Log ประเภท `ISSUE_PRODUCTION`

### 2. Stock Adjustment Issuing (จ่ายออกตัดสต็อก)

**As a** พนักงานคลัง/หัวหน้าคลัง  
**I want to** ตัดสต็อกวัตถุดิบที่เสียหาย/หมดอายุ/สูญหาย  
**So that** ข้อมูลสต็อกในระบบตรงกับสต็อกจริง และมีหลักฐานการตัดสต็อก

**Acceptance Criteria:**
2.1 ระบบต้องระบุประเภทการตัดสต็อก (Adjustment Type): DAMAGED, EXPIRED, LOST, OBSOLETE  
2.2 ระบบต้องบังคับให้ระบุเหตุผล (Reason) ในการตัดสต็อก  
2.3 ระบบต้องบันทึกผู้อนุมัติ (Approved By)  
2.4 ระบบต้องรองรับการแนบไฟล์หลักฐาน (Attachments) เช่น รูปภาพ, เอกสาร  
2.5 ระบบต้องสร้างเลขที่จ่ายออกอัตโนมัติ รูปแบบ `ISS-ADJ-YYYY-NNNN`  
2.6 ระบบต้องตัดสต็อกจาก Lot ที่ระบุ (ไม่ใช่ FIFO)  
2.7 ระบบต้องบันทึก Transaction Log ประเภท `ISSUE_ADJUSTMENT`  
2.8 ระบบต้องแสดงรายการตัดสต็อกแยกจากการจ่ายออกปกติ

### 3. Spare Parts Replacement Issuing (จ่ายออกอะไหล่ทดแทน)

**As a** ช่างซ่อมบำรุง  
**I want to** เบิกอะไหล่เพื่อซ่อมบำรุงเครื่องจักร  
**So that** สามารถติดตามต้นทุนการบำรุงรักษาและประวัติการเปลี่ยนอะไหล่ของแต่ละเครื่องจักร

**Acceptance Criteria:**
3.1 ระบบต้องบันทึกรหัสเครื่องจักร (Machine Code)  
3.2 ระบบต้องบันทึกชื่อเครื่องจักร (Machine Name)  
3.3 ระบบต้องระบุประเภทการบำรุงรักษา (Maintenance Type): PREVENTIVE, CORRECTIVE, EMERGENCY  
3.4 ระบบต้องบันทึกเลขที่ใบสั่งงาน (Work Order No)  
3.5 ระบบต้องบันทึกชื่อช่างผู้ทำงาน (Technician)  
3.6 ระบบต้องบันทึกรหัสอะไหล่เก่าที่ถอดออก (Replaced Part No) - optional  
3.7 ระบบต้องสร้างเลขที่จ่ายออกอัตโนมัติ รูปแบบ `ISS-SPARE-YYYY-NNNN`  
3.8 ระบบต้องตัดสต็อกจาก Lot แบบ FIFO  
3.9 ระบบต้องบันทึก Transaction Log ประเภท `ISSUE_SPARE_PARTS`  
3.10 ระบบต้องสามารถดูประวัติการเบิกอะไหล่ของแต่ละเครื่องจักรได้

## Functional Requirements

### FR-1: API Endpoints
ระบบต้องมี API endpoints ดังนี้:

#### FR-1.1: Production Order Issuing
- **POST** `/materials/transactions/issue/production`
- Request Body: CreateProductionIssuingDto
- Response: MaterialIssuing object พร้อม lots และ transaction logs

#### FR-1.2: Stock Adjustment Issuing
- **POST** `/materials/transactions/issue/adjustment`
- Request Body: CreateAdjustmentIssuingDto
- Response: MaterialIssuing object พร้อม lots และ transaction logs

#### FR-1.3: Spare Parts Issuing
- **POST** `/materials/transactions/issue/spare-parts`
- Request Body: CreateSparePartsIssuingDto
- Response: MaterialIssuing object พร้อม lots และ transaction logs

#### FR-1.4: Get Issuings by Type
- **GET** `/materials/transactions/issuings?type={PRODUCTION|ADJUSTMENT|SPARE_PARTS}`
- Query Parameters: page, limit, search, sortBy, sortOrder, materialId, type, status
- Response: Paginated list of issuings

#### FR-1.5: Get Machine Maintenance History
- **GET** `/materials/transactions/machines/{machineCode}/history`
- Response: List of spare parts issuings for specific machine

### FR-2: Data Validation
- ทุก endpoint ต้องมี validation ตาม DTO
- ต้องตรวจสอบว่า materialId มีอยู่จริง
- ต้องตรวจสอบว่ามี stock เพียงพอ
- Production Issuing: productionOrderNo และ productCode เป็น required
- Adjustment Issuing: adjustmentType และ reason เป็น required
- Spare Parts Issuing: machineCode และ maintenanceType เป็น required

### FR-3: Stock Management
- ทุกประเภทต้องตัดสต็อกจาก MaterialsStock
- Production และ Spare Parts ใช้ FIFO
- Adjustment สามารถเลือก Lot ได้
- ต้องอัพเดท remainingQuantity ของ Lot
- ต้องอัพเดท status ของ Lot (PARTIAL_USED, USED_UP)

### FR-4: Transaction Logging
- บันทึก transaction ทุกครั้งที่มีการจ่ายออก
- Transaction type ต้องแยกตามประเภท: ISSUE_PRODUCTION, ISSUE_ADJUSTMENT, ISSUE_SPARE_PARTS
- บันทึก reference_no เป็นเลขที่จ่ายออก
- บันทึก quantity เป็นค่าลบ (-)

### FR-5: Reporting
- สามารถดูรายงานการจ่ายออกแยกตามประเภท
- สามารถดูประวัติการใช้อะไหล่ของแต่ละเครื่องจักร
- สามารถดูรายงานการตัดสต็อกพร้อมเหตุผล

## Non-Functional Requirements

### NFR-1: Performance
- API response time ต้องไม่เกิน 2 วินาที
- รองรับการจ่ายออกพร้อมกันได้อย่างน้อย 50 transactions/second

### NFR-2: Data Integrity
- ใช้ Database Transaction เพื่อความสมบูรณ์ของข้อมูล
- ถ้าเกิด error ระหว่างการจ่ายออก ต้อง rollback ทั้งหมด

### NFR-3: Security
- ต้องมี authentication ก่อนเรียกใช้ API
- บันทึก createBy ทุกครั้ง
- Adjustment Issuing ต้องมี approvedBy

### NFR-4: Maintainability
- Code ต้องแยก service method ชัดเจนตามประเภท
- ใช้ DTO แยกตามประเภท
- มี unit tests coverage อย่างน้อย 80%

### NFR-5: Scalability
- Database schema ต้องรองรับการเพิ่มประเภทการจ่ายออกในอนาคต
- ใช้ enum สำหรับ issuing_type เพื่อง่ายต่อการขยาย

## Data Model Changes

### MaterialIssuing Entity (เพิ่ม fields)
```typescript
issuingType: string; // PRODUCTION, ADJUSTMENT, SPARE_PARTS

// Production fields
productionOrderNo?: string;
productCode?: string;
dueDate?: Date;

// Adjustment fields
adjustmentType?: string; // DAMAGED, EXPIRED, LOST, OBSOLETE
adjustmentReason?: string;
approvedBy?: string;
attachments?: string; // JSON array of file paths

// Spare Parts fields
machineCode?: string;
machineName?: string;
maintenanceType?: string; // PREVENTIVE, CORRECTIVE, EMERGENCY
technician?: string;
replacedPartNo?: string;
```

### MaterialTransaction Entity (เพิ่ม transaction types)
- ISSUE_PRODUCTION
- ISSUE_ADJUSTMENT
- ISSUE_SPARE_PARTS

## Out of Scope
- การอนุมัติการจ่ายออกแบบ workflow (approval workflow)
- การแจ้งเตือนเมื่อสต็อกใกล้หมด
- การ integrate กับระบบ ERP ภายนอก
- Mobile app สำหรับสแกน QR code
- การพิมพ์เอกสารใบจ่ายออก

## Success Metrics
- ลดเวลาการบันทึกการจ่ายออกลง 50%
- เพิ่มความแม่นยำของข้อมูลสต็อก 95%+
- สามารถติดตามต้นทุนการผลิตได้ครบ 100%
- ลดเวลาการค้นหาประวัติการใช้อะไหล่ลง 70%

## Dependencies
- ระบบ Material Management ที่มีอยู่
- ระบบ Receiving-Issuing ที่มีอยู่
- Database: PostgreSQL
- Framework: NestJS + TypeORM

## Assumptions
- ผู้ใช้มีความรู้พื้นฐานเกี่ยวกับการจัดการคลัง
- มีระบบ authentication อยู่แล้ว
- มีระบบจัดการไฟล์สำหรับ attachments อยู่แล้ว
- Machine Code มีอยู่ในระบบแล้ว (หรือจะเป็น free text)

## Risks
- การเปลี่ยนแปลง schema อาจกระทบกับ code เดิม
- ข้อมูลเก่าที่ไม่มี issuingType จะต้องจัดการ
- Performance อาจลดลงถ้ามี fields เยอะขึ้น
- User อาจสับสนกับ API ที่มีหลาย endpoints
