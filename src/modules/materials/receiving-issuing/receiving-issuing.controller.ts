import { Controller, Get, Post, Body, Param, Query, Headers } from '@nestjs/common';
import { ReceivingIssuingService } from './receiving-issuing.service';
import {
  CreateReceivingDto,
  CreateIssuingDto,
  CreateIssuingWithDocumentDto,
  CreateIssuingFromBomDto,
  MaterialTransactionReportDto,
} from './dto';
import {
  CreateManualIssueDto,
  CreateProductionIssueDto,
  PreviewProductionIssueDto,
} from '../dto/material-issue.dto';
import { ResponseHelper } from '@app/common';

@Controller('materials/transactions')
export class ReceivingIssuingController {
  constructor(private readonly service: ReceivingIssuingService) {}

  @Post('receive')
  async createReceiving(@Body() dto: CreateReceivingDto) {
    const receiving = await this.service.createReceiving(dto);
    return ResponseHelper.success(receiving, 'Material received successfully');
  }

  @Post('issue-with-document')
  async createIssuingWithDocument(@Body() dto: CreateIssuingWithDocumentDto) {
    const issuing = await this.service.createIssuingWithDocument(dto);
    return ResponseHelper.success(
      issuing,
      'Material issued with documents successfully',
    );
  }

  @Post('issue-from-bom')
  async createIssuingFromBom(@Body() dto: CreateIssuingFromBomDto) {
    const issuings = await this.service.createIssuingFromBom(dto);
    return ResponseHelper.success(
      issuings,
      'Materials issued from product BOM successfully',
    );
  }

  @Post('issue-from-material-bom')
  async createIssuingFromMaterialBom(@Body() dto: any) {
    const issuings = await this.service.createIssuingFromMaterialBom(
      dto,
      'admin',
    );
    return ResponseHelper.success(
      issuings,
      'Materials issued from material BOM with FIFO successfully',
    );
  }

  @Post('issue-manual')
  async createManualIssue(@Body() dto: CreateManualIssueDto) {
    const issue = await this.service.createManualIssue(dto, 'admin');
    return ResponseHelper.success(issue, 'Material issued successfully');
  }

  @Post('issue-production')
  async createProductionIssue(@Body() dto: CreateProductionIssueDto) {
    const issue = await this.service.createProductionIssue(dto, 'admin');
    return ResponseHelper.success(
      issue,
      'Production material issued successfully',
    );
  }

  @Post('issue-production/preview')
  async previewProductionIssue(@Body() dto: PreviewProductionIssueDto) {
    const preview = await this.service.previewProductionIssue(dto);
    return ResponseHelper.success(preview, 'Production issue preview');
  }

  @Get('issues')
  async findAllIssues(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('issueType') issueType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const result = await this.service.findAllIssues(
      pageNum,
      limitNum,
      issueType,
      startDate,
      endDate,
    );
    return ResponseHelper.paginated(
      result.data,
      result.page,
      result.limit,
      result.total,
      'Material issues retrieved',
    );
  }

  @Get('issues/:id')
  async findOneIssue(@Param('id') id: string) {
    const issue = await this.service.findOneIssue(parseInt(id));
    return ResponseHelper.success(issue, 'Material issue retrieved');
  }

  @Get('issues/:id/documents')
  async getIssueDocuments(@Param('id') id: string) {
    const documents = await this.service.getIssueDocuments(parseInt(id));
    return ResponseHelper.success(documents, 'Issue documents retrieved');
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
    @Query('status') status?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const materialIdNum = materialId ? parseInt(materialId) : undefined;
    const supplierIdNum = supplierId ? parseInt(supplierId) : undefined;

    const result = await this.service.getAllReceivings(
      pageNum,
      limitNum,
      search,
      sortBy,
      sortOrder,
      materialIdNum,
      supplierIdNum,
      status,
    );
    return ResponseHelper.paginated(
      result.receivings,
      result.page,
      result.limit,
      result.total,
      'Receivings retrieved successfully',
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
    @Query('issuingType') issuingType?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const materialIdNum = materialId ? parseInt(materialId) : undefined;

    const result = await this.service.getAllIssuings(
      pageNum,
      limitNum,
      search,
      sortBy,
      sortOrder,
      materialIdNum,
      department,
      status,
      issuingType,
    );
    return ResponseHelper.paginated(
      result.issuings,
      result.page,
      result.limit,
      result.total,
      'Issuings retrieved successfully',
    );
  }

  @Get('qr/:qrCode')
  async getLotByQrCode(
    @Param('qrCode') qrCode: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const lot = await this.service.getLotByQrCode(qrCode, userId);
    return ResponseHelper.success(lot, 'Lot retrieved successfully');
  }

  @Get('qr/:qrCode/transactions')
  async getLotTransactions(
    @Param('qrCode') qrCode: string,
    @Headers('x-user-id') userId?: string,
  ) {
    const transactions = await this.service.getLotTransactions(qrCode, userId);
    return ResponseHelper.success(
      transactions,
      'Transactions retrieved successfully',
    );
  }

  @Get('lots')
  async getAllLots(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('materialId') materialId?: string,
    @Query('status') status?: string,
    @Query('locationId') locationId?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const materialIdNum = materialId ? parseInt(materialId) : undefined;
    const locationIdNum = locationId ? parseInt(locationId) : undefined;

    const result = await this.service.getAllLots(
      pageNum,
      limitNum,
      materialIdNum,
      status,
      locationIdNum,
    );
    return ResponseHelper.paginated(
      result.lots,
      result.page,
      result.limit,
      result.total,
      'Lots retrieved successfully',
    );
  }

  @Get('issuing-types')
  async getAllIssuingTypes() {
    const types = await this.service.getAllIssuingTypes();
    return ResponseHelper.success(
      types,
      'Issuing types retrieved successfully',
    );
  }

  @Get('issuing-types/:id')
  async getIssuingTypeById(@Param('id') id: string) {
    const type = await this.service.getIssuingTypeById(parseInt(id));
    return ResponseHelper.success(type, 'Issuing type retrieved successfully');
  }

  @Get('stock')
  async getMaterialsStock(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('materialId') materialId?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const materialIdNum = materialId ? parseInt(materialId) : undefined;

    const result = await this.service.getMaterialsStock(
      pageNum,
      limitNum,
      materialIdNum,
    );
    return ResponseHelper.paginated(
      result.stocks,
      result.page,
      result.limit,
      result.total,
      'Material stocks retrieved successfully',
    );
  }

  @Get('stock/:materialId')
  async getMaterialStock(@Param('materialId') materialId: string) {
    const stock = await this.service.getMaterialStock(parseInt(materialId));
    return ResponseHelper.success(
      stock,
      'Material stock retrieved successfully',
    );
  }

  @Get('report/transactions')
  async getTransactionReport(@Query() query: MaterialTransactionReportDto) {
    const report = await this.service.getTransactionReport(
      query.startDate,
      query.endDate,
      query.materialId,
    );
    return ResponseHelper.success(
      report,
      'Transaction report retrieved successfully',
    );
  }
}
