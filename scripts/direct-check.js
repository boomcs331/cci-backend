const { execSync } = require('child_process');

try {
  console.log('Running migration via psql...');
  const result = execSync(
    'psql -h localhost -U postgres -d cps_cci -f database/migrations/080-sales-planning-tables.sql',
    { 
      encoding: 'utf8',
      stdio: 'inherit',
      env: { ...process.env, PGPASSWORD: 'postgres' }
    }
  );
  console.log('Migration completed');
  console.log(result);
} catch (error) {
  console.error('Error running migration:', error.message);
  process.exit(1);
}
