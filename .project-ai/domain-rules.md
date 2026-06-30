# Domain Rules

## Authentication & Authorization

### User Management
- **Multi-Department Users**: Users can belong to multiple departments
- **Department-Scoped Roles**: Users have different roles per department
- **Role Hierarchy**: Roles have hierarchical permissions
- **Menu-Based Access**: Access control based on menu permissions

### Authentication Flow
- **JWT Tokens**: Used for authentication after login
- **Token Expiration**: Tokens have configurable expiration time
- **Refresh Tokens**: Needs confirmation - implementation unclear
- **Password Hashing**: Uses bcrypt with appropriate salt rounds

### Authorization Rules
- **Role-Based**: Users must have appropriate role for resource
- **Department-Based**: Users can only access resources within their departments
- **Menu Permissions**: Access to UI features controlled by menu permissions
- **API Permissions**: Endpoint access controlled by permission codes

## Materials Management

### Material Receiving
- **PO Number Format**: Must follow specific format (validation in po-no.validation.ts)
- **PO Number Uniqueness**: Each material receiving must have unique PO number
- **Special Characters**: PO numbers can contain special characters (migration 043)
- **Quantity Validation**: Received quantities must be positive
- **Workpiece Images**: Materials can have associated workpiece images

### Material Issuing
- **Stock Availability**: Cannot issue more than available stock
- **Reservation Check**: Must check for reserved stock before issuing
- **Transaction Recording**: All issuances must be recorded as transactions
- **Department Validation**: Issuing must be within user's department scope

### Material Inventory
- **Stock Calculation**: Current stock = received - issued - reserved
- **Location Tracking**: Materials tracked by storage location
- **Category Hierarchy**: Materials organized by categories
- **Unit of Measure**: Consistent UOM for each material

## Products Management

### Product Masters
- **BOM Structure**: Products have Bill of Materials (product_bom table)
- **Production Steps**: Products have defined production steps
- **Location Assignment**: Products assigned to storage locations
- **Image Support**: Products can have associated images
- **Active/Inactive**: Products can be marked active or inactive

### Product Stock
- **FG Lot Tracking**: Finished goods tracked by lot numbers
- **Stock Movements**: All stock movements recorded
- **Reservation System**: Sales orders can reserve product stock
- **Lot Splitting**: Production lots can be split (needs confirmation on rules)
- **Lot Lineage**: Track lot parent-child relationships

### Production Steps
- **Sequential Order**: Production steps must be executed in order
- **Department Assignment**: Each step assigned to specific department
- **Quantity Tracking**: Track quantities at each step
- **Process Linking**: Steps linked to production processes

## Production Management

### Production Plans
- **Material Reservation**: Plans reserve materials for production
- **Item-Level Planning**: Plans contain multiple plan items
- **Date Planning**: Plans have planned start/end dates
- **Status Tracking**: Plans have status (draft, active, completed, cancelled)

### Production Orders
- **Plan Linking**: Orders linked to production plans
- **Lot Generation**: Each order generates production lots
- **Step Execution**: Lots progress through production steps
- **Quantity Sync**: Order quantities synced with lot quantities
- **Order Status**: Orders have status tracking

### Production Lots
- **Unique Lot Numbers**: Each lot has unique identifier
- **Step Quantities**: Track material consumption per step
- **Parent-Child**: Lots can have parent-child relationships (splitting)
- **Order Reference**: Lots reference production orders
- **Completion Tracking**: Track completion status per step

### Production Processes
- **Unique Codes**: Process codes must be unique
- **Department Stations**: Processes assigned to departments and stations
- **Step Definitions**: Processes define production steps
- **Master Data**: Processes are master data (seeded data)

## Sales Management

### Sales Orders
- **Approval Workflow**: Orders require approval before processing
- **Customer Assignment**: Orders linked to customers
- **Order Items**: Orders contain multiple order items
- **Status History**: Track status changes in history table
- **Delivery Rounds**: Orders assigned to delivery rounds (migration 083)
- **Line Assignment**: Orders can be assigned to production lines (migration 084)

### Order Approval
- **Approval Chain**: Multi-level approval process (needs confirmation)
- **Approval Recording**: Approvals recorded in order_approvals table
- **Status Changes**: Approval triggers status changes
- **Permission-Based**: Only authorized users can approve

### Stock Reservations
- **Automatic Reservation**: Orders automatically reserve stock
- **Reservation Check**: Check availability before reservation
- **Reservation Release**: Reservations released on order cancellation
- **Stock Deduction**: Stock deducted when order fulfilled

### Sales Import
- **Excel Format**: Orders can be imported via Excel
- **Batch Processing**: Imports processed in batches
- **Error Handling**: Import errors recorded in planning_errors table
- **Validation**: Data validated during import

## Sales Planning

### Planning Batches
- **Batch Creation**: Planning data organized in batches
- **Import/Export**: Batches can be imported/exported via Excel
- **Status Tracking**: Batches have status (draft, active, completed)
- **History Tracking**: Changes recorded in planning_history

### Planning Rows
- **Row Structure**: Each batch contains multiple planning rows
- **Data Fields**: Include product, quantity, date, customer, etc.
- **Validation**: Row data validated before processing
- **Error Recording**: Invalid rows recorded in planning_errors

### Planning Templates
- **Template Management**: Templates for common planning scenarios
- **Template Application**: Templates can be applied to new plans
- **Customization**: Templates can be customized

## Audit & Logging

### API Logging
- **Request Logging**: All API requests logged
- **Response Logging**: Response data logged (may be sanitized)
- **User Tracking**: Track user ID and department
- **Error Logging**: Errors logged with stack traces
- **Performance Tracking**: Track request duration

### Auth Logging
- **Login Events**: All login attempts logged
- **Logout Events**: Logout actions logged
- **Failed Attempts**: Failed authentication logged
- **Token Events**: Token generation and validation logged

### QR Scan Logging
- **Scan Events**: QR code scans logged
- **User Tracking**: Track who scanned
- **Timestamp**: Record scan timestamp
- **Context**: Scan context (material, product, lot, etc.)

## Business Rules (Needs Confirmation)

### Production Lot Splitting
- **Split Criteria**: When can lots be split? (needs confirmation)
- **Quantity Rules**: Minimum/maximum split quantities (needs confirmation)
- **Approval Required**: Does splitting require approval? (needs confirmation)
- **Lineage Tracking**: How to track split lineage? (partially implemented)

### Sales Approval Workflow
- **Approval Levels**: How many approval levels? (needs confirmation)
- **Approvers**: Who can approve? (needs confirmation)
- **Delegation**: Can approvals be delegated? (needs confirmation)
- **Auto-Approval**: Any auto-approval rules? (needs confirmation)

### Material Reservation Logic
- **Reservation Priority**: How to prioritize competing reservations? (needs confirmation)
- **Expiration**: Do reservations expire? (needs confirmation)
- **Over-booking**: Can over-book reservations? (needs confirmation)
- **Cancellation Rules**: What happens when order cancelled? (needs confirmation)

### Production Scheduling
- **Scheduling Algorithm**: How are production orders scheduled? (needs confirmation)
- **Capacity Planning**: How is production capacity calculated? (needs confirmation)
- **Priority Rules**: How to prioritize orders? (needs confirmation)
- **Resource Allocation**: How to allocate resources? (needs confirmation)

## Data Validation Rules

### PO Number Validation
- **Format**: Specific format enforced (see po-no.validation.ts)
- **Uniqueness**: Must be unique per receiving transaction
- **Special Characters**: Certain special characters allowed

### Quantity Validation
- **Positive Numbers**: All quantities must be positive
- **Decimal Precision**: Configurable decimal precision
- **Unit Consistency**: Quantities must match UOM

### Date Validation
- **Future Dates**: Certain dates must be in future
- **Date Ranges**: End date must be after start date
- **Business Days**: Consider business days if applicable

### Status Validation
- **Valid Transitions**: Status must follow valid transitions
- **Permission-Based**: Status changes require appropriate permissions
- **History Recording**: All status changes recorded

## Cross-Module Rules

### Department Scoping
- **Data Isolation**: Users see data only from their departments
- **Multi-Department**: Users with multiple departments see aggregated data
- **Admin Override**: Admin users may have cross-department access

### Reference Integrity
- **Foreign Keys**: All foreign keys must be valid
- **Cascade Rules**: Define cascade delete/update rules
- **Soft Delete**: Consider soft delete for certain entities

### Audit Trail
- **Change Tracking**: Track who changed what and when
- **Reason Recording**: Record reason for changes
- **History Tables**: Use history tables for important entities
