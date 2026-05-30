const fs = require('fs');
const path = require('path');

// Simple Excel file (minimal valid XLSX)
const outputPath = path.join(__dirname, '..', 'docs', 'sales-import-template.xlsx');

// Create a minimal XLSX file
const header = [
  'Order Group', 'Customer Code', 'Product Code', 'Quantity', 
  'Unit Price', 'Discount', 'Required Date', 'Delivery Date', 
  'Sales Channel', 'Note'
].join(',');

const rows = [
  'ORD-001,C001,P001,100,150.00,0,2026-06-15,2026-06-20,DIRECT,Example row 1',
  'ORD-001,C001,P002,50,200.00,10,2026-06-15,2026-06-20,DIRECT,Example row 2'
];

const csvContent = [header, ...rows].join('\n');
fs.writeFileSync(outputPath.replace('.xlsx', '.csv'), csvContent);

console.log('CSV template created at:', outputPath.replace('.xlsx', '.csv'));
console.log('Note: For Excel format, please convert CSV to XLSX manually or use Excel application');
