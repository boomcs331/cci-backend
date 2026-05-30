const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'cps_cci',
});

client.connect()
  .then(() => {
    return client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'sales_planning' ORDER BY table_name");
  })
  .then(result => {
    const output = `Sales Planning Tables:\n${result.rows.map(r => `  - ${r.table_name}`).join('\n')}\n\nTotal: ${result.rows.length}`;
    fs.writeFileSync('tables-check.txt', output);
    console.log(output);
    return client.end();
  })
  .then(() => process.exit(0))
  .catch(err => {
    fs.writeFileSync('tables-error.txt', err.message);
    console.error('Error:', err.message);
    client.end().then(() => process.exit(1));
  });
