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

console.log('Starting migration...');

client.connect()
  .then(() => {
    console.log('Connected to database');
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', '080-sales-planning-tables.sql');
    console.log('Reading SQL from:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('SQL file read, size:', sql.length, 'bytes');

    return client.query(sql);
  })
  .then(() => {
    console.log('Migration completed successfully!');
    return client.end();
  })
  .then(() => {
    console.log('Connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    console.error('Full error:', err);
    client.end().then(() => process.exit(1));
  });
