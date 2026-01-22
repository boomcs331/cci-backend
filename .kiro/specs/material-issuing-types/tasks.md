# Tasks: Material Issuing Types

## Implementation Tasks

### 1. Database Migration
- [ ] 1.1 Create migration file for new columns
- [ ] 1.2 Add issuing_type column with default 'GENERAL'
- [ ] 1.3 Add production-related columns (production_order_no, product_code, due_date)
- [ ] 1.4 Add adjustment-related columns (adjustment_type, adjustment_reason, approved_by, attachments)
- [ ] 1.5 Add spare-parts-related columns (machine_code, machine_name, maintenance_type, technician, replaced_part_no)
- [ ] 1.6 Create indexes for performance optimization
- [ ] 1.7 Add check constraints for enum values
- [ ] 1.8 Update existing records to have issuing_type = 'GENERAL'
- [ ] 1.9 Test migration on development database
- [ ] 1.10 Verify data integrity after migration

### 2. Entity Updates
- [ ] 2.1 Update MaterialIssuing entity with new columns
- [ ] 2.2 Add issuingType field with default value
- [ ] 2.3 Add production fields (productionOrderNo, productCode, dueDate)
- [ ] 2.4 Add adjustment fields (adjustmentType, adjustmentReason, approvedBy, attachments)
- [ ] 2.5 Add spare parts fields (machineCode, machineName, maintenanceType, technician, replacedPartNo)
- [ ] 2.6 Update MaterialTransaction entity to support new transaction types
- [ ] 2.7 Test entity changes with TypeORM

### 3. DTOs Creation
- [ ] 3.1 Create CreateProductionIssuingDto with validation decorators
  - [ ] 3.1.1 Add materialId validation
  - [ ] 3.1.2 Add quantity validation (min 0.01)
  - [ ] 3.1.3 Add productionOrderNo validation (required, not empty)
  - [ ] 3.1.4 Add productCode validation (required, not empty)
  - [ ] 3.1.5 Add department validation (required, not empty)
  - [ ] 3.1.6 Add dueDate validation (date string)
  - [ ] 3.1.7 Add optional fields (remark, createBy)
- [ ] 3.2 Create CreateAdjustmentIssuingDto with validation decorators
  - [ ] 3.2.1 Add materialId validation
  - [ ] 3.2.2 Add quantity validation (min 0.01)
  - [ ] 3.2.3 Add adjustmentType validation (enum: DAMAGED, EXPIRED, LOST, OBSOLETE)
  - [ ] 3.2.4 Add reason validation (required, not empty)
  - [ ] 3.2.5 Add approvedBy validation (required, not empty)
  - [ ] 3.2.6 Add attachments validation (optional array of strings)
  - [ ] 3.2.7 Add specificLotId validation (optional number)
  - [ ] 3.2.8 Add optional fields (remark, createBy)
- [ ] 3.3 Create CreateSparePartsIssuingDto with validation decorators
  - [ ] 3.3.1 Add materialId validation
  - [ ] 3.3.2 Add quantity validation (min 0.01)
  - [ ] 3.3.3 Add machineCode validation (required, not empty)
  - [ ] 3.3.4 Add machineName validation (required, not empty)
  - [ ] 3.3.5 Add maintenanceType validation (enum: PREVENTIVE, CORRECTIVE, EMERGENCY)
  - [ ] 3.3.6 Add workOrderNo validation (required, not empty)
  - [ ] 3.3.7 Add department validation (required)
  - [ ] 3.3.8 Add technician validation (required, not empty)
  - [ ] 3.3.9 Add optional fields (replacedPartNo, remark, createBy)

### 4. Service Layer Implementation
- [ ] 4.1 Implement createProductionIssuing method
  - [ ] 4.1.1 Validate material exists
  - [ ] 4.1.2 Get available lots using FIFO
  - [ ] 4.1.3 Check stock availability
  - [ ] 4.1.4 Generate issuing number (ISS-PROD-YYYY-NNNN)
  - [ ] 4.1.5 Create issuing header with issuingType = 'PRODUCTION'
  - [ ] 4.1.6 Allocate quantity from lots (FIFO)
  - [ ] 4.1.7 Update lot remaining quantity and status
  - [ ] 4.1.8 Create transaction logs (type: ISSUE_PRODUCTION)
  - [ ] 4.1.9 Update MaterialsStock
  - [ ] 4.1.10 Return issuing with relations
- [ ] 4.2 Implement createAdjustmentIssuing method
  - [ ] 4.2.1 Validate material exists
  - [ ] 4.2.2 Handle specific lot selection if provided
  - [ ] 4.2.3 Get available lots (specific or FIFO)
  - [ ] 4.2.4 Check stock availability
  - [ ] 4.2.5 Generate issuing number (ISS-ADJ-YYYY-NNNN)
  - [ ] 4.2.6 Create issuing header with issuingType = 'ADJUSTMENT'
  - [ ] 4.2.7 Allocate quantity from lots
  - [ ] 4.2.8 Update lot remaining quantity and status
  - [ ] 4.2.9 Create transaction logs (type: ISSUE_ADJUSTMENT)
  - [ ] 4.2.10 Update MaterialsStock
  - [ ] 4.2.11 Return issuing with relations
- [ ] 4.3 Implement createSparePartsIssuing method
  - [ ] 4.3.1 Validate material exists
  - [ ] 4.3.2 Get available lots using FIFO
  - [ ] 4.3.3 Check stock availability
  - [ ] 4.3.4 Generate issuing number (ISS-SPARE-YYYY-NNNN)
  - [ ] 4.3.5 Create issuing header with issuingType = 'SPARE_PARTS'
  - [ ] 4.3.6 Allocate quantity from lots (FIFO)
  - [ ] 4.3.7 Update lot remaining quantity and status
  - [ ] 4.3.8 Create transaction logs (type: ISSUE_SPARE_PARTS)
  - [ ] 4.3.9 Update MaterialsStock
  - [ ] 4.3.10 Return issuing with relations
- [ ] 4.4 Implement getMachineMaintenanceHistory method
  - [ ] 4.4.1 Query issuings where issuingType = 'SPARE_PARTS'
  - [ ] 4.4.2 Filter by machineCode
  - [ ] 4.4.3 Include material and lots relations
  - [ ] 4.4.4 Order by issuingDate DESC
  - [ ] 4.4.5 Implement pagination
  - [ ] 4.4.6 Return paginated result
- [ ] 4.5 Update getAllIssuings method to support type filter
  - [ ] 4.5.1 Add issuingType parameter
  - [ ] 4.5.2 Add filter condition for issuingType
  - [ ] 4.5.3 Test filtering with different types

### 5. Controller Layer Implementation
- [ ] 5.1 Create POST /materials/transactions/issue/production endpoint
  - [ ] 5.1.1 Add route decorator
  - [ ] 5.1.2 Add DTO validation
  - [ ] 5.1.3 Call service method
  - [ ] 5.1.4 Return success response
  - [ ] 5.1.5 Handle errors
- [ ] 5.2 Create POST /materials/transactions/issue/adjustment endpoint
  - [ ] 5.2.1 Add route decorator
  - [ ] 5.2.2 Add DTO validation
  - [ ] 5.2.3 Call service method
  - [ ] 5.2.4 Return success response
  - [ ] 5.2.5 Handle errors
- [ ] 5.3 Create POST /materials/transactions/issue/spare-parts endpoint
  - [ ] 5.3.1 Add route decorator
  - [ ] 5.3.2 Add DTO validation
  - [ ] 5.3.3 Call service method
  - [ ] 5.3.4 Return success response
  - [ ] 5.3.5 Handle errors
- [ ] 5.4 Create GET /materials/transactions/machines/:machineCode/history endpoint
  - [ ] 5.4.1 Add route decorator
  - [ ] 5.4.2 Parse query parameters
  - [ ] 5.4.3 Call service method
  - [ ] 5.4.4 Return paginated response
  - [ ] 5.4.5 Handle errors
- [ ] 5.5 Update GET /materials/transactions/issuings endpoint
  - [ ] 5.5.1 Add type query parameter
  - [ ] 5.5.2 Pass type to service method
  - [ ] 5.5.3 Test filtering by type

### 6. Unit Tests
- [ ] 6.1 Write tests for CreateProductionIssuingDto validation
- [ ] 6.2 Write tests for CreateAdjustmentIssuingDto validation
- [ ] 6.3 Write tests for CreateSparePartsIssuingDto validation
- [ ] 6.4 Write tests for createProductionIssuing service method
  - [ ] 6.4.1 Test successful creation
  - [ ] 6.4.2 Test material not found error
  - [ ] 6.4.3 Test insufficient stock error
  - [ ] 6.4.4 Test FIFO allocation logic
  - [ ] 6.4.5 Test issuing number generation
  - [ ] 6.4.6 Test transaction rollback on error
- [ ] 6.5 Write tests for createAdjustmentIssuing service method
  - [ ] 6.5.1 Test successful creation with specific lot
  - [ ] 6.5.2 Test successful creation with FIFO
  - [ ] 6.5.3 Test specific lot not found error
  - [ ] 6.5.4 Test insufficient stock error
  - [ ] 6.5.5 Test issuing number generation
- [ ] 6.6 Write tests for createSparePartsIssuing service method
  - [ ] 6.6.1 Test successful creation
  - [ ] 6.6.2 Test material not found error
  - [ ] 6.6.3 Test insufficient stock error
  - [ ] 6.6.4 Test FIFO allocation logic
  - [ ] 6.6.5 Test issuing number generation
- [ ] 6.7 Write tests for getMachineMaintenanceHistory service method
  - [ ] 6.7.1 Test successful query
  - [ ] 6.7.2 Test pagination
  - [ ] 6.7.3 Test empty result
- [ ] 6.8 Write tests for updated getAllIssuings method
  - [ ] 6.8.1 Test filtering by type
  - [ ] 6.8.2 Test combined filters

### 7. Integration Tests
- [ ] 7.1 Test production issuing endpoint end-to-end
  - [ ] 7.1.1 Test successful request
  - [ ] 7.1.2 Test validation errors
  - [ ] 7.1.3 Test insufficient stock error
  - [ ] 7.1.4 Test database state after issuing
- [ ] 7.2 Test adjustment issuing endpoint end-to-end
  - [ ] 7.2.1 Test successful request with specific lot
  - [ ] 7.2.2 Test successful request with FIFO
  - [ ] 7.2.3 Test validation errors
  - [ ] 7.2.4 Test database state after issuing
- [ ] 7.3 Test spare parts issuing endpoint end-to-end
  - [ ] 7.3.1 Test successful request
  - [ ] 7.3.2 Test validation errors
  - [ ] 7.3.3 Test database state after issuing
- [ ] 7.4 Test machine maintenance history endpoint
  - [ ] 7.4.1 Test successful query
  - [ ] 7.4.2 Test pagination
  - [ ] 7.4.3 Test machine not found
- [ ] 7.5 Test updated issuings list endpoint
  - [ ] 7.5.1 Test filtering by type
  - [ ] 7.5.2 Test combined filters

### 8. Documentation
- [ ] 8.1 Update API documentation with new endpoints
- [ ] 8.2 Add request/response examples
- [ ] 8.3 Document error codes and messages
- [ ] 8.4 Create user guide for each issuing type
- [ ] 8.5 Update database schema documentation
- [ ] 8.6 Create migration guide for existing data

### 9. Code Quality
- [ ] 9.1 Run linter and fix issues
- [ ] 9.2 Check test coverage (target: 80%+)
- [ ] 9.3 Review code for best practices
- [ ] 9.4 Add JSDoc comments to public methods
- [ ] 9.5 Remove unused imports and variables
- [ ] 9.6 Optimize database queries

### 10. Deployment Preparation
- [ ] 10.1 Test migration on staging database
- [ ] 10.2 Create rollback plan
- [ ] 10.3 Prepare deployment checklist
- [ ] 10.4 Set up monitoring and alerts
- [ ] 10.5 Create backup before deployment
- [ ] 10.6 Test on staging environment
- [ ] 10.7 Perform load testing
- [ ] 10.8 Get approval from stakeholders

### 11. Post-Deployment
- [ ] 11.1 Monitor error logs
- [ ] 11.2 Monitor performance metrics
- [ ] 11.3 Gather user feedback
- [ ] 11.4 Fix any critical bugs
- [ ] 11.5 Update documentation based on feedback
- [ ] 11.6 Plan for future enhancements

## Task Dependencies

```
1. Database Migration (1.1-1.10)
   ↓
2. Entity Updates (2.1-2.7)
   ↓
3. DTOs Creation (3.1-3.3)
   ↓
4. Service Layer (4.1-4.5)
   ↓
5. Controller Layer (5.1-5.5)
   ↓
6. Unit Tests (6.1-6.8)
   ↓
7. Integration Tests (7.1-7.5)
   ↓
8. Documentation (8.1-8.6)
   ↓
9. Code Quality (9.1-9.6)
   ↓
10. Deployment Preparation (10.1-10.8)
    ↓
11. Post-Deployment (11.1-11.6)
```

## Estimated Timeline

- **Database Migration**: 1 day
- **Entity & DTO Updates**: 1 day
- **Service Layer**: 3 days
- **Controller Layer**: 1 day
- **Unit Tests**: 2 days
- **Integration Tests**: 2 days
- **Documentation**: 1 day
- **Code Quality & Review**: 1 day
- **Deployment Preparation**: 1 day
- **Post-Deployment**: 1 day

**Total Estimated Time**: 14 working days (~3 weeks)

## Priority

- **High Priority**: Tasks 1-5 (Core functionality)
- **Medium Priority**: Tasks 6-7 (Testing)
- **Low Priority**: Tasks 8-11 (Documentation and deployment)

## Notes

- All tasks should be completed in order due to dependencies
- Each task should be tested before moving to the next
- Code review should be done after completing each major section
- Database migration should be tested thoroughly before production deployment
- Keep backward compatibility with existing issuing functionality
