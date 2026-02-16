# Auth Module

ระบบ Authentication และ Authorization ที่ใช้รูปแบบ RBAC (Role-Based Access Control)

## โครงสร้าง

### Entities
- **User**: ผู้ใช้งานระบบ
- **Role**: บทบาทของผู้ใช้ (เช่น Admin, Staff, Member)
- **Permission**: สิทธิ์การเข้าถึง (เช่น USER_CREATE, USER_VIEW)

### API Endpoints

#### Authentication
- `POST /auth/register` - สมัครสมาชิกใหม่
- `POST /auth/login` - เข้าสู่ระบบ

#### User Management
- `GET /auth/users/:id` - ดูข้อมูลผู้ใช้
- `GET /auth/users/:id/permissions` - ดูสิทธิ์ของผู้ใช้

#### Role Management
- `POST /auth/roles` - สร้างบทบาทใหม่
- `GET /auth/roles` - ดูบทบาททั้งหมด
- `GET /auth/roles/:id` - ดูข้อมูลบทบาท

#### Permission Management
- `POST /auth/permissions` - สร้างสิทธิ์ใหม่
- `GET /auth/permissions` - ดูสิทธิ์ทั้งหมด
- `GET /auth/permissions/:id` - ดูข้อมูลสิทธิ์

## การใช้งาน

### 1. เริ่มต้นข้อมูล
```bash
npm run seed:auth
```

### 2. สมัครสมาชิก
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 3. เข้าสู่ระบบ
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123456"
  }'
```

## Default Users

หลังจากรัน seeder จะมีผู้ใช้เริ่มต้น:

- **Username**: admin
- **Email**: admin@example.com
- **Password**: admin123456
- **Role**: Administrator (สิทธิ์เต็ม)

## Default Roles

1. **ADMIN** - ผู้ดูแลระบบ (สิทธิ์เต็ม)
2. **STAFF** - พนักงาน (สิทธิ์จำกัด)
3. **MEMBER** - สมาชิกทั่วไป (สิทธิ์พื้นฐาน)

## Default Permissions

- USER_CREATE, USER_VIEW, USER_EDIT, USER_DELETE
- ROLE_CREATE, ROLE_VIEW, ROLE_EDIT, ROLE_DELETE
- PERMISSION_CREATE, PERMISSION_VIEW, PERMISSION_EDIT, PERMISSION_DELETE

## Validation

ระบบใช้ class-validator สำหรับตรวจสอบข้อมูลที่ส่งเข้ามา:

### CreateUserDto
- `username`: ความยาว 3-50 ตัวอักษร
- `email`: รูปแบบอีเมลที่ถูกต้อง
- `password`: ความยาวอย่างน้อย 6 ตัวอักษร
- `firstName`, `lastName`: ไม่บังคับ, ความยาวไม่เกิน 100 ตัวอักษร

### LoginDto
- `email`: รูปแบบอีเมลที่ถูกต้อง
- `password`: ความยาวอย่างน้อย 6 ตัวอักษร

### CreateRoleDto
- `code`: ความยาวไม่เกิน 50 ตัวอักษร
- `name`: ความยาวไม่เกิน 100 ตัวอักษร
- `description`: ไม่บังคับ

### CreatePermissionDto
- `code`: ความยาวไม่เกิน 100 ตัวอักษร
- `name`: ความยาวไม่เกิน 150 ตัวอักษร
- `module`: ไม่บังคับ, ความยาวไม่เกิน 100 ตัวอักษร