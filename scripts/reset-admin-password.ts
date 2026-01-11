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

async function resetAdminPassword() {
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
    
    const newPassword = 'admin123';
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await dataSource.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = NOW() 
      WHERE username = 'admin'
    `, [passwordHash]);

    console.log('✅ Admin password reset successfully!');
    console.log('📋 New Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

resetAdminPassword().catch(console.error);