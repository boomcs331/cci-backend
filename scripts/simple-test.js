console.log('Test script started');
const fs = require('fs');
fs.writeFileSync('test-output.txt', 'Test script ran at ' + new Date().toISOString());
console.log('Test script completed');
