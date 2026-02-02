import { Controller, Get, Query } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ResponseHelper } from '../common/helpers/response.helper';

@Controller('sync')
export class SyncController {
  constructor(private dataSource: DataSource) {}

  @Get('data')
  async getSyncData(
    @Query('lastSync') lastSync?: string,
    @Query('tables') tables?: string
  ) {
    const syncDate = lastSync ? new Date(lastSync) : new Date('2000-01-01');
    const tablesToSync = tables ? tables.split(',') : ['materials', 'receivings', 'issuings'];

    const syncData: any = {};

    if (tablesToSync.includes('materials')) {
      syncData.materials = await this.dataSource.query(`
        SELECT m.*, i.name as material_name, s.total_qty, s.available_qty
        FROM materials m
        LEFT JOIN items_name i ON m.id = i.material_id
        LEFT JOIN materials_stock s ON m.id = s.material_id
        WHERE m.update_date > $1 OR m.create_date > $1
      `, [syncDate]);
    }

    if (tablesToSync.includes('receivings')) {
      syncData.receivings = await this.dataSource.query(`
        SELECT mr.* FROM material_receiving mr WHERE mr.create_date > $1
      `, [syncDate]);
    }

    if (tablesToSync.includes('issuings')) {
      syncData.issuings = await this.dataSource.query(`
        SELECT mi.* FROM material_issuing mi WHERE mi.create_date > $1
      `, [syncDate]);
    }

    return ResponseHelper.success({
      syncDate: new Date().toISOString(),
      data: syncData
    }, 'Sync data retrieved successfully');
  }
}
