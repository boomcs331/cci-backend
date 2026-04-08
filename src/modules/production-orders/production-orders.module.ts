import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionOrdersController } from './production-orders.controller';
import { ProductionOrdersService } from './production-orders.service';
import { ProductionOrder, ProductionLot, ProductionProcess, ProductionLotTracking } from './entities';
import { Product } from '../products/entities/product.entity';
import { ProductionPlan, ProductionPlanItem } from '../production-plans/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductionOrder,
      ProductionLot,
      ProductionProcess,
      ProductionLotTracking,
      Product,
      ProductionPlan,
      ProductionPlanItem,
    ]),
  ],
  controllers: [ProductionOrdersController],
  providers: [ProductionOrdersService],
  exports: [ProductionOrdersService],
})
export class ProductionOrdersModule {}
