# API Map

## Base URL
- **Development**: `http://localhost:3006`
- **Production**: Configured via environment variable

## Authentication

### Auth Endpoints
**Base Path**: `/auth`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/auth/login` | User login | auth.controller.ts |
| POST | `/auth/register` | User registration | auth.controller.ts |
| POST | `/auth/refresh` | Refresh JWT token | auth.controller.ts |
| POST | `/auth/logout` | User logout | auth.controller.ts |

### Users Management
**Base Path**: `/auth`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/users` | List all users | auth-users.controller.ts |
| GET | `/auth/users/:id` | Get user by ID | auth-users.controller.ts |
| POST | `/auth/users` | Create new user | auth-users.controller.ts |
| PUT | `/auth/users/:id` | Update user | auth-users.controller.ts |
| DELETE | `/auth/users/:id` | Delete user | auth-users.controller.ts |
| POST | `/auth/users/:id/departments` | Assign departments to user | auth-users.controller.ts |

### Roles Management
**Base Path**: `/auth`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/roles` | List all roles | auth-roles.controller.ts |
| GET | `/auth/roles/:id` | Get role by ID | auth-roles.controller.ts |
| POST | `/auth/roles` | Create new role | auth-roles.controller.ts |
| PUT | `/auth/roles/:id` | Update role | auth-roles.controller.ts |
| DELETE | `/auth/roles/:id` | Delete role | auth-roles.controller.ts |
| POST | `/auth/roles/:id/permissions` | Assign permissions to role | auth-roles.controller.ts |

### Permissions Management
**Base Path**: `/auth`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/permissions` | List all permissions | auth-permissions.controller.ts |
| GET | `/auth/permissions/:id` | Get permission by ID | auth-permissions.controller.ts |
| POST | `/auth/permissions` | Create new permission | auth-permissions.controller.ts |
| PUT | `/auth/permissions/:id` | Update permission | auth-permissions.controller.ts |
| DELETE | `/auth/permissions/:id` | Delete permission | auth-permissions.controller.ts |

### Menus Management
**Base Path**: `/auth`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/menus` | List all menus | auth-menus.controller.ts |
| GET | `/auth/menus/:id` | Get menu by ID | auth-menus.controller.ts |
| POST | `/auth/menus` | Create new menu | auth-menus.controller.ts |
| PUT | `/auth/menus/:id` | Update menu | auth-menus.controller.ts |
| DELETE | `/auth/menus/:id` | Delete menu | auth-menus.controller.ts |

### Departments Management
**Base Path**: `/auth`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/departments` | List all departments | auth-departments.controller.ts |
| GET | `/auth/departments/:id` | Get department by ID | auth-departments.controller.ts |
| POST | `/auth/departments` | Create new department | auth-departments.controller.ts |
| PUT | `/auth/departments/:id` | Update department | auth-departments.controller.ts |
| DELETE | `/auth/departments/:id` | Delete department | auth-departments.controller.ts |

### Audit Logs
**Base Path**: `/auth`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/audit/logs` | Get audit logs | auth-audit.controller.ts |

## Materials

### Materials Management
**Base Path**: `/materials`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/materials` | List all materials | materials.controller.ts |
| GET | `/materials/:id` | Get material by ID | materials.controller.ts |
| POST | `/materials` | Create new material | materials.controller.ts |
| PUT | `/materials/:id` | Update material | materials.controller.ts |
| DELETE | `/materials/:id` | Delete material | materials.controller.ts |

### Material Transactions
**Base Path**: `/materials/transactions`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/materials/transactions` | List material transactions | receiving-issuing.controller.ts |
| POST | `/materials/transactions/receive` | Receive materials | receiving-issuing.controller.ts |
| POST | `/materials/transactions/issue` | Issue materials | receiving-issuing.controller.ts |
| GET | `/materials/transactions/:id` | Get transaction by ID | receiving-issuing.controller.ts |

### Material Issues
**Base Path**: `/material-issues`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/material-issues` | List material issues | material-issues.controller.ts |
| POST | `/material-issues` | Create material issue | material-issues.controller.ts |
| PUT | `/material-issues/:id` | Update material issue | material-issues.controller.ts |

### Material Upload
**Base Path**: `/materials/upload`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/materials/upload` | Upload material file | upload.controller.ts |

### Master Data
**Base Path**: `/masters`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/masters/materials` | List master materials | master.controller.ts |
| GET | `/masters/material-categories` | List material categories | master.controller.ts |
| POST | `/masters/materials` | Create master material | master.controller.ts |
| PUT | `/masters/materials/:id` | Update master material | master.controller.ts |

## Products

### Products Management
**Base Path**: `/products`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/products` | List all products | products.controller.ts |
| GET | `/products/:id` | Get product by ID | products.controller.ts |
| POST | `/products` | Create new product | products.controller.ts |
| PUT | `/products/:id` | Update product | products.controller.ts |
| DELETE | `/products/:id` | Delete product | products.controller.ts |

### Product Inventory
**Base Path**: `/products`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/products/inventory` | Get product inventory | product-inventory.controller.ts |
| GET | `/products/:id/stock` | Get product stock | product-inventory.controller.ts |

### Product Masters
**Base Path**: `/masters/products`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/masters/products` | List master products | master.controller.ts |
| GET | `/masters/products/:id` | Get master product by ID | master.controller.ts |
| POST | `/masters/products` | Create master product | master.controller.ts |
| PUT | `/masters/products/:id` | Update master product | master.controller.ts |
| DELETE | `/masters/products/:id` | Delete master product | master.controller.ts |

### Product Production Steps
**Base Path**: `/masters/product-production-steps`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/masters/product-production-steps` | List product production steps | product-production-steps.controller.ts |
| GET | `/masters/product-production-steps/:id` | Get step by ID | product-production-steps.controller.ts |
| POST | `/masters/product-production-steps` | Create production step | product-production-steps.controller.ts |
| PUT | `/masters/product-production-steps/:id` | Update production step | product-production-steps.controller.ts |
| DELETE | `/masters/product-production-steps/:id` | Delete production step | product-production-steps.controller.ts |

### Product Upload
**Base Path**: `/products/upload`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/products/upload` | Upload product file | products-upload.controller.ts |

## Production Plans

**Base Path**: `/production-plans`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/production-plans` | List all production plans | production-plans.controller.ts |
| GET | `/production-plans/:id` | Get production plan by ID | production-plans.controller.ts |
| POST | `/production-plans` | Create new production plan | production-plans.controller.ts |
| PUT | `/production-plans/:id` | Update production plan | production-plans.controller.ts |
| DELETE | `/production-plans/:id` | Delete production plan | production-plans.controller.ts |
| POST | `/production-plans/:id/items` | Add item to production plan | production-plans.controller.ts |
| PUT | `/production-plans/:id/items/:itemId` | Update plan item | production-plans.controller.ts |
| DELETE | `/production-plans/:id/items/:itemId` | Delete plan item | production-plans.controller.ts |

## Production Orders

**Base Path**: `/production-orders`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/production-orders` | List all production orders | production-orders.controller.ts |
| GET | `/production-orders/:id` | Get production order by ID | production-orders.controller.ts |
| POST | `/production-orders` | Create new production order | production-orders.controller.ts |
| PUT | `/production-orders/:id` | Update production order | production-orders.controller.ts |
| DELETE | `/production-orders/:id` | Delete production order | production-orders.controller.ts |
| POST | `/production-orders/:id/lots` | Create production lot | production-orders.controller.ts |
| PUT | `/production-orders/:id/lots/:lotId` | Update production lot | production-orders.controller.ts |

### Production Processes
**Base Path**: `/masters/production-processes`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/masters/production-processes` | List production processes | production-processes.controller.ts |
| GET | `/masters/production-processes/:id` | Get process by ID | production-processes.controller.ts |
| POST | `/masters/production-processes` | Create production process | production-processes.controller.ts |
| PUT | `/masters/production-processes/:id` | Update production process | production-processes.controller.ts |
| DELETE | `/masters/production-processes/:id` | Delete production process | production-processes.controller.ts |

## Sales

### Sales Orders
**Base Path**: `/sales/orders`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/sales/orders` | List all sales orders | sales-orders.controller.ts |
| GET | `/sales/orders/:id` | Get sales order by ID | sales-orders.controller.ts |
| POST | `/sales/orders` | Create new sales order | sales-orders.controller.ts |
| PUT | `/sales/orders/:id` | Update sales order | sales-orders.controller.ts |
| DELETE | `/sales/orders/:id` | Delete sales order | sales-orders.controller.ts |
| POST | `/sales/orders/:id/approve` | Approve sales order | sales-orders.controller.ts |
| POST | `/sales/orders/:id/reject` | Reject sales order | sales-orders.controller.ts |
| POST | `/sales/orders/:id/items` | Add item to sales order | sales-orders.controller.ts |
| PUT | `/sales/orders/:id/items/:itemId` | Update order item | sales-orders.controller.ts |
| DELETE | `/sales/orders/:id/items/:itemId` | Delete order item | sales-orders.controller.ts |

### Sales Customers
**Base Path**: `/sales/customers`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/sales/customers` | List all customers | sales-customers.controller.ts |
| GET | `/sales/customers/:id` | Get customer by ID | sales-customers.controller.ts |
| POST | `/sales/customers` | Create new customer | sales-customers.controller.ts |
| PUT | `/sales/customers/:id` | Update customer | sales-customers.controller.ts |
| DELETE | `/sales/customers/:id` | Delete customer | sales-customers.controller.ts |

### Sales Products
**Base Path**: `/sales/products`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/sales/products` | List products for sales | sales-products.controller.ts |
| GET | `/sales/products/:id` | Get product details for sales | sales-products.controller.ts |

### Sales Dashboard
**Base Path**: `/sales/dashboard`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/sales/dashboard` | Get sales dashboard data | sales-dashboard.controller.ts |
| GET | `/sales/dashboard/summary` | Get sales summary | sales-dashboard.controller.ts |

### Sales Reports
**Base Path**: `/sales/reports`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/sales/reports/orders` | Generate order report | sales-reports.controller.ts |
| GET | `/sales/reports/customers` | Generate customer report | sales-reports.controller.ts |
| GET | `/sales/reports/products` | Generate product report | sales-reports.controller.ts |

### Sales Import
**Base Path**: `/sales/import`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/sales/import` | Import sales data from Excel | sales-import.controller.ts |
| GET | `/sales/import/batches/:id` | Get import batch by ID | sales-import.controller.ts |
| GET | `/sales/import/batches` | List import batches | sales-import.controller.ts |

## Sales Planning

### Planning Data
**Base Path**: `/sales-planning`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/sales-planning` | List planning data | planning-data.controller.ts |
| POST | `/sales-planning` | Create planning data | planning-data.controller.ts |
| PUT | `/sales-planning/:id` | Update planning data | planning-data.controller.ts |
| DELETE | `/sales-planning/:id` | Delete planning data | planning-data.controller.ts |

### Planning Templates
**Base Path**: `/sales-planning/template`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/sales-planning/template` | List planning templates | planning-template.controller.ts |
| POST | `/sales-planning/template` | Create planning template | planning-template.controller.ts |
| PUT | `/sales-planning/template/:id` | Update planning template | planning-template.controller.ts |
| DELETE | `/sales-planning/template/:id` | Delete planning template | planning-template.controller.ts |

### Planning Import/Export
**Base Path**: `/sales-planning/import`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/sales-planning/import` | Import planning data from Excel | planning-import.controller.ts |
| GET | `/sales-planning/export` | Export planning data to Excel | planning-import.controller.ts |

## AI Chat

**Base Path**: `/ai-chat`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/ai-chat` | Send chat message | ai-chat.controller.ts |
| GET | `/ai-chat/history` | Get chat history | ai-chat.controller.ts |

## Audit Logs

**Base Path**: (varies by module)

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/auth/audit/logs` | Get API/auth audit logs | auth-audit.controller.ts |
| GET | `/audit/qr-scans` | Get QR scan logs | logs.controller.ts |

## Common Headers

### Request Headers
- `Content-Type`: `application/json`
- `Authorization`: `Bearer <jwt_token>` (for protected endpoints)
- `x-user-id`: User ID (for audit logging)
- `x-username`: Username (for audit logging)
- `x-department-id`: Department ID (for department scoping)

### Response Format
All responses follow consistent format:
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error response:
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Error message",
  "errors": [],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Authentication

Most endpoints require JWT authentication via `Authorization: Bearer <token>` header.

Public endpoints (no auth required):
- POST `/auth/login`
- POST `/auth/register`

## Department Scoping

Many endpoints are department-scoped based on user's department assignments. Users with multiple departments may see aggregated data.

## Pagination

List endpoints support pagination via query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field
- `order`: Sort direction (asc/desc)

## Filtering

Many list endpoints support filtering via query parameters. Filter parameters vary by endpoint.

## File Upload

File upload endpoints:
- POST `/materials/upload`
- POST `/products/upload`

Files are served from `/uploads/` path.
