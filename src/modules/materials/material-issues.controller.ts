import { Controller, Get, Post, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MaterialIssuesService } from './material-issues.service';
import { CreateManualIssueDto, CreateProductionIssueDto, PreviewProductionIssueDto } from './dto/material-issue.dto';
import { ResponseHelper } from '@app/common';

@Controller('material-issues')
export class MaterialIssuesController {
  constructor(private readonly service: MaterialIssuesService) {}

  @Post()
  async createManualIssue(@Body() dto: CreateManualIssueDto) {
    const issue = await this.service.createManualIssue(dto, 'admin');
    return ResponseHelper.success(issue, 'Material issued successfully');
  }

  @Post('production')
  async createProductionIssue(@Body() dto: CreateProductionIssueDto) {
    const issue = await this.service.createProductionIssue(dto, 'admin');
    return ResponseHelper.success(issue, 'Production material issued successfully');
  }

  @Post('production/preview')
  async previewProductionIssue(@Body() dto: PreviewProductionIssueDto) {
    const preview = await this.service.previewProductionIssue(dto);
    return ResponseHelper.success(preview, 'Production issue preview');
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('issueType') issueType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const result = await this.service.findAll(pageNum, limitNum, issueType, startDate, endDate);
    return ResponseHelper.paginated(result.data, result.page, result.limit, result.total, 'Material issues retrieved');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const issue = await this.service.findOne(id);
    return ResponseHelper.success(issue, 'Material issue retrieved');
  }
}
