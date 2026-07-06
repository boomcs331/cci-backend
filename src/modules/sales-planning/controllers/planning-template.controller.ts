import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import * as xlsx from 'xlsx';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('sales-planning/template')
// @UseGuards(JwtAuthGuard)
export class PlanningTemplateController {
  @Get()
  async downloadTemplate(@Res() res: Response) {
    // Create template workbook
    const workbook = xlsx.utils.book_new();

    // Define headers in the correct order
    const headers = [
      'Customer',
      'Model',
      'Part No',
      'Part Name',
      'Gate',
      'Location',
      'Round',
      'Line',
      ...Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
      'Total'
    ];

    // Create template data as array of arrays
    const templateData = [
      headers,
      [
        'Toyota',
        'Camry',
        'P001',
        'Brake Pad',
        'Gate A',
        'Warehouse 1',
        1,
        1,
        100, 200, 300, 0, 150, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        750
      ]
    ];

    // Create worksheet with aoa_to_sheet to preserve column order
    const worksheet = xlsx.utils.aoa_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Customer
      { wch: 15 }, // Model
      { wch: 15 }, // Part No
      { wch: 30 }, // Part Name
      { wch: 12 }, // Gate
      { wch: 15 }, // Location
      { wch: 8 },  // Round
      { wch: 8 },  // Line
      ...Array(31).fill({ wch: 8 }), // Day 1-31
      { wch: 10 }, // Total
    ];

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Planning Template');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-planning-template.xlsx');
    res.setHeader('Content-Length', buffer.length);

    // Send file
    res.send(buffer);
  }
}
