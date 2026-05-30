const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'cps_cci',
});

client.connect()
  .then(() => {
    console.log('Connected to database');
    return client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'sales_planning' ORDER BY table_name");
  })
  .then(result => {
    console.log('\nSales Planning Tables:');
    console.log('=====================');
    if (result.rows.length === 0) {
      console.log('No tables found');
    } else {
      result.rows.forEach(row => console.log('✓', row.table_name));
    }
    console.log('\nTotal tables:', result.rows.length);
    console.log('\nExpected tables: 4');
    console.log('Status:', result.rows.length === 4 ? '✓ PHASE 1 COMPLETED' : '✗ INCOMPLETE');
    return client.end();
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err.message);
    client.end().then(() => process.exit(1));
  });
