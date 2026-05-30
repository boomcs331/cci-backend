try {
  const XLSX = require('xlsx');
  const fs = require('fs');
  const path = require('path');

  console.log('Starting template creation...');

  // Create workbook with headers
  const headers = ['Order Group', 'Customer Code', 'Product Code', 'Quantity', 'Unit Price', 'Discount', 'Required Date', 'Delivery Date', 'Sales Channel', 'Note'];
  const data = [
    headers,
    ['ORD-001', 'C001', 'P001', 100, 150.00, 0, '2026-06-15', '2026-06-20', 'DIRECT', 'Example row 1'],
    ['ORD-001', 'C001', 'P002', 50, 200.00, 10, '2026-06-15', '2026-06-20', 'DIRECT', 'Example row 2']
  ];

  console.log('Creating worksheet...');
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Import Template');

  const outputPath = path.join(__dirname, '..', 'docs', 'sales-import-template.xlsx');
  console.log('Writing to:', outputPath);
  
  XLSX.writeFile(wb, outputPath);
  
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    console.log('Excel template created successfully! Size:', stats.size, 'bytes');
  } else {
    console.log('ERROR: File was not created');
  }
} catch (err) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
}
