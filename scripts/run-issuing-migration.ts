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

async function setupIssuingTypes() {
  loadEnvFile();
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'postgres',
    database: process.env.DB_NAME || 'cps_cci',
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = dataSource.createQueryRunner();

    console.log('\n🔄 Step 1: Adding columns...');
    await queryRunner.query(`
      ALTER TABLE material_issuing 
      ADD COLUMN IF NOT EXISTS issuing_type VARCHAR(50) DEFAULT 'NORMAL_PRODUCTION',
      ADD COLUMN IF NOT EXISTS machine_no VARCHAR(50),
      ADD COLUMN IF NOT EXISTS part_no VARCHAR(50),
      ADD COLUMN IF NOT EXISTS requester VARCHAR(100);
    `);
    console.log('✅ Columns added');

    console.log('\n🔄 Step 2: Adding comment...');
    await queryRunner.query(`
      COMMENT ON COLUMN material_issuing.issuing_type IS 'Type of issuing: NORMAL_PRODUCTION, STOCK_DEDUCTION, SPARE_PARTS_REPLACEMENT';
    `);
    console.log('✅ Comment added');

    console.log('\n🔄 Step 3: Creating indexes...');
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_material_issuing_type ON material_issuing(issuing_type);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_material_issuing_machine_no ON material_issuing(machine_no);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_material_issuing_part_no ON material_issuing(part_no);`);
    console.log('✅ Indexes created');

    console.log('\n🔄 Step 4: Updating existing records...');
    await queryRunner.query(`
      UPDATE material_issuing 
      SET issuing_type = 'NORMAL_PRODUCTION' 
      WHERE issuing_type IS NULL;
    `);
    console.log('✅ Existing records updated');

    console.log('\n🔄 Step 5: Inserting mockup data...');
    
    console.log('  📦 Inserting NORMAL_PRODUCTION data...');
    await queryRunner.query(`
      INSERT INTO material_issuing (issuing_no, issuing_date, issuing_type, material_id, total_quantity, unit, department, work_order_no, remark, status, create_date, create_by)
      VALUES
      ('ISS-PRD-2026-0001', '2026-01-15 08:30:00', 'NORMAL_PRODUCTION', 1, 500, 'KG', 'Production Line 1', 'WO-2026-001', 'ผลิตสินค้า Batch A', 'COMPLETED', NOW(), 'prod_user1'),
      ('ISS-PRD-2026-0002', '2026-01-16 09:15:00', 'NORMAL_PRODUCTION', 2, 300, 'PCS', 'Production Line 2', 'WO-2026-002', 'ผลิตสินค้า Batch B', 'COMPLETED', NOW(), 'prod_user2'),
      ('ISS-PRD-2026-0003', '2026-01-17 10:00:00', 'NORMAL_PRODUCTION', 3, 1000, 'M', 'Production Line 1', 'WO-2026-003', 'ผลิตสินค้า SKU-ABC-001', 'COMPLETED', NOW(), 'prod_user1'),
      ('ISS-PRD-2026-0004', '2026-01-18 11:30:00', 'NORMAL_PRODUCTION', 1, 750, 'KG', 'Production Line 3', 'WO-2026-004', 'ผลิตสินค้า Batch C - Rush Order', 'COMPLETED', NOW(), 'prod_user3'),
      ('ISS-PRD-2026-0005', '2026-01-19 14:00:00', 'NORMAL_PRODUCTION', 4, 200, 'L', 'Production Line 2', 'WO-2026-005', 'ผลิตสินค้า Special Order', 'COMPLETED', NOW(), 'prod_user2')
      ON CONFLICT (issuing_no) DO NOTHING;
    `);
    console.log('  ✅ 5 NORMAL_PRODUCTION records inserted');

    console.log('  📦 Inserting STOCK_DEDUCTION data...');
    await queryRunner.query(`
      INSERT INTO material_issuing (issuing_no, issuing_date, issuing_type, material_id, total_quantity, unit, department, remark, status, create_date, create_by)
      VALUES
      ('ISS-STK-2026-0001', '2026-01-15 13:00:00', 'STOCK_DEDUCTION', 5, 50, 'KG', 'Warehouse', 'ตัดสต็อกเนื่องจากวัสดุเสียหายจากการขนส่ง', 'COMPLETED', NOW(), 'warehouse_admin'),
      ('ISS-STK-2026-0002', '2026-01-16 14:30:00', 'STOCK_DEDUCTION', 2, 25, 'PCS', 'Quality Control', 'ตัดสต็อกวัสดุไม่ผ่านมาตรฐาน QC', 'COMPLETED', NOW(), 'qc_user'),
      ('ISS-STK-2026-0003', '2026-01-17 15:00:00', 'STOCK_DEDUCTION', 6, 100, 'M', 'Warehouse', 'ตัดสต็อกวัสดุหมดอายุ - Lot เก่า', 'COMPLETED', NOW(), 'warehouse_admin'),
      ('ISS-STK-2026-0004', '2026-01-18 16:00:00', 'STOCK_DEDUCTION', 3, 30, 'M', 'Warehouse', 'ปรับปรุงสต็อก - นับสต็อกพบส่วนต่าง', 'COMPLETED', NOW(), 'warehouse_supervisor'),
      ('ISS-STK-2026-0005', '2026-01-20 10:00:00', 'STOCK_DEDUCTION', 7, 15, 'KG', 'Warehouse', 'ตัดสต็อกวัสดุเสียหายจากน้ำท่วม', 'COMPLETED', NOW(), 'warehouse_admin')
      ON CONFLICT (issuing_no) DO NOTHING;
    `);
    console.log('  ✅ 5 STOCK_DEDUCTION records inserted');

    console.log('  📦 Inserting SPARE_PARTS_REPLACEMENT data...');
    await queryRunner.query(`
      INSERT INTO material_issuing (issuing_no, issuing_date, issuing_type, material_id, total_quantity, unit, department, machine_no, part_no, requester, remark, status, create_date, create_by)
      VALUES
      ('ISS-SPR-2026-0001', '2026-01-15 07:00:00', 'SPARE_PARTS_REPLACEMENT', 1, 2, 'PCS', 'Maintenance', 'CNC-MACHINE-01', 'BEARING-6205', 'นายสมชาย ช่างเทคนิค', 'เปลี่ยนแบริ่งเครื่อง CNC เนื่องจากชำรุด', 'COMPLETED', NOW(), 'maintenance_user1'),
      ('ISS-SPR-2026-0002', '2026-01-16 08:30:00', 'SPARE_PARTS_REPLACEMENT', 2, 1, 'PCS', 'Maintenance', 'INJECTION-MOLD-05', 'MOTOR-3HP', 'นายวิชัย ช่างไฟฟ้า', 'เปลี่ยนมอเตอร์เครื่อง Injection Mold', 'COMPLETED', NOW(), 'maintenance_user2'),
      ('ISS-SPR-2026-0003', '2026-01-17 09:00:00', 'SPARE_PARTS_REPLACEMENT', 3, 4, 'PCS', 'Maintenance', 'CONVEYOR-BELT-02', 'ROLLER-100MM', 'นายประสิทธิ์ ช่างกล', 'เปลี่ยนลูกกลิ้ง Conveyor Belt', 'COMPLETED', NOW(), 'maintenance_user3'),
      ('ISS-SPR-2026-0004', '2026-01-18 10:30:00', 'SPARE_PARTS_REPLACEMENT', 1, 1, 'SET', 'Maintenance', 'HYDRAULIC-PRESS-03', 'SEAL-KIT-HP300', 'นายสมศักดิ์ ช่างไฮดรอลิก', 'เปลี่ยนชุด Seal เครื่องไฮดรอลิก - ซึม', 'COMPLETED', NOW(), 'maintenance_user1'),
      ('ISS-SPR-2026-0005', '2026-01-19 11:00:00', 'SPARE_PARTS_REPLACEMENT', 2, 3, 'PCS', 'Maintenance', 'COMPRESSOR-AIR-01', 'FILTER-AIR-50', 'นายชัยวัฒน์ ช่างซ่อม', 'เปลี่ยนไส้กรองอากาศคอมเพรสเซอร์', 'COMPLETED', NOW(), 'maintenance_user2'),
      ('ISS-SPR-2026-0006', '2026-01-20 13:00:00', 'SPARE_PARTS_REPLACEMENT', 1, 1, 'PCS', 'Maintenance', 'CNC-MACHINE-03', 'BEARING-6205', 'นายสมชาย ช่างเทคนิค', 'เปลี่ยนแบริ่งเครื่อง CNC-03 ตามแผนบำรุงรักษา', 'COMPLETED', NOW(), 'maintenance_user1'),
      ('ISS-SPR-2026-0007', '2026-01-21 14:30:00', 'SPARE_PARTS_REPLACEMENT', 3, 2, 'PCS', 'Maintenance', 'ROBOT-ARM-02', 'SERVO-MOTOR-2KW', 'นายธนา ช่างหุ่นยนต์', 'เปลี่ยน Servo Motor แขนหุ่นยนต์', 'COMPLETED', NOW(), 'maintenance_user3'),
      ('ISS-SPR-2026-0008', '2026-01-22 08:00:00', 'SPARE_PARTS_REPLACEMENT', 2, 5, 'M', 'Maintenance', 'CONVEYOR-BELT-01', 'BELT-RUBBER-500MM', 'นายประสิทธิ์ ช่างกล', 'เปลี่ยนสายพาน Conveyor - ขาด', 'COMPLETED', NOW(), 'maintenance_user3')
      ON CONFLICT (issuing_no) DO NOTHING;
    `);
    console.log('  ✅ 8 SPARE_PARTS_REPLACEMENT records inserted');

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n✅ Setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - NORMAL_PRODUCTION: 5 records');
    console.log('  - STOCK_DEDUCTION: 5 records');
    console.log('  - SPARE_PARTS_REPLACEMENT: 8 records');
    console.log('  - Total: 18 records');
    console.log('\n🚀 You can now restart your application!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupIssuingTypes();
