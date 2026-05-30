const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'cps_cci',
});

const outputFile = path.join(__dirname, 'db-check-result.txt');

client.connect()
  .then(() => {
    console.log('Connected, checking tables...');
    return client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'sales_planning' ORDER BY table_name");
  })
  .then(result => {
    const lines = [
      'SALES PLANNING TABLES CHECK',
      '===========================',
      '',
      `Total tables found: ${result.rows.length}`,
      ''
    ];
    
    if (result.rows.length === 0) {
      lines.push('No tables found in sales_planning schema');
    } else {
      lines.push('Tables:');
      result.rows.forEach(row => {
        lines.push(`  - ${row.table_name}`);
      });
    }
    
    lines.push('');
    lines.push('Expected: 4 tables (planning_batches, planning_rows, planning_errors, planning_history)');
    lines.push('');
    
    if (result.rows.length === 4) {
      lines.push('STATUS: ✓ PHASE 1 COMPLETED');
    } else {
      lines.push('STATUS: ✗ PHASE 1 INCOMPLETE');
    }
    
    const output = lines.join('\n');
    fs.writeFileSync(outputFile, output);
    console.log(output);
    console.log(`\nResult saved to: ${outputFile}`);
    
    return client.end();
  })
  .then(() => process.exit(0))
  .catch(err => {
    const errorOutput = `Error: ${err.message}\n${err.stack}`;
    fs.writeFileSync(outputFile, errorOutput);
    console.error(errorOutput);
    client.end().then(() => process.exit(1));
  });
