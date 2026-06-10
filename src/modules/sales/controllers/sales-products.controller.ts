import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { SalesProductsService } from '../services/sales-products.service';
import type { CreateSalesProductDto, UpdateSalesProductDto } from '../services/sales-products.service';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';

@Controller('sales/products')
export class SalesProductsController {
  constructor(private readonly service: SalesProductsService) {}

  @Get()
  @RequirePermissions('product.read')
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Get(':id')
  @RequirePermissions('product.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(parseInt(id));
  }

  @Post()
  @RequirePermissions('product.create')
  create(@Body() dto: CreateSalesProductDto, @Request() req) {
    const username = req.user?.id || req.headers?.['x-user-id'] || 'unknown';
    return this.service.create(dto, username);
  }

  @Patch(':id')
  @RequirePermissions('product.update')
  update(@Param('id') id: string, @Body() dto: UpdateSalesProductDto, @Request() req) {
    const username = req.user?.id || req.headers?.['x-user-id'] || 'unknown';
    return this.service.update(parseInt(id), dto, username);
  }

  @Delete(':id')
  @RequirePermissions('product.delete')
  remove(@Param('id') id: string) {
    return this.service.remove(parseInt(id));
  }
}
