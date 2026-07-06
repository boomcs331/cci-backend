import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ResponseHelper } from '@app/common';
import { ProductionProcessesService } from './production-processes.service';
import {
  CreateProductionProcessDto,
  UpdateProductionProcessDto,
  ListProductionProcessesQueryDto,
} from './dto/production-process.dto';

@Controller('masters/production-processes')
export class ProductionProcessesController {
  constructor(private readonly service: ProductionProcessesService) {}

  @Get()
  async findAll(@Query() query: ListProductionProcessesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const result = await this.service.findAll(
      page,
      limit,
      query.search,
      query.isActive,
    );
    return ResponseHelper.success(result, 'Production processes retrieved');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const row = await this.service.findOne(id);
    return ResponseHelper.success(row, 'Production process retrieved');
  }

  @Post()
  async create(@Body() dto: CreateProductionProcessDto) {
    const row = await this.service.create(dto);
    return ResponseHelper.success(row, 'Production process created');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionProcessDto,
  ) {
    const row = await this.service.update(id, dto);
    return ResponseHelper.success(row, 'Production process updated');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.service.remove(id);
    return ResponseHelper.success(result, result.message);
  }
}
