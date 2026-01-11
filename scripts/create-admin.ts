import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';

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

async function createAdminUser() {
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
    
    // Check if admin user already exists
    const existingAdmin = await dataSource.query(`
      SELECT id FROM users WHERE username = 'admin'
    `);

    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists');
      return;
    }

    // Hash password
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    await dataSource.query(`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        first_name, 
        last_name, 
        is_active, 
        created_at, 
        updated_at
      ) VALUES (
        'admin', 
        'admin@cci.co.th', 
        $1, 
        'Admin', 
        'User', 
        true, 
        NOW(), 
        NOW()
      )
    `, [passwordHash]);

    console.log('✅ Admin user created successfully!');
    console.log('📋 Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@cci.co.th');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

createAdminUser().catch(console.error);