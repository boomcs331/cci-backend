import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { Material, MaterialsType, MaterialsLocation, ItemsName, MaterialsStock, Supplier } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Material,
      MaterialsType,
      MaterialsLocation,
      ItemsName,
      MaterialsStock,
      Supplier,
    ]),
  ],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [MaterialsService],
})
export class MaterialsModule {}