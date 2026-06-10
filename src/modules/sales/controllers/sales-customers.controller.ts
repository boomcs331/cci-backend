import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { SalesCustomersService } from './sales-customers.service';
import type { CreateSalesCustomerDto, UpdateSalesCustomerDto } from './sales-customers.service';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('sales/customers')
export class SalesCustomersController {
  constructor(private readonly service: SalesCustomersService) {}

  @Get()
  @RequirePermissions('customer.read')
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Get(':id')
  @RequirePermissions('customer.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(parseInt(id));
  }

  @Post()
  @RequirePermissions('customer.create')
  create(@Body() dto: CreateSalesCustomerDto, @Request() req: ExpressRequest) {
    const username = (req as any).user?.id || req.headers?.['x-user-id'] || 'unknown';
    return this.service.create(dto, username);
  }

  @Patch(':id')
  @RequirePermissions('customer.update')
  update(@Param('id') id: string, @Body() dto: UpdateSalesCustomerDto, @Request() req: ExpressRequest) {
    const username = (req as any).user?.id || req.headers?.['x-user-id'] || 'unknown';
    return this.service.update(parseInt(id), dto, username);
  }

  @Delete(':id')
  @RequirePermissions('customer.delete')
  remove(@Param('id') id: string) {
    return this.service.remove(parseInt(id));
  }
}
