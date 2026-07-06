# Architecture

## System Architecture
This is a **monolithic NestJS backend** with modular architecture using TypeORM for database access.

## Layered Architecture
```
┌─────────────────────────────────────────┐
│         Controllers Layer               │
│  (HTTP Request Handling & Routing)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Services Layer                  │
│  (Business Logic & Orchestration)       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Business Layer                  │
│  (Domain-Specific Business Logic)       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Repository/Entity Layer         │
│  (Data Access via TypeORM)              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         PostgreSQL Database             │
└─────────────────────────────────────────┘
```

## Module Structure
Each feature module follows NestJS conventions:
- **controllers/**: HTTP endpoints
- **services/**: Business logic
- **entities/**: TypeORM entities
- **dto/**: Data transfer objects
- **guards/**: Authorization guards
- **interceptors/**: Request/response transformation
- **middleware/**: Request processing

## Core Modules

### AppModule
Root module that imports all feature modules:
- ConfigModule (global)
- DatabaseModule (from libs/common)
- CommonModule
- BusinessModule
- AuditModule
- AuthModule
- MaterialsModule
- ProductsModule
- ProductionPlansModule
- ProductionOrdersModule
- SalesModule
- SalesPlanningModule
- AiChatModule

### AuthModule
- **Purpose**: Authentication and authorization
- **Key Features**: JWT authentication, department-scoped RBAC, multi-department users
- **Entities**: User, Role, Permission, Menu, Department, UserRoleAssignment, UserDepartment
- **Guards**: JwtAuthGuard, RolesGuard, DepartmentsGuard

### MaterialsModule
- **Purpose**: Raw material management
- **Key Features**: Material receiving, issuing, inventory, PO number validation
- **Entities**: Material, MaterialCategory, MaterialTransaction, MaterialStock
- **Sub-modules**: ReceivingIssuing

### ProductsModule
- **Purpose**: Finished goods management
- **Key Features**: Product masters, BOM, stock tracking, production steps, lot tracking
- **Entities**: Product, ProductBOM, ProductLocation, ProductFGLot, ProductStockMovement
- **Controllers**: Master, Inventory, ProductionSteps, Upload

### ProductionPlansModule
- **Purpose**: Production planning
- **Entities**: ProductionPlan, ProductionPlanItem, MaterialReservation
- **Key Features**: Material reservations for production

### ProductionOrdersModule
- **Purpose**: Production execution
- **Entities**: ProductionOrder, ProductionLot, ProductionProcess, ProductionStep
- **Key Features**: Lot tracking, step quantities, process management

### SalesModule
- **Purpose**: Sales order management
- **Entities**: Order, OrderItem, OrderApproval, OrderStatusHistory, Customer
- **Key Features**: Order approval workflow, stock reservations, import/export
- **Controllers**: Orders, Customers, Products, Dashboard, Reports, Import

### SalesPlanningModule
- **Purpose**: Sales planning and forecasting
- **Entities**: PlanningBatch, PlanningRow, PlanningHistory, PlanningError
- **Key Features**: Excel import/export, planning templates

### AiChatModule
- **Purpose**: AI chat integration
- **Components**: Controller, Service, DTO

### AuditModule
- **Purpose**: Centralized audit logging
- **Entities**: ApiLog, AuthLog, QRScanLog
- **Services**: ApiAuditService, QRScanLogService

## Cross-Cutting Concerns

### Logging
- **Framework**: nestjs-pino
- **Implementation**: Global logging interceptor, audit service
- **Schemas**: logs.api_logs, logs.auth_logs, logs.qr_scan_logs

### Validation
- **Framework**: class-validator
- **Implementation**: Global ValidationPipe with custom error formatting
- **Custom Validators**: po-no.validation.ts

### Exception Handling
- **Global Filter**: HttpExceptionFilter
- **Error Codes**: PcErrorCode enum in shared/errors/

### CORS Configuration
- **Development**: Allows localhost, private LAN (if enabled), Cloudflare tunnels
- **Production**: Configured via CORS_ORIGINS env var
- **Custom Headers**: x-user-id, x-username, x-department-id

### File Upload
- **Static Files**: Served from `/uploads/` directory
- **Implementation**: NestExpressApplication with useStaticAssets

## Database Architecture

### Schema Organization
- **auth**: Authentication and authorization data
- **master**: Master data (products, materials, processes)
- **sales**: Sales and planning data
- **logs**: Audit logs
- **public**: Stock movements, transactions (cross-schema references)

### Migration Strategy
- **Tool**: Custom SQL migrations in `database/migrations/`
- **Naming**: Sequential numbering (004-087)
- **Execution**: Via npm scripts using ts-node

### Database Connection
- **Module**: DatabaseModule from libs/common
- **ORM**: TypeORM
- **Driver**: pg (PostgreSQL)

## Business Logic Layer
Located in `src/business/`:
- **pc/**: Production Control business logic
  - **receiving/**: Material receiving business logic
- Separates complex business rules from service layer

## Shared Libraries
Located in `libs/common/src/`:
- **database/**: Database module configuration
- **logger/**: Logging utilities
- **response/**: Response helpers
- **utils/**: Common utilities (e.g., inventory-style-qr)

## Security Architecture
1. **Authentication**: JWT tokens
2. **Authorization**: Role-based with department scoping
3. **Guards**: 
   - JwtAuthGuard: Validates JWT tokens
   - RolesGuard: Checks role permissions
   - DepartmentsGuard: Checks department access
4. **Decorators**: @Roles, @Departments, @Public
5. **Middleware**: Global logger middleware

## API Design Patterns
- **RESTful**: Standard HTTP methods (GET, POST, PUT, DELETE, PATCH)
- **Response Format**: Standardized via response helper
- **Error Handling**: Global exception filter with custom error codes
- **Validation**: DTO validation with class-validator

## Performance Considerations
- **Connection Pooling**: TypeORM default
- **Lazy Loading**: TypeORM relations
- **Indexing**: Database indexes via migrations
- **Static File Serving**: Direct file system access

## Deployment Architecture
- **Containerization**: Docker support
- **Compose Files**: 
  - docker-compose.yml: Standard deployment
  - docker-compose.dev.yml: Development
  - docker-compose.host-db.yml: Host database
- **Environment Variables**: .env file (gitignored)
- **Port**: 3006 (configurable via PORT env var)
