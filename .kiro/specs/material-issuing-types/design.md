# Design: Material Issuing Types

## Architecture Overview

### Design Approach
ใช้ **Strategy Pattern** ร่วมกับ **Single Table Inheritance** เพื่อจัดการ 3 ประเภทการจ่ายออกในตาราง `material_issuing` เดียวกัน แต่แยก business logic ออกเป็น service methods ต่างหาก

### Key Design Decisions

**Decision 1: Single Table vs Multiple Tables**
- **เลือก**: Single Table (material_issuing) with `issuing_type` discriminator
- **เหตุผล**: 
  - ลด complexity ของ database schema
  - Query ง่ายกว่า (ไม่ต้อง UNION)
  - Fields ส่วนใหญ่ overlap กัน
  - ง่ายต่อการเพิ่มประเภทใหม่
- **Trade-off**: มี nullable fields เยอะขึ้น แต่ยอมรับได้

**Decision 2: Separate DTOs vs Single DTO with discriminator**
- **เลือก**: Separate DTOs (CreateProductionIssuingDto, CreateAdjustmentIssuingDto, CreateSparePartsIssuingDto)
- **เหตุผล**:
  - Type safety ดีกว่า
  - Validation ชัดเจนตามประเภท
  - Auto-complete ใน IDE ดีกว่า
  - Error messages แม่นยำกว่า

**Decision 3: Separate Endpoints vs Single Endpoint with type parameter**
- **เลือก**: Separate Endpoints
- **เหตุผล**:
  - API documentation ชัดเจนกว่า
  - Client code อ่านง่ายกว่า
  - Validation logic แยกกันชัดเจน
  - ลด confusion ในการใช้งาน

## System Components

### 1. DTOs (Data Transfer Objects)

#### CreateProductionIssuingDto
```typescript
export class CreateProductionIssuingDto {
  @IsNumber()
  materialId: number;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  productionOrderNo: string;

  @IsString()
  @IsNotEmpty()
  productCode: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  createBy?: string;
}
```

#### CreateAdjustmentIssuingDto
```typescript
export class CreateAdjustmentIssuingDto {
  @IsNumber()
  materialId: number;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsEnum(['DAMAGED', 'EXPIRED', 'LOST', 'OBSOLETE'])
  adjustmentType: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  approvedBy: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsNumber()
  specificLotId?: number; // เลือก lot เฉพาะ

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  createBy?: string;
}
```

#### CreateSparePartsIssuingDto
```typescript
export class CreateSparePartsIssuingDto {
  @IsNumber()
  materialId: number;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  machineCode: string;

  @IsString()
  @IsNotEmpty()
  machineName: string;

  @IsEnum(['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY'])
  maintenanceType: string;

  @IsString()
  @IsNotEmpty()
  workOrderNo: string;

  @IsString()
  department: string;

  @IsString()
  @IsNotEmpty()
  technician: string;

  @IsOptional()
  @IsString()
  replacedPartNo?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  createBy?: string;
}
```

### 2. Entity Updates

#### MaterialIssuing Entity (เพิ่ม columns)
```typescript
@Entity('material_issuing')
export class MaterialIssuing {
  // ... existing fields ...

  @Column({ name: 'issuing_type', length: 20, default: 'GENERAL' })
  issuingType: string; // PRODUCTION, ADJUSTMENT, SPARE_PARTS, GENERAL

  // Production fields
  @Column({ name: 'production_order_no', length: 50, nullable: true })
  productionOrderNo: string;

  @Column({ name: 'product_code', length: 50, nullable: true })
  productCode: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  // Adjustment fields
  @Column({ name: 'adjustment_type', length: 20, nullable: true })
  adjustmentType: string; // DAMAGED, EXPIRED, LOST, OBSOLETE

  @Column({ name: 'adjustment_reason', type: 'text', nullable: true })
  adjustmentReason: string;

  @Column({ name: 'approved_by', length: 255, nullable: true })
  approvedBy: string;

  @Column({ name: 'attachments', type: 'jsonb', nullable: true })
  attachments: string[];

  // Spare Parts fields
  @Column({ name: 'machine_code', length: 50, nullable: true })
  machineCode: string;

  @Column({ name: 'machine_name', length: 255, nullable: true })
  machineName: string;

  @Column({ name: 'maintenance_type', length: 20, nullable: true })
  maintenanceType: string; // PREVENTIVE, CORRECTIVE, EMERGENCY

  @Column({ name: 'technician', length: 255, nullable: true })
  technician: string;

  @Column({ name: 'replaced_part_no', length: 50, nullable: true })
  replacedPartNo: string;
}
```

### 3. Service Layer

#### ReceivingIssuingService (เพิ่ม methods)

```typescript
// Production Issuing
async createProductionIssuing(dto: CreateProductionIssuingDto): Promise<MaterialIssuing> {
  return await this.dataSource.transaction(async manager => {
    // 1. Validate material
    // 2. Check stock availability (FIFO)
    // 3. Generate issuing number: ISS-PROD-YYYY-NNNN
    // 4. Create issuing header with issuingType = 'PRODUCTION'
    // 5. Allocate from lots (FIFO)
    // 6. Update lot status and remaining quantity
    // 7. Create transaction logs (type: ISSUE_PRODUCTION)
    // 8. Update stock
    // 9. Return issuing with relations
  });
}

// Adjustment Issuing
async createAdjustmentIssuing(dto: CreateAdjustmentIssuingDto): Promise<MaterialIssuing> {
  return await this.dataSource.transaction(async manager => {
    // 1. Validate material
    // 2. If specificLotId provided, use that lot; otherwise use FIFO
    // 3. Check stock availability
    // 4. Generate issuing number: ISS-ADJ-YYYY-NNNN
    // 5. Create issuing header with issuingType = 'ADJUSTMENT'
    // 6. Allocate from specific lot or FIFO
    // 7. Update lot status
    // 8. Create transaction logs (type: ISSUE_ADJUSTMENT)
    // 9. Update stock
    // 10. Return issuing with relations
  });
}

// Spare Parts Issuing
async createSparePartsIssuing(dto: CreateSparePartsIssuingDto): Promise<MaterialIssuing> {
  return await this.dataSource.transaction(async manager => {
    // 1. Validate material
    // 2. Check stock availability (FIFO)
    // 3. Generate issuing number: ISS-SPARE-YYYY-NNNN
    // 4. Create issuing header with issuingType = 'SPARE_PARTS'
    // 5. Allocate from lots (FIFO)
    // 6. Update lot status
    // 7. Create transaction logs (type: ISSUE_SPARE_PARTS)
    // 8. Update stock
    // 9. Return issuing with relations
  });
}

// Get Machine Maintenance History
async getMachineMaintenanceHistory(
  machineCode: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  history: MaterialIssuing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  // Query issuings where issuingType = 'SPARE_PARTS' and machineCode = machineCode
  // Order by issuingDate DESC
  // Include material, lots, technician info
}

// Update existing getAllIssuings to support type filter
async getAllIssuings(
  page: number = 1,
  limit: number = 10,
  search?: string,
  sortBy: string = 'id',
  sortOrder: string = 'DESC',
  materialId?: number,
  department?: string,
  status?: string,
  issuingType?: string // NEW PARAMETER
): Promise<{...}> {
  // Add filter for issuingType if provided
}
```

### 4. Controller Layer

#### ReceivingIssuingController (เพิ่ม endpoints)

```typescript
@Controller('materials/transactions')
export class ReceivingIssuingController {
  // ... existing methods ...

  @Post('issue/production')
  async createProductionIssuing(@Body() dto: CreateProductionIssuingDto) {
    const issuing = await this.service.createProductionIssuing(dto);
    return ResponseHelper.success(issuing, 'Production issuing created successfully');
  }

  @Post('issue/adjustment')
  async createAdjustmentIssuing(@Body() dto: CreateAdjustmentIssuingDto) {
    const issuing = await this.service.createAdjustmentIssuing(dto);
    return ResponseHelper.success(issuing, 'Stock adjustment created successfully');
  }

  @Post('issue/spare-parts')
  async createSparePartsIssuing(@Body() dto: CreateSparePartsIssuingDto) {
    const issuing = await this.service.createSparePartsIssuing(dto);
    return ResponseHelper.success(issuing, 'Spare parts issuing created successfully');
  }

  @Get('machines/:machineCode/history')
  async getMachineMaintenanceHistory(
    @Param('machineCode') machineCode: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    
    const result = await this.service.getMachineMaintenanceHistory(
      machineCode, pageNum, limitNum
    );
    return ResponseHelper.paginated(
      result.history,
      result.page,
      result.limit,
      result.total,
      'Machine maintenance history retrieved successfully'
    );
  }

  // Update existing getAllIssuings to support type filter
  @Get('issuings')
  async getAllIssuings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'id',
    @Query('sortOrder') sortOrder: string = 'DESC',
    @Query('materialId') materialId?: string,
    @Query('department') department?: string,
    @Query('status') status?: string,
    @Query('type') type?: string // NEW PARAMETER
  ) {
    // ... existing code ...
    const result = await this.service.getAllIssuings(
      pageNum, limitNum, search, sortBy, sortOrder, 
      materialIdNum, department, status, type
    );
    // ...
  }
}
```

## Database Migration

### Migration SQL
```sql
-- Add new columns to material_issuing table
ALTER TABLE material_issuing 
ADD COLUMN issuing_type VARCHAR(20) DEFAULT 'GENERAL',
ADD COLUMN production_order_no VARCHAR(50),
ADD COLUMN product_code VARCHAR(50),
ADD COLUMN due_date DATE,
ADD COLUMN adjustment_type VARCHAR(20),
ADD COLUMN adjustment_reason TEXT,
ADD COLUMN approved_by VARCHAR(255),
ADD COLUMN attachments JSONB,
ADD COLUMN machine_code VARCHAR(50),
ADD COLUMN machine_name VARCHAR(255),
ADD COLUMN maintenance_type VARCHAR(20),
ADD COLUMN technician VARCHAR(255),
ADD COLUMN replaced_part_no VARCHAR(50);

-- Create indexes for better query performance
CREATE INDEX idx_material_issuing_type ON material_issuing(issuing_type);
CREATE INDEX idx_material_issuing_production_order ON material_issuing(production_order_no);
CREATE INDEX idx_material_issuing_machine_code ON material_issuing(machine_code);
CREATE INDEX idx_material_issuing_work_order ON material_issuing(work_order_no);

-- Update existing records to have issuing_type = 'GENERAL'
UPDATE material_issuing SET issuing_type = 'GENERAL' WHERE issuing_type IS NULL;

-- Add check constraint for issuing_type
ALTER TABLE material_issuing 
ADD CONSTRAINT chk_issuing_type 
CHECK (issuing_type IN ('GENERAL', 'PRODUCTION', 'ADJUSTMENT', 'SPARE_PARTS'));

-- Add check constraint for adjustment_type
ALTER TABLE material_issuing 
ADD CONSTRAINT chk_adjustment_type 
CHECK (adjustment_type IS NULL OR adjustment_type IN ('DAMAGED', 'EXPIRED', 'LOST', 'OBSOLETE'));

-- Add check constraint for maintenance_type
ALTER TABLE material_issuing 
ADD CONSTRAINT chk_maintenance_type 
CHECK (maintenance_type IS NULL OR maintenance_type IN ('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY'));
```

## API Specifications

### 1. Create Production Issuing

**Endpoint:** `POST /materials/transactions/issue/production`

**Request:**
```json
{
  "materialId": 123,
  "quantity": 100,
  "productionOrderNo": "PO-2026-0001",
  "productCode": "PART-A001",
  "department": "Production Line 1",
  "dueDate": "2026-01-25",
  "remark": "สำหรับผลิตชิ้นส่วนเครื่องยนต์",
  "createBy": "user123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Production issuing created successfully",
  "data": {
    "id": 456,
    "issuingNo": "ISS-PROD-2026-0001",
    "issuingType": "PRODUCTION",
    "issuingDate": "2026-01-21T10:30:00Z",
    "materialId": 123,
    "totalQuantity": 100,
    "unit": "PCS",
    "productionOrderNo": "PO-2026-0001",
    "productCode": "PART-A001",
    "department": "Production Line 1",
    "dueDate": "2026-01-25",
    "remark": "สำหรับผลิตชิ้นส่วนเครื่องยนต์",
    "status": "COMPLETED",
    "createBy": "user123",
    "createDate": "2026-01-21T10:30:00Z",
    "material": { ... },
    "lots": [
      {
        "id": 789,
        "lotId": 111,
        "qrCode": "QR-LOT-123-20260115-001",
        "quantity": 100,
        "unit": "PCS",
        "lot": { ... }
      }
    ]
  }
}
```

### 2. Create Adjustment Issuing

**Endpoint:** `POST /materials/transactions/issue/adjustment`

**Request:**
```json
{
  "materialId": 123,
  "quantity": 50,
  "adjustmentType": "DAMAGED",
  "reason": "วัตถุดิบเสียหายจากการขนส่ง",
  "approvedBy": "manager01",
  "attachments": ["uploads/damage-photo-1.jpg", "uploads/damage-report.pdf"],
  "specificLotId": 111,
  "remark": "ตรวจพบความเสียหายจากการตรวจสอบคุณภาพ",
  "createBy": "user123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Stock adjustment created successfully",
  "data": {
    "id": 457,
    "issuingNo": "ISS-ADJ-2026-0001",
    "issuingType": "ADJUSTMENT",
    "issuingDate": "2026-01-21T11:00:00Z",
    "materialId": 123,
    "totalQuantity": 50,
    "unit": "PCS",
    "adjustmentType": "DAMAGED",
    "adjustmentReason": "วัตถุดิบเสียหายจากการขนส่ง",
    "approvedBy": "manager01",
    "attachments": ["uploads/damage-photo-1.jpg", "uploads/damage-report.pdf"],
    "remark": "ตรวจพบความเสียหายจากการตรวจสอบคุณภาพ",
    "status": "COMPLETED",
    "createBy": "user123",
    "createDate": "2026-01-21T11:00:00Z",
    "material": { ... },
    "lots": [ ... ]
  }
}
```

### 3. Create Spare Parts Issuing

**Endpoint:** `POST /materials/transactions/issue/spare-parts`

**Request:**
```json
{
  "materialId": 123,
  "quantity": 5,
  "machineCode": "MC-001",
  "machineName": "CNC Machine A",
  "maintenanceType": "PREVENTIVE",
  "workOrderNo": "WO-2026-0001",
  "department": "Maintenance",
  "technician": "tech01",
  "replacedPartNo": "OLD-PART-001",
  "remark": "เปลี่ยนอะไหล่ตามแผนบำรุงรักษา",
  "createBy": "user123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Spare parts issuing created successfully",
  "data": {
    "id": 458,
    "issuingNo": "ISS-SPARE-2026-0001",
    "issuingType": "SPARE_PARTS",
    "issuingDate": "2026-01-21T14:00:00Z",
    "materialId": 123,
    "totalQuantity": 5,
    "unit": "PCS",
    "machineCode": "MC-001",
    "machineName": "CNC Machine A",
    "maintenanceType": "PREVENTIVE",
    "workOrderNo": "WO-2026-0001",
    "department": "Maintenance",
    "technician": "tech01",
    "replacedPartNo": "OLD-PART-001",
    "remark": "เปลี่ยนอะไหล่ตามแผนบำรุงรักษา",
    "status": "COMPLETED",
    "createBy": "user123",
    "createDate": "2026-01-21T14:00:00Z",
    "material": { ... },
    "lots": [ ... ]
  }
}
```

### 4. Get Machine Maintenance History

**Endpoint:** `GET /materials/transactions/machines/{machineCode}/history?page=1&limit=10`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Machine maintenance history retrieved successfully",
  "data": [
    {
      "id": 458,
      "issuingNo": "ISS-SPARE-2026-0001",
      "issuingDate": "2026-01-21T14:00:00Z",
      "materialId": 123,
      "totalQuantity": 5,
      "maintenanceType": "PREVENTIVE",
      "workOrderNo": "WO-2026-0001",
      "technician": "tech01",
      "material": {
        "id": 123,
        "matCode": "MAT-001",
        "itemsName": { "name": "Bearing 6205" }
      }
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

## Error Handling

### Common Errors

**1. Material Not Found (404)**
```json
{
  "success": false,
  "message": "Material not found",
  "statusCode": 404
}
```

**2. Insufficient Stock (409)**
```json
{
  "success": false,
  "message": "Insufficient stock. Available: 50, Requested: 100",
  "statusCode": 409
}
```

**3. Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "productionOrderNo should not be empty",
    "quantity must be a positive number"
  ],
  "statusCode": 400
}
```

**4. Specific Lot Not Found (404)**
```json
{
  "success": false,
  "message": "Specified lot not found or not available",
  "statusCode": 404
}
```

## Testing Strategy

### Unit Tests

**Test Coverage:**
- DTO validation (all fields, required/optional)
- Service methods (success cases, error cases)
- FIFO allocation logic
- Stock update logic
- Transaction rollback on error
- Issuing number generation

**Example Test Cases:**
```typescript
describe('ReceivingIssuingService', () => {
  describe('createProductionIssuing', () => {
    it('should create production issuing with FIFO allocation', async () => {
      // Test FIFO logic
    });

    it('should throw error when insufficient stock', async () => {
      // Test error handling
    });

    it('should generate correct issuing number format', async () => {
      // Test ISS-PROD-YYYY-NNNN format
    });

    it('should rollback on transaction error', async () => {
      // Test transaction rollback
    });
  });

  describe('createAdjustmentIssuing', () => {
    it('should use specific lot when provided', async () => {
      // Test specific lot selection
    });

    it('should require approvedBy field', async () => {
      // Test validation
    });
  });

  describe('createSparePartsIssuing', () => {
    it('should create spare parts issuing successfully', async () => {
      // Test success case
    });
  });

  describe('getMachineMaintenanceHistory', () => {
    it('should return history for specific machine', async () => {
      // Test query filtering
    });
  });
});
```

### Integration Tests

**Test Scenarios:**
- End-to-end issuing flow
- Database transaction integrity
- API endpoint responses
- Error responses
- Pagination
- Filtering and sorting

## Performance Considerations

### Database Optimization
- Index on `issuing_type` for faster filtering
- Index on `machine_code` for maintenance history queries
- Index on `production_order_no` for production tracking
- Use `EXPLAIN ANALYZE` to optimize queries

### Caching Strategy
- Cache material data (rarely changes)
- Cache machine list (if applicable)
- No caching for stock data (real-time critical)

### Query Optimization
- Use `select` to limit returned fields
- Eager load relations when needed
- Use pagination for large result sets
- Limit transaction scope

## Security Considerations

### Authentication & Authorization
- All endpoints require authentication
- Adjustment issuing may require special permission
- Audit log for all issuing operations

### Data Validation
- Sanitize all input data
- Validate enum values
- Check for SQL injection in search queries
- Validate file paths in attachments

### Audit Trail
- Log all issuing operations
- Store createBy for accountability
- Store approvedBy for adjustments
- Immutable transaction logs

## Deployment Plan

### Phase 1: Database Migration
1. Run migration script to add new columns
2. Create indexes
3. Update existing data
4. Verify data integrity

### Phase 2: Code Deployment
1. Deploy new DTOs
2. Deploy updated entities
3. Deploy new service methods
4. Deploy new controller endpoints
5. Update API documentation

### Phase 3: Testing
1. Run unit tests
2. Run integration tests
3. Perform manual testing
4. Load testing

### Phase 4: Rollout
1. Deploy to staging environment
2. User acceptance testing
3. Deploy to production
4. Monitor for errors
5. Gather user feedback

## Monitoring & Maintenance

### Metrics to Track
- Number of issuings by type
- Average response time per endpoint
- Error rate by endpoint
- Stock accuracy
- Transaction rollback rate

### Alerts
- High error rate (> 5%)
- Slow response time (> 2s)
- Database connection issues
- Transaction deadlocks

### Maintenance Tasks
- Regular database vacuum
- Index maintenance
- Log rotation
- Performance tuning

## Future Enhancements

### Phase 2 Features
- Approval workflow for adjustments
- Batch issuing
- QR code scanning integration
- Mobile app support
- Print issuing documents
- Email notifications
- Integration with ERP systems

### Potential Improvements
- Machine entity with full details
- Maintenance schedule tracking
- Predictive maintenance based on spare parts usage
- Cost analysis and reporting
- Dashboard with charts and graphs
