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
  Request,
} from '@nestjs/common';
import { ResponseHelper } from '@app/common';
import { ProductProductionStepsService } from './product-production-steps.service';
import {
  CreateProductProductionStepDto,
  UpdateProductProductionStepDto,
  ListProductProductionStepsQueryDto,
} from './dto/product-production-step.dto';
import { AuthUserService } from '../auth/services/auth-user.service';

@Controller('masters/product-production-steps')
export class ProductProductionStepsController {
  constructor(
    private readonly service: ProductProductionStepsService,
    private readonly authUserService: AuthUserService,
  ) {}

  @Get()
  async findAll(@Query() query: ListProductProductionStepsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const result = await this.service.findAll(
      page,
      limit,
      query.productId,
      query.search,
    );
    return ResponseHelper.success(result, 'Product production steps retrieved');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const row = await this.service.findOne(id);
    return ResponseHelper.success(row, 'Product production step retrieved');
  }

  @Post()
  async create(
    @Body() dto: CreateProductProductionStepDto,
    @Request() req,
  ) {
    const user = await this.authUserService.resolveUsernameFromRequest(req);
    const row = await this.service.create(dto, user);
    return ResponseHelper.success(row, 'Product production step created');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductProductionStepDto,
    @Request() req,
  ) {
    const user = await this.authUserService.resolveUsernameFromRequest(req);
    const row = await this.service.update(id, dto, user);
    return ResponseHelper.success(row, 'Product production step updated');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
    return ResponseHelper.success(null, 'Product production step deleted');
  }
}
