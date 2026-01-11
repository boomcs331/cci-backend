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

async function checkUsers() {
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
    
    const users = await dataSource.query(`
      SELECT 
        id,
        username,
        email,
        first_name,
        last_name,
        is_active,
        created_at
      FROM users 
      ORDER BY created_at DESC
    `);

    console.log('👥 Users in database:');
    if (users.length === 0) {
      console.log('   No users found');
    } else {
      users.forEach((user: any) => {
        console.log(`   - Username: ${user.username}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Name: ${user.first_name || ''} ${user.last_name || ''}`);
        console.log(`     Active: ${user.is_active ? 'Yes' : 'No'}`);
        console.log(`     Created: ${user.created_at}`);
        console.log('');
      });
    }

    console.log('💡 Default test credentials (if no users exist):');
    console.log('   Username: admin');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

checkUsers().catch(console.error);