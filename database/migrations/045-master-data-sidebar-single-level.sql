-- Master Data sidebar: 1 level — กดแล้วไป /master-data (เมนูย่อยใช้จากหน้า hub แทน)

UPDATE auth.menus
SET
  path = '/master-data',
  updated_at = now()
WHERE code = 'master_data_root';

UPDATE auth.menus
SET
  is_active = FALSE,
  updated_at = now()
WHERE parent_id = (SELECT id FROM auth.menus WHERE code = 'master_data_root');
