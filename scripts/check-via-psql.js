const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Checking tables via psql...');
  const result = execSync(
    'psql -h localhost -U postgres -d cps_cci -c "SELECT table_name FROM information_schema.tables WHERE table_schema = \'sales_planning\' ORDER BY table_name;"',
    { 
      encoding: 'utf8',
      env: { ...process.env, PGPASSWORD: 'postgres' }
    }
  );
  
  console.log('Result:');
  console.log(result);
  
  const outputFile = path.join(__dirname, 'psql-result.txt');
  fs.writeFileSync(outputFile, result);
  console.log(`\nSaved to: ${outputFile}`);
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
