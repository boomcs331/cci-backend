import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { MasterController } from './master.controller';
import { MasterService } from './master.service';
import { MaterialIssuesController } from './material-issues.controller';
import { MaterialIssuesService } from './material-issues.service';
import { UploadController } from './upload.controller';
import { Material, MaterialsType, MaterialsLocation, MaterialsStock, Supplier, Model, DeliveryType, Unit, LoadingPoint, ProcessLine, MaterialIssue, MaterialIssueItem, MaterialIssueDocument } from './entities';
import { Product, ProductBom } from '../products/entities';
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
      MaterialIssue,
      MaterialIssueItem,
      MaterialIssueDocument,
      Product,
      ProductBom,
    ]),
    ReceivingIssuingModule,
  ],
  controllers: [MaterialsController, MasterController, MaterialIssuesController, UploadController],
  providers: [MaterialsService, MasterService, MaterialIssuesService],
  exports: [MaterialsService, MasterService, MaterialIssuesService],
})
export class MaterialsModule {}