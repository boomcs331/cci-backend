-- Seed baseline data for department-scoped RBAC
-- Covers example personas:
-- - Staff (read only in own department)
-- - Department admin (CRUD in own department)
-- - Global admin (all departments)

INSERT INTO departments (code, name, description)
VALUES
  ('WE', 'Warehouse Engineering', 'Department WE'),
  ('PD', 'Production', 'Production department')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

INSERT INTO permissions (code, name, description, module)
VALUES
  ('production_plans.read', 'Read production plans', 'Can view production plans data', 'production_plans'),
  ('production_plans.create', 'Create production plan', 'Can create production plans', 'production_plans'),
  ('production_plans.update', 'Update production plan', 'Can update production plans', 'production_plans'),
  ('production_plans.delete', 'Delete production plan', 'Can delete production plans', 'production_plans'),
  ('production_plans.reserve', 'Reserve materials for plan', 'Can reserve materials', 'production_plans'),
  ('production_plans.generate_orders', 'Generate production orders', 'Can generate production orders from plan', 'production_plans'),
  ('production_plans.approve', 'Approve production plan', 'Can approve production plans', 'production_plans'),
  ('production_plans.issue', 'Issue materials from plan', 'Can issue materials for plan', 'production_plans'),
  ('production_plans.cancel', 'Cancel production plan', 'Can cancel production plans', 'production_plans'),
  ('production_plans.manage', 'Manage production plans', 'Can run maintenance/debug actions', 'production_plans'),
  ('production_orders.read', 'Read production orders', 'Can view production orders data', 'production_orders'),
  ('production_orders.create', 'Create production order', 'Can create production orders', 'production_orders'),
  ('production_orders.update', 'Update production order', 'Can update/start/complete production order process', 'production_orders'),
  ('production_orders.manage', 'Manage production orders', 'Can maintain production order master/process setup', 'production_orders')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  module = EXCLUDED.module,
  updated_at = now();

INSERT INTO roles (code, name, description, is_system, scope_type)
VALUES
  ('ADMIN_GLOBAL', 'Global Admin', 'Access all permissions across all departments', true, 'GLOBAL'),
  ('DEPT_ADMIN', 'Department Admin', 'Full permissions inside assigned department', true, 'DEPARTMENT'),
  ('DEPT_STAFF', 'Department Staff', 'Read-only permissions inside assigned department', true, 'DEPARTMENT')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system,
  scope_type = EXCLUDED.scope_type,
  updated_at = now();

-- ADMIN_GLOBAL gets all seeded permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'production_plans.read',
  'production_plans.create',
  'production_plans.update',
  'production_plans.delete',
  'production_plans.reserve',
  'production_plans.generate_orders',
  'production_plans.approve',
  'production_plans.issue',
  'production_plans.cancel',
  'production_plans.manage',
  'production_orders.read',
  'production_orders.create',
  'production_orders.update',
  'production_orders.manage'
)
WHERE r.code = 'ADMIN_GLOBAL'
ON CONFLICT DO NOTHING;

-- DEPT_ADMIN gets CRUD + operation rights in department scope
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'production_plans.read',
  'production_plans.create',
  'production_plans.update',
  'production_plans.delete',
  'production_plans.reserve',
  'production_plans.generate_orders',
  'production_plans.approve',
  'production_plans.issue',
  'production_plans.cancel',
  'production_orders.read',
  'production_orders.create',
  'production_orders.update'
)
WHERE r.code = 'DEPT_ADMIN'
ON CONFLICT DO NOTHING;

-- DEPT_STAFF gets read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'production_plans.read',
  'production_orders.read'
)
WHERE r.code = 'DEPT_STAFF'
ON CONFLICT DO NOTHING;
