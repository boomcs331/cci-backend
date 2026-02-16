import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsMasterController } from './master.controller';
import { ProductsService } from './products.service';
import { Product, ProductBom, Customer, ProductLocation } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductBom, Customer, ProductLocation])],
  controllers: [ProductsController, ProductsMasterController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
