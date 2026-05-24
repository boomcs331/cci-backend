import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsMasterController } from './master.controller';
import { ProductInventoryController } from './product-inventory.controller';
import { ProductProductionStepsController } from './product-production-steps.controller';
import { ProductsUploadController } from './products-upload.controller';
import { ProductsService } from './products.service';
import { ProductMasterService } from './product-master.service';
import { ProductStockService } from './product-stock.service';
import { ProductFgLotService } from './product-fg-lot.service';
import { ProductProductionStepsService } from './product-production-steps.service';
import { AuthModule } from '../auth/auth.module';
import { ProductionProcess } from '../production-orders/entities/production-process.entity';
import {
  Product,
  ProductBom,
  Customer,
  ProductLocation,
  ProductType,
  ProductModel,
  ProductDeliveryType,
  ProductUnit,
  ProductLoadingPoint,
  ProductProcessLine,
  ProductProductionStep,
  ProductsStock,
  ProductSalesReservation,
  ProductFgLot,
  ProductFgLotMovement,
} from './entities';
import { Material } from '../materials/entities/material.entity';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Product,
      ProductBom,
      Customer,
      ProductLocation,
      ProductType,
      ProductModel,
      ProductDeliveryType,
      ProductUnit,
      ProductLoadingPoint,
      ProductProcessLine,
      ProductProductionStep,
      ProductsStock,
      ProductSalesReservation,
      ProductFgLot,
      ProductFgLotMovement,
      Material,
      ProductionProcess,
    ]),
  ],
  controllers: [
    ProductInventoryController,
    ProductsController,
    ProductsMasterController,
    ProductProductionStepsController,
    ProductsUploadController,
  ],
  providers: [
    ProductsService,
    ProductMasterService,
    ProductStockService,
    ProductFgLotService,
    ProductProductionStepsService,
  ],
  exports: [ProductsService, ProductStockService, ProductFgLotService],
})
export class ProductsModule {}
