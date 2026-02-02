import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { ProductionOrder, ProductionMaterialRequirement } from './entities';
import { MaterialIssuing } from '../materials/receiving-issuing/entities/material-issuing.entity';
import { MaterialIssuingLot } from '../materials/receiving-issuing/entities/material-issuing-lot.entity';
import { MaterialsStock } from '../materials/entities/materials-stock.entity';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductionOrder,
      ProductionMaterialRequirement,
      MaterialIssuing,
      MaterialIssuingLot,
      MaterialsStock,
    ]),
    ProductsModule,
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
