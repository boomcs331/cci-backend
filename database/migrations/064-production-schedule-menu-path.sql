-- จัดงานล่วงหน้า: ใช้ URL ภายใต้โมดูล Production
UPDATE auth.menus
SET path = '/production/schedule', updated_at = now()
WHERE code = 'production_schedule';
