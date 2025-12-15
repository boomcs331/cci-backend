import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env file manually
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
    console.log('⚠️  Could not load .env file, using environment variables');
  }
}

async function testDatabaseConnection() {
  // Load environment variables from .env file
  loadEnvFile();
  // Support both naming conventions
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'password',
    database: process.env.DB_DATABASE || process.env.DB_NAME || 'cci_db',
  };

  console.log('📁 Environment variables loaded:');
  console.log(`   DB_HOST: ${process.env.DB_HOST || 'not set'}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT || 'not set'}`);
  console.log(`   DB_USER: ${process.env.DB_USER || 'not set'}`);
  console.log(`   DB_PASS: ${process.env.DB_PASS ? 'set' : 'not set'}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME || 'not set'}`);

  console.log('🔍 Testing database connection...');
  console.log('📋 Configuration:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Username: ${dbConfig.username}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   Password: ${dbConfig.password ? '✅ Set' : '❌ Not set'}`);

  const dataSource = new DataSource({
    type: 'postgres',
    ...dbConfig,
    synchronize: false,
    logging: false,
  });

  try {
    console.log('\n🔌 Attempting to connect...');
    await dataSource.initialize();
    console.log('✅ Database connection successful!');

    // Test basic query
    console.log('\n🧪 Testing basic query...');
    const result = await dataSource.query('SELECT version() as version, current_database() as database, current_user as user');
    console.log('✅ Query successful!');
    console.log('📊 Database info:');
    console.log(`   PostgreSQL Version: ${result[0].version.split(' ')[1]}`);
    console.log(`   Current Database: ${result[0].database}`);
    console.log(`   Current User: ${result[0].user}`);

    // Check if logging tables exist
    console.log('\n🔍 Checking for existing logging tables...');
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('api_logs', 'auth_logs')
      ORDER BY table_name
    `);

    if (tables.length > 0) {
      console.log('✅ Found existing logging tables:');
      tables.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('ℹ️  No logging tables found (this is normal for first setup)');
    }

    // Check permissions
    console.log('\n🔐 Checking user permissions...');
    const permissions = await dataSource.query(`
      SELECT 
        has_database_privilege(current_user, current_database(), 'CREATE') as can_create,
        has_database_privilege(current_user, current_database(), 'CONNECT') as can_connect,
        has_schema_privilege(current_user, 'public', 'CREATE') as can_create_tables
    `);

    const perms = permissions[0];
    console.log(`   Create Database: ${perms.can_create ? '✅' : '❌'}`);
    console.log(`   Connect: ${perms.can_connect ? '✅' : '❌'}`);
    console.log(`   Create Tables: ${perms.can_create_tables ? '✅' : '❌'}`);

    if (!perms.can_create_tables) {
      console.log('\n⚠️  Warning: User cannot create tables. You may need to grant permissions:');
      console.log(`   GRANT ALL PRIVILEGES ON SCHEMA public TO ${dbConfig.username};`);
    }

    console.log('\n🎉 Database connection test completed successfully!');
    console.log('💡 You can now run: npm run setup:logging');

  } catch (error: any) {
    console.error('\n❌ Database connection failed!');
    
    if (error.code === '28P01') {
      console.error('🔐 Authentication Error:');
      console.error('   The username or password is incorrect.');
      console.error('\n💡 Solutions:');
      console.error('   1. Check your .env file credentials');
      console.error('   2. Verify the user exists in PostgreSQL:');
      console.error(`      psql -U postgres -c "SELECT usename FROM pg_user WHERE usename = '${dbConfig.username}'"`);
      console.error('   3. Create user if needed:');
      console.error(`      psql -U postgres -c "CREATE USER ${dbConfig.username} WITH PASSWORD '${dbConfig.password}'"`);
      console.error('   4. Grant database access:');
      console.error(`      psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${dbConfig.database} TO ${dbConfig.username}"`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection Error:');
      console.error('   Cannot connect to PostgreSQL server.');
      console.error('\n💡 Solutions:');
      console.error('   1. Start PostgreSQL service:');
      console.error('      - Windows: net start postgresql-x64-14');
      console.error('      - macOS: brew services start postgresql');
      console.error('      - Linux: sudo systemctl start postgresql');
      console.error('   2. Check if PostgreSQL is running:');
      console.error('      ps aux | grep postgres');
      console.error('   3. Verify connection details in .env file');
    } else if (error.code === '3D000') {
      console.error('🗄️  Database Error:');
      console.error(`   Database "${dbConfig.database}" does not exist.`);
      console.error('\n💡 Solutions:');
      console.error('   1. Create the database:');
      console.error(`      psql -U postgres -c "CREATE DATABASE ${dbConfig.database}"`);
      console.error('   2. Check database name in .env file');
    } else {
      console.error('📋 Unexpected Error:');
      console.error(`   Code: ${error.code || 'Unknown'}`);
      console.error(`   Message: ${error.message}`);
    }

    console.error('\n🔧 Manual connection test:');
    console.error(`   psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database}`);
    
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run the test
testDatabaseConnection().catch(console.error);