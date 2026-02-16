import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { MasterController } from './master.controller';
import { MasterService } from './master.service';
import { Material, MaterialsType, MaterialsLocation, MaterialsStock, Supplier, Model, DeliveryType, Unit, LoadingPoint, ProcessLine } from './entities';
import { ReceivingIssuingModule } from './receiving-issuing';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Material,
      MaterialsType,
      MaterialsLocation,
      MaterialsStock,
      Supplier,
      Model,
      DeliveryType,
      Unit,
      LoadingPoint,
      ProcessLine,
    ]),
    ReceivingIssuingModule,
  ],
  controllers: [MaterialsController, MasterController],
  providers: [MaterialsService, MasterService],
  exports: [MaterialsService, MasterService],
})
export class MaterialsModule {}