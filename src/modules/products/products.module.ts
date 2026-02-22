import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsMasterController } from './master.controller';
import { ProductsService } from './products.service';
import { ProductMasterService } from './product-master.service';
import { Product, ProductBom, Customer, ProductLocation, ProductType, ProductModel, ProductDeliveryType, ProductUnit, ProductLoadingPoint, ProductProcessLine } from './entities';
import { Material } from '../materials/entities/material.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductBom, Customer, ProductLocation, ProductType, ProductModel, ProductDeliveryType, ProductUnit, ProductLoadingPoint, ProductProcessLine, Material])],
  controllers: [ProductsController, ProductsMasterController],
  providers: [ProductsService, ProductMasterService],
  exports: [ProductsService],
})
export class ProductsModule {}
