import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionPlansController } from './production-plans.controller';
import { ProductionPlansService } from './production-plans.service';
import {
  ProductionPlan,
  ProductionPlanItem,
  MaterialReservation,
} from './entities';
import { Product, ProductBom } from '../products/entities';
import { MaterialsStock } from '../materials/entities/materials-stock.entity';
import { ProductionOrdersModule } from '../production-orders/production-orders.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ProductionOrdersModule,
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
