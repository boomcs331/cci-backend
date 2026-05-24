-- Dashboard (/) ให้ผู้ใช้ที่ล็อกอินแล้วเห็นเมนูได้ทุกคน (ไม่บังคับสิทธิ์ production)
UPDATE auth.menus
SET
  label = 'Dashboard',
  path = '/',
  permission_codes = NULL,
  permission_match = 'all',
  admin_only = FALSE,
  is_active = TRUE,
  sort_order = 10,
  updated_at = now()
WHERE code = 'dashboard';
