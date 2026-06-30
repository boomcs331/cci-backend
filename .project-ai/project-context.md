# Project Context

## Project Overview
- **Name**: CCI Backend
- **Type**: NestJS Backend API
- **Purpose**: Manufacturing/Production Management System backend
- **Language**: TypeScript
- **Framework**: NestJS 11.x
- **Database**: PostgreSQL with TypeORM
- **Package Manager**: pnpm

## Business Domain
This is a manufacturing/production management system that handles:
- **Materials Management**: Raw material receiving, issuing, inventory tracking
- **Production Management**: Production orders, lots, steps, processes
- **Products Management**: Finished goods, BOM, stock, inventory
- **Sales Management**: Orders, customers, delivery rounds, sales planning
- **Authentication & Authorization**: Department-based RBAC, multi-department users
- **Audit Logging**: API logs, auth logs, QR scan logs

## Key Business Entities
- **Materials**: Raw materials with workpiece images, receiving via PO numbers
- **Products**: Finished goods with BOM, production steps, lot tracking
- **Production Orders**: Manufacturing orders linked to production plans
- **Production Lots**: Track material consumption per production step
- **Sales Orders**: Customer orders with approval workflow
- **Sales Planning**: Planning batches with import/export functionality
- **Users**: Multi-department users with role-based permissions
- **Departments**: Welding, Press, PC (Production Control), Sales, etc.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: NestJS 11.0.1
- **ORM**: TypeORM 0.3.28
- **Database**: PostgreSQL (pg 8.16.3)
- **Validation**: class-validator 0.14.3
- **Logging**: nestjs-pino 4.5.0
- **File Processing**: xlsx 0.18.5, pdfkit 0.15.2
- **Authentication**: bcrypt 6.0.0, JWT (implied)

## Project Structure
```
cci-backend/
├── src/
│   ├── modules/           # Feature modules
│   │   ├── auth/         # Authentication & authorization
│   │   ├── materials/    # Materials management
│   │   ├── products/     # Products & inventory
│   │   ├── production-plans/    # Production planning
│   │   ├── production-orders/   # Production execution
│   │   ├── sales/        # Sales orders & management
│   │   ├── sales-planning/      # Sales planning
│   │   └── ai-chat/      # AI chat integration
│   ├── core/             # Core functionality
│   │   └── audit/        # Audit logging
│   ├── business/         # Business logic layer
│   ├── shared/           # Shared utilities
│   └── common/           # Common filters, interceptors
├── libs/
│   └── common/           # Shared library (database, logger, response)
├── database/
│   └── migrations/       # SQL migration files (004-087)
├── scripts/              # Utility scripts (migrations, seeds)
├── test/                 # Test files
└── uploads/              # File upload directory
```

## Database Schemas
- **auth**: users, roles, permissions, menus, departments, user_role_assignments, user_departments
- **master**: products, product_bom, product_locations, materials, material_categories, production_processes, production_steps
- **sales**: orders, order_items, order_approvals, order_status_history, customers, planning_batches, planning_rows, planning_history
- **logs**: api_logs, auth_logs, qr_scan_logs
- **public**: product_stock_movements, product_fg_lot_movements, material_transactions

## Key Features
1. **Department-Scoped RBAC**: Users can belong to multiple departments with different roles
2. **PO Number Validation**: Material receiving validates PO number format
3. **Production Lot Tracking**: Track material consumption per production step with lineage
4. **QR Code Scanning**: QR scan events logging for tracking
5. **Sales Planning**: Excel import/export for planning data
6. **Multi-Department Roles**: Users can have different permissions per department
7. **Stock Reservations**: Sales orders can reserve product stock
8. **Audit Trail**: Comprehensive logging for API calls, auth events, QR scans

## Development Environment
- **Port**: 3006 (default)
- **CORS**: Configured for localhost, development LAN, and Cloudflare tunnels
- **Static Files**: Served from `/uploads/` prefix
- **Environment**: Uses `.env` file (gitignored)

## Important Notes
- **No frontend code in this repo** - This is backend-only
- **Migration files are numbered sequentially** (004-087)
- **Multi-schema database** - Tables organized by schema (auth, master, sales, logs)
- **Thai language support** - Many comments and some data in Thai
- **Docker support** - Multiple docker-compose files for different scenarios

## Known Limitations/Needs Confirmation
- **Business rules for production lot splitting** - Needs confirmation from domain expert
- **Sales approval workflow details** - Partially implemented, needs confirmation
- **Material reservation logic** - Needs confirmation on business rules
- **Production scheduling algorithm** - Needs confirmation
