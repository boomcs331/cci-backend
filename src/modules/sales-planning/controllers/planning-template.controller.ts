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

    // Create template data
    const templateData = [
      {
        Customer: 'Toyota',
        Model: 'Camry',
        'Part No': 'P001',
        'Part Name': 'Brake Pad',
        '1': 100,
        '2': 200,
        '3': 300,
        '4': 0,
        '5': 150,
        '6': 0,
        '7': 0,
        '8': 0,
        '9': 0,
        '10': 0,
        '11': 0,
        '12': 0,
        '13': 0,
        '14': 0,
        '15': 0,
        '16': 0,
        '17': 0,
        '18': 0,
        '19': 0,
        '20': 0,
        '21': 0,
        '22': 0,
        '23': 0,
        '24': 0,
        '25': 0,
        '26': 0,
        '27': 0,
        '28': 0,
        '29': 0,
        '30': 0,
        '31': 0,
        Total: 750,
      },
    ];

    // Create worksheet
    const worksheet = xlsx.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Customer
      { wch: 15 }, // Model
      { wch: 15 }, // Part No
      { wch: 30 }, // Part Name
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
