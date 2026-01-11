import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';

function loadEnvFile() {
  try {
    const envPath = join(__dirname, '../.env');
    const envContent = readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
  } catch (error) {
    console.log('⚠️  Could not load .env file');
  }
}

async function insertMockupData() {
  loadEnvFile();
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'cps_cci',
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('🔌 Connected to database');

    // Insert Materials Types
    console.log('📦 Inserting materials types...');
    await dataSource.query(`
      INSERT INTO materials_type (code, name, create_date, create_by) VALUES
      ('RAW', 'Raw Materials', NOW(), 'system'),
      ('FIN', 'Finished Goods', NOW(), 'system'),
      ('WIP', 'Work in Progress', NOW(), 'system'),
      ('PKG', 'Packaging', NOW(), 'system'),
      ('TOOL', 'Tools & Equipment', NOW(), 'system')
      ON CONFLICT (code) DO NOTHING
    `);

    // Insert Materials Locations
    console.log('📍 Inserting materials locations...');
    await dataSource.query(`
      INSERT INTO materials_location (code, name, description, create_date, create_by) VALUES
      ('WH01', 'Warehouse 1', 'Main warehouse for raw materials', NOW(), 'system'),
      ('WH02', 'Warehouse 2', 'Finished goods storage', NOW(), 'system'),
      ('PROD', 'Production Floor', 'Production area storage', NOW(), 'system'),
      ('QC', 'Quality Control', 'QC inspection area', NOW(), 'system'),
      ('SHIP', 'Shipping Area', 'Ready for shipment', NOW(), 'system')
      ON CONFLICT (code) DO NOTHING
    `);

    // Insert Materials
    console.log('🔧 Inserting materials...');
    await dataSource.query(`
      INSERT INTO materials (mat_code, mat_type_id, default_location_id, lr, lot_size, unit, is_active, create_date, create_by) VALUES
      ('MAT001', 1, 1, 'L', 100, 'KG', true, NOW(), 'system'),
      ('MAT002', 1, 1, 'R', 50, 'PCS', true, NOW(), 'system'),
      ('MAT003', 2, 2, 'L', 25, 'BOX', true, NOW(), 'system'),
      ('MAT004', 3, 3, 'R', 10, 'SET', true, NOW(), 'system'),
      ('MAT005', 4, 1, 'L', 200, 'PCS', true, NOW(), 'system'),
      ('MAT006', 5, 4, 'R', 1, 'UNIT', true, NOW(), 'system'),
      ('MAT007', 1, 1, 'L', 75, 'LTR', true, NOW(), 'system'),
      ('MAT008', 2, 2, 'R', 30, 'PACK', true, NOW(), 'system')
      ON CONFLICT (mat_code) DO NOTHING
    `);

    // Insert Items Names
    console.log('📝 Inserting items names...');
    await dataSource.query(`
      INSERT INTO items_name (material_id, name, description, active, create_date, create_by) VALUES
      (1, 'Steel Rod 10mm', 'High grade steel rod for construction', true, NOW(), 'system'),
      (2, 'Bolt M8x20', 'Standard bolt with nut', true, NOW(), 'system'),
      (3, 'Product Box A', 'Standard packaging box type A', true, NOW(), 'system'),
      (4, 'Assembly Kit B', 'Complete assembly kit for product B', true, NOW(), 'system'),
      (5, 'Label Sticker', 'Product identification label', true, NOW(), 'system'),
      (6, 'Cutting Tool CT-100', 'Precision cutting tool', true, NOW(), 'system'),
      (7, 'Industrial Paint', 'High quality industrial paint', true, NOW(), 'system'),
      (8, 'Shipping Package', 'Standard shipping package', true, NOW(), 'system')
    `);

    // Insert Materials Stock
    console.log('📊 Inserting materials stock...');
    await dataSource.query(`
      INSERT INTO materials_stock (material_id, total_qty, available_qty, reserved_qty, update_date) VALUES
      (1, 500, 450, 50, NOW()),
      (2, 1000, 800, 200, NOW()),
      (3, 200, 180, 20, NOW()),
      (4, 50, 45, 5, NOW()),
      (5, 2000, 1800, 200, NOW()),
      (6, 10, 8, 2, NOW()),
      (7, 300, 280, 20, NOW()),
      (8, 150, 140, 10, NOW())
      ON CONFLICT (material_id) DO UPDATE SET
        total_qty = EXCLUDED.total_qty,
        available_qty = EXCLUDED.available_qty,
        reserved_qty = EXCLUDED.reserved_qty,
        update_date = NOW()
    `);

    console.log('✅ Mockup data inserted successfully!');
    
    // Show summary
    const counts = await dataSource.query(`
      SELECT 
        (SELECT COUNT(*) FROM materials_type) as types_count,
        (SELECT COUNT(*) FROM materials_location) as locations_count,
        (SELECT COUNT(*) FROM materials) as materials_count,
        (SELECT COUNT(*) FROM items_name) as items_count,
        (SELECT COUNT(*) FROM materials_stock) as stock_count
    `);
    
    console.log('📈 Data Summary:');
    console.log(`   Materials Types: ${counts[0].types_count}`);
    console.log(`   Materials Locations: ${counts[0].locations_count}`);
    console.log(`   Materials: ${counts[0].materials_count}`);
    console.log(`   Items Names: ${counts[0].items_count}`);
    console.log(`   Stock Records: ${counts[0].stock_count}`);

  } catch (error) {
    console.error('❌ Error inserting mockup data:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

insertMockupData().catch(console.error);