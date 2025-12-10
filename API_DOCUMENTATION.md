# API Documentation - Authentication & Authorization System

## Overview
ระบบ Authentication และ Authorization ที่สร้างด้วย NestJS และ TypeORM รองรับการจัดการผู้ใช้, บทบาท (Roles), และสิทธิ์ (Permissions) แบบ Role-Based Access Control (RBAC)

## Base URL
```
http://localhost:3000
```

## Authentication Endpoints

### 1. สมัครสมาชิก (Register)
**POST** `/auth/register`

สร้างผู้ใช้ใหม่ในระบบ

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "roleIds": ["1", "2"]  // Optional: array of role IDs
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "1",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "createdAt": "2024-12-10T00:00:00.000Z",
    "updatedAt": "2024-12-10T00:00:00.000Z",
    "roles": [...]
  }
}
```

### 2. เข้าสู่ระบบ (Login)
**POST** `/auth/login`

ตรวจสอบข้อมูลผู้ใช้และส่งคืนข้อมูลผู้ใช้พร้อมสิทธิ์

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "1",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "lastLoginAt": "2024-12-10T00:00:00.000Z",
    "roles": [...]
  },
  "permissions": ["USER_CREATE", "USER_READ", "ROLE_MANAGE"]
}
```

## User Management Endpoints

### 3. ดูข้อมูลผู้ใช้
**GET** `/auth/users/:id`

ดูข้อมูลผู้ใช้ตาม ID

**Parameters:**
- `id` (string): User ID

**Response:**
```json
{
  "id": "1",
  "username": "john_doe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "lastLoginAt": "2024-12-10T00:00:00.000Z",
  "createdAt": "2024-12-10T00:00:00.000Z",
  "updatedAt": "2024-12-10T00:00:00.000Z",
  "roles": [
    {
      "id": "1",
      "code": "ADMIN",
      "name": "Administrator",
      "permissions": [...]
    }
  ]
}
```

### 4. ดูสิทธิ์ของผู้ใช้
**GET** `/auth/users/:id/permissions`

ดูสิทธิ์ทั้งหมดของผู้ใช้

**Parameters:**
- `id` (string): User ID

**Response:**
```json
{
  "permissions": ["USER_CREATE", "USER_READ", "USER_UPDATE", "ROLE_MANAGE"]
}
```

## Role Management Endpoints

### 5. สร้างบทบาท
**POST** `/auth/roles`

สร้างบทบาทใหม่

**Request Body:**
```json
{
  "code": "MANAGER",
  "name": "Manager",
  "description": "Department manager role",
  "isSystem": false,
  "permissionIds": ["1", "2", "3"]  // Optional: array of permission IDs
}
```

**Response:**
```json
{
  "message": "Role created successfully",
  "role": {
    "id": "2",
    "code": "MANAGER",
    "name": "Manager",
    "description": "Department manager role",
    "isSystem": false,
    "createdAt": "2024-12-10T00:00:00.000Z",
    "updatedAt": "2024-12-10T00:00:00.000Z",
    "permissions": [...]
  }
}
```

### 6. ดูบทบาททั้งหมด
**GET** `/auth/roles`

ดูรายการบทบาททั้งหมด

**Response:**
```json
{
  "roles": [
    {
      "id": "1",
      "code": "ADMIN",
      "name": "Administrator",
      "description": "Full system access",
      "isSystem": true,
      "createdAt": "2024-12-10T00:00:00.000Z",
      "updatedAt": "2024-12-10T00:00:00.000Z",
      "permissions": [...]
    }
  ]
}
```

### 7. ดูบทบาทเฉพาะ
**GET** `/auth/roles/:id`

ดูรายละเอียดบทบาทตาม ID

**Parameters:**
- `id` (string): Role ID

**Response:**
```json
{
  "id": "1",
  "code": "ADMIN",
  "name": "Administrator",
  "description": "Full system access",
  "isSystem": true,
  "createdAt": "2024-12-10T00:00:00.000Z",
  "updatedAt": "2024-12-10T00:00:00.000Z",
  "permissions": [...],
  "users": [...]
}
```

## Permission Management Endpoints

### 8. สร้างสิทธิ์
**POST** `/auth/permissions`

สร้างสิทธิ์ใหม่

**Request Body:**
```json
{
  "code": "USER_DELETE",
  "name": "Delete User",
  "description": "Can delete users from system",
  "module": "user-management"
}
```

**Response:**
```json
{
  "message": "Permission created successfully",
  "permission": {
    "id": "4",
    "code": "USER_DELETE",
    "name": "Delete User",
    "description": "Can delete users from system",
    "module": "user-management",
    "createdAt": "2024-12-10T00:00:00.000Z",
    "updatedAt": "2024-12-10T00:00:00.000Z"
  }
}
```

### 9. ดูสิทธิ์ทั้งหมด
**GET** `/auth/permissions`

ดูรายการสิทธิ์ทั้งหมด

**Response:**
```json
{
  "permissions": [
    {
      "id": "1",
      "code": "USER_CREATE",
      "name": "Create User",
      "description": "Can create new users",
      "module": "user-management",
      "createdAt": "2024-12-10T00:00:00.000Z",
      "updatedAt": "2024-12-10T00:00:00.000Z"
    }
  ]
}
```

### 10. ดูสิทธิ์เฉพาะ
**GET** `/auth/permissions/:id`

ดูรายละเอียดสิทธิ์ตาม ID

**Parameters:**
- `id` (string): Permission ID

**Response:**
```json
{
  "id": "1",
  "code": "USER_CREATE",
  "name": "Create User",
  "description": "Can create new users",
  "module": "user-management",
  "createdAt": "2024-12-10T00:00:00.000Z",
  "updatedAt": "2024-12-10T00:00:00.000Z",
  "roles": [...]
}
```

### 11. ดูโปรไฟล์ผู้ใช้ (สำหรับควบคุมสิทธิ์เมนู)
**GET** `/auth/profile/:id`

ดูข้อมูลโปรไฟล์ผู้ใช้พร้อมบทบาทและสิทธิ์ทั้งหมด เหมาะสำหรับการควบคุมการแสดงเมนูในระบบ

**Parameters:**
- `id` (string): User ID

**Response:**
```json
{
  "user": {
    "id": "1",
    "username": "john_doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "lastLoginAt": "2024-12-10T00:00:00.000Z",
    "createdAt": "2024-12-10T00:00:00.000Z",
    "updatedAt": "2024-12-10T00:00:00.000Z"
  },
  "roles": ["ADMIN", "MANAGER"],
  "permissions": [
    "USER_CREATE",
    "USER_READ", 
    "USER_UPDATE",
    "USER_DELETE",
    "ROLE_MANAGE",
    "PERMISSION_MANAGE",
    "SYSTEM_CONFIG"
  ]
}
```

## User CRUD Operations

### 12. ดูรายการผู้ใช้ทั้งหมด
**GET** `/auth/users`

ดูรายการผู้ใช้ทั้งหมดในระบบ

**Response:**
```json
{
  "users": [
    {
      "id": "1",
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "lastLoginAt": "2024-12-10T00:00:00.000Z",
      "createdAt": "2024-12-10T00:00:00.000Z",
      "updatedAt": "2024-12-10T00:00:00.000Z",
      "roles": [...]
    }
  ]
}
```

### 13. แก้ไขข้อมูลผู้ใช้
**PUT** `/auth/users/:id`

แก้ไขข้อมูลผู้ใช้

**Parameters:**
- `id` (string): User ID

**Request Body:**
```json
{
  "username": "john_updated",
  "email": "john.updated@example.com",
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "isActive": true,
  "roleIds": ["1", "2"]
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "1",
    "username": "john_updated",
    "email": "john.updated@example.com",
    "firstName": "John Updated",
    "lastName": "Doe Updated",
    "isActive": true,
    "updatedAt": "2024-12-10T00:00:00.000Z",
    "roles": [...]
  }
}
```

### 14. ลบผู้ใช้
**DELETE** `/auth/users/:id`

ลบผู้ใช้ออกจากระบบ

**Parameters:**
- `id` (string): User ID

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

### 15. เปิด/ปิดสถานะผู้ใช้
**PATCH** `/auth/users/:id/toggle-status`

เปลี่ยนสถานะการใช้งานของผู้ใช้ (เปิด/ปิด)

**Parameters:**
- `id` (string): User ID

**Response:**
```json
{
  "message": "User status updated successfully",
  "user": {
    "id": "1",
    "username": "john_doe",
    "email": "john@example.com",
    "isActive": false,
    "updatedAt": "2024-12-10T00:00:00.000Z"
  }
}
```

## Role CRUD Operations

### 16. แก้ไขข้อมูลบทบาท
**PUT** `/auth/roles/:id`

แก้ไขข้อมูลบทบาท

**Parameters:**
- `id` (string): Role ID

**Request Body:**
```json
{
  "code": "MANAGER_UPDATED",
  "name": "Manager Updated",
  "description": "Updated manager role",
  "isSystem": false,
  "permissionIds": ["1", "2", "3"]
}
```

**Response:**
```json
{
  "message": "Role updated successfully",
  "role": {
    "id": "2",
    "code": "MANAGER_UPDATED",
    "name": "Manager Updated",
    "description": "Updated manager role",
    "isSystem": false,
    "updatedAt": "2024-12-10T00:00:00.000Z",
    "permissions": [...]
  }
}
```

### 17. ลบบทบาท
**DELETE** `/auth/roles/:id`

ลบบทบาทออกจากระบบ (ไม่สามารถลบ system role ได้)

**Parameters:**
- `id` (string): Role ID

**Response:**
```json
{
  "message": "Role deleted successfully"
}
```

### 18. เปิด/ปิดสถานะบทบาท
**PATCH** `/auth/roles/:id/toggle-status`

เปลี่ยนสถานะ isSystem ของบทบาท (ไม่สามารถแก้ไข system role ได้)

**Parameters:**
- `id` (string): Role ID

**Response:**
```json
{
  "message": "Role status updated successfully",
  "role": {
    "id": "2",
    "code": "MANAGER",
    "name": "Manager",
    "isSystem": true,
    "updatedAt": "2024-12-10T00:00:00.000Z"
  }
}
```

### 19. ดูผู้ใช้ในบทบาท
**GET** `/auth/roles/:id/users`

ดูรายการผู้ใช้ที่มีบทบาทนี้

**Parameters:**
- `id` (string): Role ID

**Response:**
```json
{
  "users": [
    {
      "id": "1",
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "createdAt": "2024-12-10T00:00:00.000Z",
      "updatedAt": "2024-12-10T00:00:00.000Z"
    }
  ]
}
```

## Permission CRUD Operations

### 20. แก้ไขข้อมูลสิทธิ์
**PUT** `/auth/permissions/:id`

แก้ไขข้อมูลสิทธิ์

**Parameters:**
- `id` (string): Permission ID

**Request Body:**
```json
{
  "code": "USER_MANAGE_UPDATED",
  "name": "User Management Updated",
  "description": "Updated user management permission",
  "module": "user-management"
}
```

**Response:**
```json
{
  "message": "Permission updated successfully",
  "permission": {
    "id": "1",
    "code": "USER_MANAGE_UPDATED",
    "name": "User Management Updated",
    "description": "Updated user management permission",
    "module": "user-management",
    "updatedAt": "2024-12-10T00:00:00.000Z"
  }
}
```

### 21. ลบสิทธิ์
**DELETE** `/auth/permissions/:id`

ลบสิทธิ์ออกจากระบบ (ไม่สามารถลบสิทธิ์ที่กำลังใช้งานได้)

**Parameters:**
- `id` (string): Permission ID

**Response:**
```json
{
  "message": "Permission deleted successfully"
}
```

### 22. ดูบทบาทที่มีสิทธิ์นี้
**GET** `/auth/permissions/:id/roles`

ดูรายการบทบาทที่มีสิทธิ์นี้

**Parameters:**
- `id` (string): Permission ID

**Response:**
```json
{
  "roles": [
    {
      "id": "1",
      "code": "ADMIN",
      "name": "Administrator",
      "description": "Full system access",
      "isSystem": true,
      "createdAt": "2024-12-10T00:00:00.000Z",
      "updatedAt": "2024-12-10T00:00:00.000Z",
      "users": [...]
    }
  ]
}
```

### 23. ดูสิทธิ์ตาม Module
**GET** `/auth/permissions/modules/:module`

ดูรายการสิทธิ์ในโมดูลเฉพาะ

**Parameters:**
- `module` (string): Module name

**Response:**
```json
{
  "permissions": [
    {
      "id": "1",
      "code": "USER_CREATE",
      "name": "Create User",
      "description": "Can create new users",
      "module": "user-management",
      "createdAt": "2024-12-10T00:00:00.000Z",
      "updatedAt": "2024-12-10T00:00:00.000Z",
      "roles": [...]
    }
  ]
}
```

### 24. ดูรายการ Modules ทั้งหมด
**GET** `/auth/modules`

ดูรายการโมดูลทั้งหมดที่มีในระบบ

**Response:**
```json
{
  "modules": [
    "user-management",
    "role-management",
    "system-config",
    "reporting",
    "dashboard"
  ]
}
```

## Role-Permission Relationship Management

### 25. กำหนดสิทธิ์ให้บทบาท (Replace All)
**PUT** `/auth/roles/:id/permissions`

กำหนดสิทธิ์ทั้งหมดให้กับบทบาท (แทนที่สิทธิ์เดิมทั้งหมด)

**Parameters:**
- `id` (string): Role ID

**Request Body:**
```json
{
  "permissionIds": ["1", "2", "3", "4"]
}
```

**Response:**
```json
{
  "message": "Permissions assigned to role successfully",
  "role": {
    "id": "1",
    "code": "ADMIN",
    "name": "Administrator",
    "permissions": [...]
  }
}
```

### 26. เพิ่มสิทธิ์ให้บทบาท
**POST** `/auth/roles/:roleId/permissions/:permissionId`

เพิ่มสิทธิ์เดี่ยวให้กับบทบาท

**Parameters:**
- `roleId` (string): Role ID
- `permissionId` (string): Permission ID

**Response:**
```json
{
  "message": "Permission added to role successfully",
  "role": {
    "id": "1",
    "code": "ADMIN",
    "name": "Administrator",
    "permissions": [...]
  }
}
```

### 27. ลบสิทธิ์ออกจากบทบาท
**DELETE** `/auth/roles/:roleId/permissions/:permissionId`

ลบสิทธิ์เดี่ยวออกจากบทบาท

**Parameters:**
- `roleId` (string): Role ID
- `permissionId` (string): Permission ID

**Response:**
```json
{
  "message": "Permission removed from role successfully",
  "role": {
    "id": "1",
    "code": "ADMIN",
    "name": "Administrator",
    "permissions": [...]
  }
}
```

## User-Role Relationship Management

### 28. กำหนดบทบาทให้ผู้ใช้ (Replace All)
**PUT** `/auth/users/:id/roles`

กำหนดบทบาททั้งหมดให้กับผู้ใช้ (แทนที่บทบาทเดิมทั้งหมด)

**Parameters:**
- `id` (string): User ID

**Request Body:**
```json
{
  "roleIds": ["1", "2"]
}
```

**Response:**
```json
{
  "message": "Roles assigned to user successfully",
  "user": {
    "id": "1",
    "username": "john_doe",
    "email": "john@example.com",
    "roles": [...]
  }
}
```

### 29. เพิ่มบทบาทให้ผู้ใช้
**POST** `/auth/users/:userId/roles/:roleId`

เพิ่มบทบาทเดี่ยวให้กับผู้ใช้

**Parameters:**
- `userId` (string): User ID
- `roleId` (string): Role ID

**Response:**
```json
{
  "message": "Role added to user successfully",
  "user": {
    "id": "1",
    "username": "john_doe",
    "email": "john@example.com",
    "roles": [...]
  }
}
```

### 30. ลบบทบาทออกจากผู้ใช้
**DELETE** `/auth/users/:userId/roles/:roleId`

ลบบทบาทเดี่ยวออกจากผู้ใช้

**Parameters:**
- `userId` (string): User ID
- `roleId` (string): Role ID

**Response:**
```json
{
  "message": "Role removed from user successfully",
  "user": {
    "id": "1",
    "username": "john_doe",
    "email": "john@example.com",
    "roles": [...]
  }
}
```

## Bulk Query Operations

### 31. ดูผู้ใช้ที่มีบทบาทนี้
**GET** `/auth/roles/:id/users-with-role`

ดูรายการผู้ใช้ทั้งหมดที่มีบทบาทนี้

**Parameters:**
- `id` (string): Role ID

**Response:**
```json
{
  "users": [
    {
      "id": "1",
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true
    }
  ]
}
```

### 32. ดูบทบาทที่มีสิทธิ์นี้
**GET** `/auth/permissions/:id/roles-with-permission`

ดูรายการบทบาททั้งหมดที่มีสิทธิ์นี้

**Parameters:**
- `id` (string): Permission ID

**Response:**
```json
{
  "roles": [
    {
      "id": "1",
      "code": "ADMIN",
      "name": "Administrator",
      "description": "Full system access",
      "isSystem": true
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Username or email already exists",
  "error": "Conflict"
}
```

## Data Models

### User Entity
```typescript
{
  id: string;
  username: string;
  email: string;
  passwordHash: string; // Hidden in responses
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
}
```

### Role Entity
```typescript
{
  id: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  users: User[];
  permissions: Permission[];
}
```

### Permission Entity
```typescript
{
  id: string;
  code: string;
  name: string;
  description?: string;
  module?: string;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
}
```

## Security Features

- **Password Hashing**: ใช้ bcrypt สำหรับเข้ารหัสรหัสผ่าน
- **Input Validation**: ใช้ DTO และ class-validator
- **SQL Injection Protection**: ใช้ TypeORM ORM
- **Password Exclusion**: ไม่ส่ง passwordHash ใน response

## Database Relationships

- **User ↔ Role**: Many-to-Many relationship
- **Role ↔ Permission**: Many-to-Many relationship
- **User → Permission**: ผ่าน Role (indirect relationship)

## Menu Access Control Example

### การใช้งาน Profile API สำหรับควบคุมเมนู

```javascript
// Frontend: ตรวจสอบสิทธิ์การเข้าถึงเมนู
async function checkMenuAccess(userId) {
  const response = await fetch(`/auth/profile/${userId}`);
  const profile = await response.json();
  
  const { permissions } = profile;
  
  // ตรวจสอบสิทธิ์เมนูต่างๆ
  const menuAccess = {
    userManagement: permissions.includes('USER_MANAGE'),
    roleManagement: permissions.includes('ROLE_MANAGE'),
    systemConfig: permissions.includes('SYSTEM_CONFIG'),
    reports: permissions.includes('REPORT_VIEW'),
    dashboard: permissions.includes('DASHBOARD_VIEW')
  };
  
  return menuAccess;
}

// ตัวอย่างการใช้งาน
const menuAccess = await checkMenuAccess('1');
if (menuAccess.userManagement) {
  // แสดงเมนู User Management
}
```

## Usage Examples

### สร้างระบบ Admin พื้นฐาน

1. **สร้าง Permissions:**
```bash
POST /auth/permissions
{
  "code": "SYSTEM_ADMIN",
  "name": "System Administrator",
  "description": "Full system access"
}
```

2. **สร้าง Admin Role:**
```bash
POST /auth/roles
{
  "code": "ADMIN",
  "name": "Administrator",
  "description": "System administrator role",
  "isSystem": true,
  "permissionIds": ["1"]
}
```

3. **สร้าง Admin User:**
```bash
POST /auth/register
{
  "username": "admin",
  "email": "admin@system.com",
  "password": "secureAdminPassword",
  "roleIds": ["1"]
}
```

4. **Login ด้วย Username:**
```bash
POST /auth/login
{
  "username": "admin",
  "password": "secureAdminPassword"
}
```

## Notes

- ทุก endpoint ส่งคืนข้อมูลในรูปแบบ JSON
- รหัสผ่านจะถูกเข้ารหัสด้วย bcrypt ก่อนบันทึกลงฐานข้อมูล
- ระบบรองรับ Role-Based Access Control (RBAC)
- สามารถกำหนด permissions ให้กับ roles และกำหนด roles ให้กับ users
- ผู้ใช้สามารถมีหลาย roles และแต่ละ role สามารถมีหลาย permissions