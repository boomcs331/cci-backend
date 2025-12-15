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

async function setupLoggingDatabase() {
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

  console.log('Database configuration:');
  console.log(`- Host: ${dbConfig.host}`);
  console.log(`- Port: ${dbConfig.port}`);
  console.log(`- Username: ${dbConfig.username}`);
  console.log(`- Database: ${dbConfig.database}`);
  console.log(`- Password: ${dbConfig.password ? '***' : 'not set'}`);

  const dataSource = new DataSource({
    type: 'postgres',
    ...dbConfig,
    synchronize: false,
    logging: true,
  });

  try {
    console.log('\nConnecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database successfully');

    // Read and execute migration SQL
    const migrationPath = join(__dirname, '../src/database/migrations/create-logging-tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('Executing logging tables migration...');
    await dataSource.query(migrationSQL);
    console.log('Logging tables created successfully');

    // Verify tables exist
    const apiLogsExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_logs'
      );
    `);

    const authLogsExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'auth_logs'
      );
    `);

    console.log('Verification:');
    console.log(`- api_logs table exists: ${apiLogsExists[0].exists}`);
    console.log(`- auth_logs table exists: ${authLogsExists[0].exists}`);

    // Show table info
    const apiLogsInfo = await dataSource.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'api_logs' 
      ORDER BY ordinal_position;
    `);

    const authLogsInfo = await dataSource.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'auth_logs' 
      ORDER BY ordinal_position;
    `);

    console.log('\nAPI Logs table structure:');
    apiLogsInfo.forEach((col: any) => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log('\nAuth Logs table structure:');
    authLogsInfo.forEach((col: any) => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Show indexes
    const indexes = await dataSource.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('api_logs', 'auth_logs')
      ORDER BY tablename, indexname;
    `);

    console.log('\nCreated indexes:');
    indexes.forEach((idx: any) => {
      console.log(`  ${idx.tablename}.${idx.indexname}`);
    });

    console.log('\nLogging database setup completed successfully!');

  } catch (error) {
    console.error('\n❌ Error setting up logging database:');
    
    if (error.code === '28P01') {
      console.error('🔐 Authentication failed - Please check your database credentials:');
      console.error(`   - Username: ${dbConfig.username}`);
      console.error(`   - Password: ${dbConfig.password ? 'Set (hidden)' : 'NOT SET'}`);
      console.error(`   - Database: ${dbConfig.database}`);
      console.error('\n💡 Solutions:');
      console.error('   1. Check your .env file has correct DB_USER and DB_PASS');
      console.error('   2. Verify PostgreSQL user exists and has correct password');
      console.error('   3. Create user if needed: CREATE USER your_user WITH PASSWORD \'your_password\';');
      console.error('   4. Grant permissions: GRANT ALL PRIVILEGES ON DATABASE your_db TO your_user;');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused - PostgreSQL server is not running or not accessible:');
      console.error(`   - Host: ${dbConfig.host}`);
      console.error(`   - Port: ${dbConfig.port}`);
      console.error('\n💡 Solutions:');
      console.error('   1. Start PostgreSQL service');
      console.error('   2. Check if PostgreSQL is running on the correct port');
      console.error('   3. Verify firewall settings');
    } else if (error.code === '3D000') {
      console.error('🗄️  Database does not exist:');
      console.error(`   - Database: ${dbConfig.database}`);
      console.error('\n💡 Solutions:');
      console.error(`   1. Create database: CREATE DATABASE ${dbConfig.database};`);
      console.error('   2. Check database name in .env file');
    } else {
      console.error('📋 Full error details:', error);
    }
    
    console.error('\n🔧 Quick troubleshooting:');
    console.error('   1. Test connection manually:');
    console.error(`      psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database}`);
    console.error('   2. Check .env file configuration');
    console.error('   3. Verify PostgreSQL service is running');
    
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run the setup
setupLoggingDatabase().catch(console.error);