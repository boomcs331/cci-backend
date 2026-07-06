import * as xlsx from 'xlsx';
import { writeFileSync } from 'fs';
import { join } from 'path';

function generateImportTemplate() {
  const headers = [
    'Order Group',
    'Customer Code',
    'Product Code',
    'Quantity',
    'Unit Price',
    'Discount',
    'Required Date',
    'Delivery Date',
    'Sales Channel',
    'Note'
  ];

  const exampleData = [
    {
      'Order Group': 'ORD-001',
      'Customer Code': 'C001',
      'Product Code': 'P001',
      'Quantity': 100,
      'Unit Price': 150.00,
      'Discount': 0,
      'Required Date': '2026-06-15',
      'Delivery Date': '2026-06-20',
      'Sales Channel': 'DIRECT',
      'Note': 'Example row 1'
    },
    {
      'Order Group': 'ORD-001',
      'Customer Code': 'C001',
      'Product Code': 'P002',
      'Quantity': 50,
      'Unit Price': 200.00,
      'Discount': 10,
      'Required Date': '2026-06-15',
      'Delivery Date': '2026-06-20',
      'Sales Channel': 'DIRECT',
      'Note': 'Example row 2'
    }
  ];

  const worksheet = xlsx.utils.json_to_sheet(exampleData, { header: headers });
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Import Template');

  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const outputPath = join(__dirname, '..', 'docs', 'sales-import-template.xlsx');
  writeFileSync(outputPath, buffer);

  console.log('Template generated at:', outputPath);
}

generateImportTemplate();
