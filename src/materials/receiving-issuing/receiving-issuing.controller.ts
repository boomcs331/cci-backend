import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ReceivingIssuingService } from './receiving-issuing.service';
import { CreateReceivingDto, CreateIssuingDto } from './dto';
import { ResponseHelper } from '../../common/helpers/response.helper';

@Controller('materials/transactions')
export class ReceivingIssuingController {
  constructor(private readonly service: ReceivingIssuingService) {}

  @Post('receive')
  async createReceiving(@Body() dto: CreateReceivingDto) {
    const receiving = await this.service.createReceiving(dto);
    return ResponseHelper.success(receiving, 'Material received successfully');
  }

  @Post('issue')
  async createIssuing(@Body() dto: CreateIssuingDto) {
    const issuing = await this.service.createIssuing(dto);
    return ResponseHelper.success(issuing, 'Material issued successfully');
  }

  @Get('receivings')
  async getAllReceivings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'id',
    @Query('sortOrder') sortOrder: string = 'DESC',
    @Query('materialId') materialId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const materialIdNum = materialId ? parseInt(materialId) : undefined;
    const supplierIdNum = supplierId ? parseInt(supplierId) : undefined;

    const result = await this.service.getAllReceivings(
      pageNum, limitNum, search, sortBy, sortOrder, materialIdNum, supplierIdNum, status
    );
    return ResponseHelper.paginated(
      result.receivings,
      result.page,
      result.limit,
      result.total,
      'Receivings retrieved successfully'
    );
  }

  @Get('issuings')
  async getAllIssuings(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'id',
    @Query('sortOrder') sortOrder: string = 'DESC',
    @Query('materialId') materialId?: string,
    @Query('department') department?: string,
    @Query('status') status?: string,
    @Query('issuingType') issuingType?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const materialIdNum = materialId ? parseInt(materialId) : undefined;

    const result = await this.service.getAllIssuings(
      pageNum, limitNum, search, sortBy, sortOrder, materialIdNum, department, status, issuingType
    );
    return ResponseHelper.paginated(
      result.issuings,
      result.page,
      result.limit,
      result.total,
      'Issuings retrieved successfully'
    );
  }

  @Get('qr/:qrCode')
  async getLotByQrCode(@Param('qrCode') qrCode: string) {
    const lot = await this.service.getLotByQrCode(qrCode);
    return ResponseHelper.success(lot, 'Lot retrieved successfully');
  }

  @Get('qr/:qrCode/transactions')
  async getLotTransactions(@Param('qrCode') qrCode: string) {
    const transactions = await this.service.getLotTransactions(qrCode);
    return ResponseHelper.success(transactions, 'Transactions retrieved successfully');
  }

  @Get('lots')
  async getAllLots(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('materialId') materialId?: string,
    @Query('status') status?: string,
    @Query('locationId') locationId?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const materialIdNum = materialId ? parseInt(materialId) : undefined;
    const locationIdNum = locationId ? parseInt(locationId) : undefined;

    const result = await this.service.getAllLots(
      pageNum, limitNum, materialIdNum, status, locationIdNum
    );
    return ResponseHelper.paginated(
      result.lots,
      result.page,
      result.limit,
      result.total,
      'Lots retrieved successfully'
    );
  }
}
