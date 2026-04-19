import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceivingIssuingController } from './receiving-issuing.controller';
import { ReceivingIssuingService } from './receiving-issuing.service';
import {
  MaterialReceiving,
  MaterialReceivingLot,
  MaterialIssuing,
  MaterialIssuingLot,
  MaterialTransaction,
  MaterialIssuingDocument,
} from './entities';
import {
  Material,
  MaterialsStock,
  IssuingType,
  MaterialIssue,
  MaterialIssueItem,
  MaterialIssueDocument,
} from '../entities';
import { Product } from '../../products/entities/product.entity';
import { ProductBom } from '../../products/entities/product-bom.entity';
import { AuditModule } from '../../../core/audit/audit.module';

@Module({
  imports: [
    AuditModule,
    TypeOrmModule.forFeature([
      MaterialReceiving,
      MaterialReceivingLot,
      MaterialIssuing,
      MaterialIssuingLot,
      MaterialIssuingDocument,
      MaterialTransaction,
      Material,
      MaterialsStock,
      IssuingType,
      MaterialIssue,
      MaterialIssueItem,
      MaterialIssueDocument,
      Product,
      ProductBom,
    ]),
  ],
  controllers: [ReceivingIssuingController],
  providers: [ReceivingIssuingService],
  exports: [ReceivingIssuingService],
})
export class ReceivingIssuingModule {}
