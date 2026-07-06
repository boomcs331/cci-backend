# API Map

## Base URL
- **Development**: `http://localhost:3006`
- **Production**: Configured via environment variable
- **Global prefix**: none (root `/`)

## Authentication

The backend currently uses **header-based identity** rather than JWT Bearer tokens. Frontend must send `x-user-id` and `x-department-id` headers after login. The login response returns `permissions` and `menus` arrays used for RBAC.

### Auth Endpoints
**Base Path**: `/auth`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/auth/login` | User login | auth.controller.ts |
| POST | `/auth/register` | User registration | auth.controller.ts |
| GET | `/auth/menu` | Get navigation menu for user/department | auth.controller.ts |

### Users Management
**Base Path**: `/auth`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/profile/:id` | Get user profile | auth-users.controller.ts |
| GET | `/auth/users` | List all users | auth-users.controller.ts |
| GET | `/auth/users/:id` | Get user by ID | auth-users.controller.ts |
| GET | `/auth/users/:id/permissions` | Get user permissions | auth-users.controller.ts |
| PUT | `/auth/users/:id` | Update user | auth-users.controller.ts |
| DELETE | `/auth/users/:id` | Delete user | auth-users.controller.ts |
| PATCH | `/auth/users/:id/toggle-status` | Toggle user status | auth-users.controller.ts |
| PUT | `/auth/users/:id/roles` | Assign roles to user | auth-users.controller.ts |
| PUT | `/auth/users/:id/scoped-roles` | Assign scoped roles to user | auth-users.controller.ts |
| DELETE | `/auth/users/:userId/roles/:roleId` | Remove role from user | auth-users.controller.ts |
| POST | `/auth/users/:userId/roles/:roleId` | Add role to user | auth-users.controller.ts |

### Roles Management
**Base Path**: `/auth` (admin global guard)

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/roles` | List all roles | auth-roles.controller.ts |
| POST | `/auth/roles` | Create new role | auth-roles.controller.ts |
| POST | `/auth/roles-with-permissions` | Create role with permissions | auth-roles.controller.ts |
| GET | `/auth/roles/:id` | Get role by ID | auth-roles.controller.ts |
| PUT | `/auth/roles/:id` | Update role | auth-roles.controller.ts |
| DELETE | `/auth/roles/:id` | Delete role | auth-roles.controller.ts |
| PATCH | `/auth/roles/:id/toggle-status` | Toggle role status | auth-roles.controller.ts |
| GET | `/auth/roles/:id/users` | Get role users | auth-roles.controller.ts |
| GET | `/auth/roles/:id/users-with-role` | Get users with role | auth-roles.controller.ts |
| PUT | `/auth/roles/:id/permissions` | Assign permissions to role | auth-roles.controller.ts |
| DELETE | `/auth/roles/:roleId/permissions/:permissionId` | Remove permission from role | auth-roles.controller.ts |
| POST | `/auth/roles/:roleId/permissions/:permissionId` | Add permission to role | auth-roles.controller.ts |

### Permissions Management
**Base Path**: `/auth` (admin global guard)

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/permissions` | List all permissions | auth-permissions.controller.ts |
| POST | `/auth/permissions` | Create new permission | auth-permissions.controller.ts |
| GET | `/auth/permissions/:id` | Get permission by ID | auth-permissions.controller.ts |
| PUT | `/auth/permissions/:id` | Update permission | auth-permissions.controller.ts |
| DELETE | `/auth/permissions/:id` | Delete permission | auth-permissions.controller.ts |
| GET | `/auth/permissions/:id/roles` | Get roles for permission | auth-permissions.controller.ts |
| GET | `/auth/permissions/:id/roles-with-permission` | Get roles with permission | auth-permissions.controller.ts |
| GET | `/auth/permissions/modules/:module` | Get permissions by module | auth-permissions.controller.ts |
| GET | `/auth/modules` | List all modules | auth-permissions.controller.ts |

### Menus Management
**Base Path**: `/auth`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/menus` | List all menus | auth-menus.controller.ts |
| POST | `/auth/menus` | Create new menu | auth-menus.controller.ts |
| GET | `/auth/menus/:id` | Get menu by ID | auth-menus.controller.ts |
| PUT | `/auth/menus/:id` | Update menu | auth-menus.controller.ts |
| DELETE | `/auth/menus/:id` | Delete menu | auth-menus.controller.ts |

### Departments Management
**Base Path**: `/auth`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/departments` | List all departments | auth-departments.controller.ts |
| POST | `/auth/departments` | Create new department | auth-departments.controller.ts |
| GET | `/auth/departments/:id` | Get department by ID | auth-departments.controller.ts |
| PUT | `/auth/departments/:id` | Update department | auth-departments.controller.ts |
| DELETE | `/auth/departments/:id` | Delete department | auth-departments.controller.ts |

### Audit Logs
**Base Path**: `/auth`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/audit/recent-logins` | Recent login attempts | auth-audit.controller.ts |
| GET | `/auth/audit/failed-logins` | Failed login attempts | auth-audit.controller.ts |
| GET | `/auth/audit/login-statistics` | Login statistics | auth-audit.controller.ts |

## Materials

### Materials Management
**Base Path**: `/materials`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/materials` | List all materials (paginated, filterable) | materials.controller.ts |
| GET | `/materials/all` | List all materials without pagination | materials.controller.ts |
| GET | `/materials/stock` | Stock list | materials.controller.ts |
| GET | `/materials/:id` | Get material by ID | materials.controller.ts |
| POST | `/materials` | Create new material | materials.controller.ts |
| PATCH | `/materials/:id` | Update material | materials.controller.ts |
| DELETE | `/materials/:id` | Delete material | materials.controller.ts |
| POST | `/materials/stock/receive` | Receive stock | materials.controller.ts |
| POST | `/materials/stock/issue` | Issue stock | materials.controller.ts |

### Material Transactions
**Base Path**: `/materials/transactions`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/materials/transactions/receive` | Create receiving | receiving-issuing.controller.ts |
| POST | `/materials/transactions/issue-with-document` | Issue with document | receiving-issuing.controller.ts |
| POST | `/materials/transactions/issue-from-bom` | Issue from product BOM | receiving-issuing.controller.ts |
| POST | `/materials/transactions/issue-from-material-bom` | Issue from material BOM | receiving-issuing.controller.ts |
| POST | `/materials/transactions/issue-manual` | Manual issue | receiving-issuing.controller.ts |
| POST | `/materials/transactions/issue-production` | Production issue | receiving-issuing.controller.ts |
| POST | `/materials/transactions/issue-production/preview` | Preview production issue | receiving-issuing.controller.ts |
| GET | `/materials/transactions/issues` | List issues | receiving-issuing.controller.ts |
| GET | `/materials/transactions/issues/:id` | Get issue by ID | receiving-issuing.controller.ts |
| GET | `/materials/transactions/issues/:id/documents` | Get issue documents | receiving-issuing.controller.ts |
| GET | `/materials/transactions/receivings` | List receivings | receiving-issuing.controller.ts |
| GET | `/materials/transactions/issuings` | List issuings | receiving-issuing.controller.ts |
| GET | `/materials/transactions/qr/:qrCode` | Get lot by QR code | receiving-issuing.controller.ts |
| GET | `/materials/transactions/qr/:qrCode/transactions` | Get lot transactions | receiving-issuing.controller.ts |
| GET | `/materials/transactions/lots` | List material lots | receiving-issuing.controller.ts |
| GET | `/materials/transactions/issuing-types` | List issuing types | receiving-issuing.controller.ts |
| GET | `/materials/transactions/issuing-types/:id` | Get issuing type by ID | receiving-issuing.controller.ts |
| GET | `/materials/transactions/stock` | Material stock list | receiving-issuing.controller.ts |
| GET | `/materials/transactions/stock/:materialId` | Get stock by material | receiving-issuing.controller.ts |
| GET | `/materials/transactions/report/transactions` | Transaction report | receiving-issuing.controller.ts |
| GET | `/materials/transactions/traceability/by-lot` | Traceability by lot | receiving-issuing.controller.ts |
| GET | `/materials/transactions/traceability/by-issuing` | Traceability by issuing | receiving-issuing.controller.ts |
| GET | `/materials/transactions/traceability/by-production-order` | Traceability by production order | receiving-issuing.controller.ts |

### Material Issues (legacy module)
**Base Path**: `/material-issues`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/material-issues` | List material issues | material-issues.controller.ts |
| POST | `/material-issues` | Create manual issue | material-issues.controller.ts |
| POST | `/material-issues/production` | Create production issue | material-issues.controller.ts |
| POST | `/material-issues/production/preview` | Preview production issue | material-issues.controller.ts |
| GET | `/material-issues/:id` | Get material issue | material-issues.controller.ts |

### Material Upload
**Base Path**: `/materials/upload`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/materials/upload/document` | Upload documents (multi) | upload.controller.ts |
| POST | `/materials/upload/workpiece-image` | Upload workpiece image | upload.controller.ts |

### Master Data (Materials)
**Base Path**: `/masters`

| Resource | Endpoints | Controller |
|----------|-----------|------------|
| Models | `/masters/models` (all/list/CRUD) | master.controller.ts |
| Delivery Types | `/masters/delivery-types` (all/list/CRUD) | master.controller.ts |
| Units | `/masters/units` (all/list/CRUD) | master.controller.ts |
| Loading Points | `/masters/loading-points` (all/list/CRUD) | master.controller.ts |
| Process Lines | `/masters/process-lines` (all/list/CRUD) | master.controller.ts |
| Suppliers | `/masters/suppliers` (all/list/CRUD) | master.controller.ts |
| Materials Types | `/masters/materials-types` (all/list/CRUD) | master.controller.ts |
| Materials Locations | `/masters/materials-locations` (all/list/CRUD) | master.controller.ts |

## Products

### Products Management
**Base Path**: `/products`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/products` | List all products (paginated) | products.controller.ts |
| GET | `/products/all` | List all products without pagination | products.controller.ts |
| GET | `/products/:id` | Get product by ID | products.controller.ts |
| GET | `/products/code/:code` | Get product by code | products.controller.ts |
| POST | `/products` | Create product | products.controller.ts |
| POST | `/products/with-bom` | Create product with BOM | products.controller.ts |
| PATCH | `/products/:id` | Update product | products.controller.ts |
| DELETE | `/products/:id` | Delete product | products.controller.ts |
| GET | `/products/:id/bom` | Get BOM | products.controller.ts |
| POST | `/products/:id/bom` | Add BOM items | products.controller.ts |
| PATCH | `/products/:id/bom` | Update BOM | products.controller.ts |
| DELETE | `/products/:id/bom/:bomId` | Remove BOM item | products.controller.ts |
| GET | `/products/:id/production-steps` | Get production steps | products.controller.ts |
| PUT | `/products/:id/production-steps` | Set production steps | products.controller.ts |
| GET | `/products/:id/material-requirements?quantity=100` | Calculate material requirements | products.controller.ts |

### Product Inventory
**Base Path**: `/products`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/products/reports/fg-lot-trace` | FG lot trace report | product-inventory.controller.ts |
| GET | `/products/stock/alerts` | Stock alerts | product-inventory.controller.ts |
| GET | `/products/stock` | Product stock list | product-inventory.controller.ts |
| GET | `/products/sales-reservations` | Sales reservations | product-inventory.controller.ts |
| POST | `/products/sales-reservations` | Create sales reservation | product-inventory.controller.ts |
| POST | `/products/sales-reservations/:id/release` | Release reservation | product-inventory.controller.ts |
| POST | `/products/sales-reservations/:id/fulfill` | Fulfill reservation | product-inventory.controller.ts |

### Product Masters
**Base Path**: `/masters/products`

| Resource | Endpoints | Controller |
|----------|-----------|------------|
| Locations | `/masters/products/locations` (all/list/CRUD) | master.controller.ts |
| Customers | `/masters/products/customers` (all/list/CRUD) | master.controller.ts |
| Types | `/masters/products/types` (all/list/CRUD) | master.controller.ts |
| Models | `/masters/products/models` (all/list/CRUD) | master.controller.ts |
| Delivery Types | `/masters/products/delivery-types` (all/list/CRUD) | master.controller.ts |
| Units | `/masters/products/units` (all/list/CRUD) | master.controller.ts |
| Loading Points | `/masters/products/loading-points` (all/list/CRUD) | master.controller.ts |
| Process Lines | `/masters/products/process-lines` (all/list/CRUD) | master.controller.ts |

### Product Production Steps
**Base Path**: `/masters/product-production-steps`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/masters/product-production-steps` | List product production steps | product-production-steps.controller.ts |
| GET | `/masters/product-production-steps/:id` | Get step by ID | product-production-steps.controller.ts |
| POST | `/masters/product-production-steps` | Create step | product-production-steps.controller.ts |
| PATCH | `/masters/product-production-steps/:id` | Update step | product-production-steps.controller.ts |
| DELETE | `/masters/product-production-steps/:id` | Delete step | product-production-steps.controller.ts |

### Product Upload
**Base Path**: `/products/upload`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/products/upload/product-image` | Upload product image | products-upload.controller.ts |

## Production Plans

**Base Path**: `/production-plans` (department-scoped)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/production-plans` | List production plans | `production_plans.read` |
| GET | `/production-plans/:id` | Get production plan | `production_plans.read` |
| GET | `/production-plans/:id/details` | Get plan details | `production_plans.read` |
| POST | `/production-plans` | Create production plan | `production_plans.create` |
| PATCH | `/production-plans/:id` | Update production plan | `production_plans.update` |
| DELETE | `/production-plans/:id` | Delete production plan | `production_plans.delete` |
| POST | `/production-plans/:id/items` | Add plan item | `production_plans.update` |
| PATCH | `/production-plans/:id/items/:itemId` | Update plan item | `production_plans.update` |
| DELETE | `/production-plans/:id/items/:itemId` | Delete plan item | `production_plans.update` |
| POST | `/production-plans/:id/reserve` | Reserve materials | `production_plans.reserve` |
| POST | `/production-plans/:id/confirm` | Confirm plan | `production_plans.approve` |
| POST | `/production-plans/:id/issue` | Issue materials | `production_plans.issue` |
| POST | `/production-plans/:id/confirm-and-issue` | Confirm and issue | `production_plans.approve` + `production_plans.issue` |
| POST | `/production-plans/:id/generate-product-qr-orders` | Generate production orders + QR lots | `production_plans.generate_orders` |
| POST | `/production-plans/:id/cancel` | Cancel plan | `production_plans.cancel` |
| GET | `/production-plans/materials/availability` | Material availability | `production_plans.read` |
| GET | `/production-plans/materials/reservations` | Material reservations | `production_plans.read` |
| POST | `/production-plans/fix-remaining-quantity` | Fix remaining quantity | `production_plans.manage` |
| POST | `/production-plans/fix-lots-from-stock` | Fix lots from stock | `production_plans.manage` |
| GET | `/production-plans/debug/material/:materialCode` | Debug material data | `production_plans.manage` |
| GET | `/production-plans/debug/check-availability/:materialId` | Check availability | `production_plans.manage` |

## Production Orders

**Base Path**: `/production-orders` (department-scoped)

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/production-orders` | List production orders | `production_orders.read` |
| POST | `/production-orders` | Create production order | `production_orders.create` |
| GET | `/production-orders/:id` | Get production order with lots | `production_orders.read` |
| POST | `/production-orders/:id/start` | Start production order | `production_orders.update` |
| GET | `/production-orders/reports/lot-step-trace` | Lot step trace report | `production_orders.read` |
| GET | `/production-orders/in-progress/my-dept` | In-progress lots for my department | `production_orders.read` + `production_orders.update` |
| GET | `/production-orders/lots/:qrCode/station` | QR station info | `production_orders.read` / `production_orders.update` |
| GET | `/production-orders/lots/:qrCode/step-quantities` | Lot step quantities | `production_orders.read` / `production_orders.update` |
| GET | `/production-orders/lots/:qrCode/tracking` | Lot tracking | `production_orders.read` / `production_orders.update` |
| GET | `/production-orders/lots/:qrCode/lineage` | Lot lineage | `production_orders.read` / `production_orders.update` |
| GET | `/production-orders/lots/:qrCode/status` | Lot status | `production_orders.read` / `production_orders.update` |
| POST | `/production-orders/lots/:qrCode/start` | Start lot process | `production_orders.update` |
| POST | `/production-orders/lots/:qrCode/complete` | Complete lot process | `production_orders.update` |
| POST | `/production-orders/lots/:qrCode/split` | Split lot | `production_orders.update` |
| POST | `/production-orders/processes` | Create process for order | `production_orders.manage` |
| GET | `/production-orders/processes/all` | List all processes | `production_orders.read` |

### Production Processes (master)
**Base Path**: `/masters/production-processes`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/masters/production-processes` | List production processes | production-processes.controller.ts |
| GET | `/masters/production-processes/:id` | Get process by ID | production-processes.controller.ts |
| POST | `/masters/production-processes` | Create production process | production-processes.controller.ts |
| PATCH | `/masters/production-processes/:id` | Update production process | production-processes.controller.ts |
| DELETE | `/masters/production-processes/:id` | Delete production process | production-processes.controller.ts |

## Sales

### Sales Orders
**Base Path**: `/sales/orders`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/sales/orders` | List sales orders | `sales_order.read` |
| GET | `/sales/orders/pending-approval` | Pending approvals | `sales_order.approve` |
| GET | `/sales/orders/:id` | Get sales order | `sales_order.read` |
| POST | `/sales/orders` | Create sales order | `sales_order.create` |
| PATCH | `/sales/orders/:id` | Update sales order | `sales_order.update` |
| DELETE | `/sales/orders/:id` | Delete sales order | `sales_order.delete` |
| POST | `/sales/orders/:id/submit` | Submit order | `sales_order.create` |
| POST | `/sales/orders/:id/approve` | Approve order | `sales_order.approve` |
| POST | `/sales/orders/:id/reject` | Reject order | `sales_order.approve` |
| POST | `/sales/orders/:id/cancel` | Cancel order | `sales_order.update` |
| POST | `/sales/orders/:id/status` | Advance status | `sales_order.update` |
| GET | `/sales/orders/export` | Export Excel | `sales_order.export` |
| GET | `/sales/orders/export/pdf` | Export PDF | `sales_order.export` |

### Sales Customers
**Base Path**: `/sales/customers`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/sales/customers` | List customers | sales-customers.controller.ts |
| GET | `/sales/customers/:id` | Get customer by ID | sales-customers.controller.ts |
| POST | `/sales/customers` | Create customer | sales-customers.controller.ts |
| PATCH | `/sales/customers/:id` | Update customer | sales-customers.controller.ts |
| DELETE | `/sales/customers/:id` | Delete customer | sales-customers.controller.ts |

### Sales Products
**Base Path**: `/sales/products`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/sales/products` | List sales products | sales-products.controller.ts |
| GET | `/sales/products/:id` | Get sales product | sales-products.controller.ts |
| POST | `/sales/products` | Create sales product | sales-products.controller.ts |
| PATCH | `/sales/products/:id` | Update sales product | sales-products.controller.ts |
| DELETE | `/sales/products/:id` | Delete sales product | sales-products.controller.ts |

### Sales Dashboard
**Base Path**: `/sales/dashboard`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/sales/dashboard/summary` | Dashboard summary | `sales_order.read` |
| GET | `/sales/dashboard/kpi` | KPI | `sales_order.read` |
| GET | `/sales/dashboard/sales-chart?days=30` | Sales chart | `sales_order.read` |
| GET | `/sales/dashboard/top-products?limit=5` | Top products | `sales_order.read` |
| GET | `/sales/dashboard/upcoming-deliveries?days=7` | Upcoming deliveries | `sales_order.read` |

### Sales Reports
**Base Path**: `/sales/reports`

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | `/sales/reports/summary?year=2026` | Summary report | `sales_order.read` |
| GET | `/sales/reports/by-customer?year=2026` | Sales by customer | `sales_order.read` |
| GET | `/sales/reports/by-product?year=2026` | Sales by product | `sales_order.read` |
| GET | `/sales/reports/monthly?year=2026` | Monthly sales | `sales_order.read` |

### Sales Import
**Base Path**: `/sales/import`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/sales/import/template` | Download template | sales-import.controller.ts |
| POST | `/sales/import/upload` | Upload Excel | sales-import.controller.ts |
| GET | `/sales/import/batches` | List batches | sales-import.controller.ts |
| GET | `/sales/import/batches/:id` | Get batch | sales-import.controller.ts |
| POST | `/sales/import/commit` | Commit batch | sales-import.controller.ts |

## Sales Planning

### Planning Data
**Base Path**: `/sales-planning`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/sales-planning` | List planning data | planning-data.controller.ts |
| GET | `/sales-planning/row/:id` | Get planning row | planning-data.controller.ts |
| DELETE | `/sales-planning/batch/:batchId` | Delete planning batch | planning-data.controller.ts |

### Planning Templates
**Base Path**: `/sales-planning/template`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/sales-planning/template` | Download planning template | planning-template.controller.ts |

### Planning Import
**Base Path**: `/sales-planning/import`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/sales-planning/import` | Import planning Excel | planning-import.controller.ts |
| GET | `/sales-planning/import/:batchId/status` | Batch status | planning-import.controller.ts |
| GET | `/sales-planning/import/:batchId/errors` | Batch errors | planning-import.controller.ts |
| GET | `/sales-planning/import/:batchId/rows` | Batch rows | planning-import.controller.ts |
| GET | `/sales-planning/import/:batchId/detail` | Batch detail | planning-import.controller.ts |
| POST | `/sales-planning/import/:batchId/cancel` | Cancel batch | planning-import.controller.ts |
| DELETE | `/sales-planning/import/:batchId` | Delete batch | planning-import.controller.ts |
| POST | `/sales-planning/import/:batchId/reprocess` | Reprocess batch | planning-import.controller.ts |
| GET | `/sales-planning/import/:batchId/download` | Download original file | planning-import.controller.ts |
| POST | `/sales-planning/import/history` | Import history | planning-import.controller.ts |

## AI Chat

**Base Path**: `/ai`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/ai/chat` | Send chat message | ai-chat.controller.ts |

## Audit / Logs

**Base Path**: `/logs`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/logs/api/recent?limit=100` | Recent API calls | logs.controller.ts |
| GET | `/logs/api/errors?limit=50` | Recent errors | logs.controller.ts |
| GET | `/logs/api/statistics?timeWindow=60` | API statistics | logs.controller.ts |
| GET | `/logs/api/slow?threshold=1000&limit=20` | Slow requests | logs.controller.ts |
| GET | `/logs/api/by-ip/:ip` | Requests by IP | logs.controller.ts |
| GET | `/logs/api/by-endpoint?method=GET&url=/products` | Requests by endpoint | logs.controller.ts |
| GET | `/logs/health` | Log health | logs.controller.ts |
| GET | `/logs/database/stats` | Database stats | logs.controller.ts |
| GET | `/logs/database/cleanup?days=90` | Cleanup old logs | logs.controller.ts |

## Health & Root

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/` | Hello message | app.controller.ts |
| GET | `/health` | Health check | app.controller.ts |

## Common Headers

### Request Headers
- `Content-Type`: `application/json`
- `x-user-id`: User ID (required for most protected endpoints)
- `x-department-id`: Department ID (required for production-plans and production-orders)
- `x-username`: Username (optional, for audit logging)

### Response Formats

**Standard (ResponseHelper)**:
```json
{
  "success": true,
  "message": "Success message",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Paginated**:
```json
{
  "success": true,
  "message": "Success message",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Auth (withMessage/withCollection)**:
```json
{ "message": "User created successfully", "user": {} }
{ "users": [] }
{ "message": "Login successful", "user": {}, "permissions": [], "menus": [] }
```

Error response:
```json
{
  "success": false,
  "code": "VALIDATION_FAILED",
  "message": "ข้อมูลไม่ถูกต้อง",
  "errors": [],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Public Endpoints

- `POST /auth/login`
- `POST /auth/register`

## Department Scoping

`production-plans` and `production-orders` are department-scoped via `x-department-id` header. Many endpoints filter data based on the user's department assignments.

## Pagination

Most list endpoints use `page` and `limit` query parameters (defaults vary). Some endpoints use `skip`/`take` (e.g., sales-planning import history). Check each controller for exact query parameters.

## File Upload

File upload endpoints use `multipart/form-data`:
- `POST /sales/import/upload`
- `POST /sales-planning/import`
- `POST /materials/upload/document`
- `POST /materials/upload/workpiece-image`
- `POST /products/upload/product-image`

Uploaded files are served from `/uploads/<path>`.

## Permission Reference

| Module | Permissions |
|--------|-------------|
| Sales Orders | `sales_order.read`, `sales_order.create`, `sales_order.update`, `sales_order.delete`, `sales_order.approve`, `sales_order.export` |
| Production Plans | `production_plans.read`, `production_plans.create`, `production_plans.update`, `production_plans.delete`, `production_plans.approve`, `production_plans.issue`, `production_plans.reserve`, `production_plans.generate_orders`, `production_plans.cancel`, `production_plans.manage` |
| Production Orders | `production_orders.read`, `production_orders.create`, `production_orders.update`, `production_orders.manage` |
| Product Stock | `products.stock.read`, `products.sales.reserve` |

For frontend integration guidance, see `docs/frontend-api-wiki.md` and `.project-ai/frontend-guide.md`.
