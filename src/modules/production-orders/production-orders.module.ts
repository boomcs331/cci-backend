import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionOrdersController } from './production-orders.controller';
import { ProductionOrdersService } from './production-orders.service';
import {
  ProductionOrder,
  ProductionLot,
  ProductionProcess,
  ProductionLotTracking,
} from './entities';
import { Product } from '../products/entities/product.entity';
import { ProductProductionStep } from '../products/entities/product-production-step.entity';
import {
  ProductionPlan,
  ProductionPlanItem,
} from '../production-plans/entities';
import { ProductsModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../../core/audit/audit.module';

@Module({
  imports: [
    AuthModule,
    ProductsModule,
    AuditModule,
    TypeOrmModule.forFeature([
      ProductionOrder,
      ProductionLot,
      ProductionProcess,
      ProductionLotTracking,
      Product,
      ProductProductionStep,
      ProductionPlan,
      ProductionPlanItem,
    ]),
  ],
  controllers: [ProductionOrdersController],
  providers: [ProductionOrdersService],
  exports: [ProductionOrdersService],
})
export class ProductionOrdersModule {}
