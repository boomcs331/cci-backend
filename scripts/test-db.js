const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'cps_cci',
});

console.log('Testing database connection...');

client.connect()
  .then(() => {
    console.log('✓ Connected to database successfully');
    return client.query('SELECT NOW()');
  })
  .then(result => {
    console.log('✓ Query successful, server time:', result.rows[0].now);
    return client.end();
  })
  .then(() => {
    console.log('✓ Connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('✗ Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  });
