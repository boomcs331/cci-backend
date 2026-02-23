import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionPlansController } from './production-plans.controller';
import { ProductionPlansService } from './production-plans.service';
import { ProductionPlan, ProductionPlanItem, MaterialReservation } from './entities';
import { Product, ProductBom } from '../products/entities';
import { MaterialsStock } from '../materials/entities/materials-stock.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductionPlan,
      ProductionPlanItem,
      MaterialReservation,
      Product,
      ProductBom,
      MaterialsStock,
    ]),
  ],
  controllers: [ProductionPlansController],
  providers: [ProductionPlansService],
  exports: [ProductionPlansService],
})
export class ProductionPlansModule {}
