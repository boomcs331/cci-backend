import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsMasterController } from './master.controller';
import { ProductInventoryController } from './product-inventory.controller';
import { ProductsService } from './products.service';
import { ProductMasterService } from './product-master.service';
import { ProductStockService } from './product-stock.service';
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
} from './entities';
import { Material } from '../materials/entities/material.entity';

@Module({
  imports: [
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
      Material,
    ]),
  ],
  controllers: [
    ProductInventoryController,
    ProductsController,
    ProductsMasterController,
  ],
  providers: [ProductsService, ProductMasterService, ProductStockService],
  exports: [ProductsService, ProductStockService],
})
export class ProductsModule {}
