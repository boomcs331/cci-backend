import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { SalesOrdersService } from '../services/sales-orders.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  QueryOrdersDto,
  RejectOrderDto,
  TransitionOrderStatusDto,
  CancelOrderDto,
} from '../dto';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { AuthUserService } from '../../auth/services/auth-user.service';

@Controller('sales/orders')
export class SalesOrdersController {
  constructor(
    private readonly service: SalesOrdersService,
    private readonly authUserService: AuthUserService,
  ) {}

  @Get('pending-approval')
  @RequirePermissions('sales_order.approve')
  findPending(@Query() query: QueryOrdersDto) {
    return this.service.findPendingApprovals(query);
  }

  @Get()
  @RequirePermissions('sales_order.read')
  findAll(@Query() query: QueryOrdersDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('sales_order.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @RequirePermissions('sales_order.create')
  async create(@Body() dto: CreateOrderDto, @Request() req) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.create(dto, username);
  }

  @Patch(':id')
  @RequirePermissions('sales_order.update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Request() req,
  ) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.update(id, dto, username);
  }

  @Post(':id/submit')
  @RequirePermissions('sales_order.create')
  async submit(@Param('id') id: string, @Request() req) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.submit(id, username);
  }

  @Post(':id/approve')
  @RequirePermissions('sales_order.approve')
  async approve(@Param('id') id: string, @Request() req) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    const approverId = this.resolveUserId(req);
    return this.service.approve(id, username, approverId);
  }

  @Post(':id/reject')
  @RequirePermissions('sales_order.approve')
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectOrderDto,
    @Request() req,
  ) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    const approverId = this.resolveUserId(req);
    return this.service.reject(id, dto, username, approverId);
  }

  @Post(':id/cancel')
  @RequirePermissions('sales_order.update')
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @Request() req,
  ) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.cancel(id, dto, username);
  }

  @Post(':id/status')
  @RequirePermissions('sales_order.update')
  async advanceStatus(
    @Param('id') id: string,
    @Body() dto: TransitionOrderStatusDto,
    @Request() req,
  ) {
    const username = await this.authUserService.resolveUsernameFromRequest(req);
    return this.service.advanceStatus(id, dto, username);
  }

  @Delete(':id')
  @RequirePermissions('sales_order.delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get('export')
  @RequirePermissions('sales_order.export')
  async export(@Query() query: QueryOrdersDto, @Res() res: Response) {
    const buffer = await this.service.exportToExcel(query);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales-orders-export.xlsx',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  }

  @Get('export/pdf')
  @RequirePermissions('sales_order.export')
  async exportPDF(@Query() query: QueryOrdersDto, @Res() res: Response) {
    const buffer = await this.service.exportToPDF(query);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=sales-orders-export.pdf',
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.send(buffer);
  }

  private resolveUserId(req: {
    user?: { id?: string | number };
    headers?: Record<string, string | string[] | undefined>;
  }): string {
    if (req.user?.id != null) return String(req.user.id);
    const raw = req.headers?.['x-user-id'];
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (!id?.trim()) return 'unknown';
    return id.trim();
  }
}
