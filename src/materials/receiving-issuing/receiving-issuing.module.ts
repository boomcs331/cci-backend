import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceivingIssuingController } from './receiving-issuing.controller';
import { ReceivingIssuingService } from './receiving-issuing.service';
import { MaterialReceiving, MaterialReceivingLot, MaterialIssuing, MaterialIssuingLot, MaterialTransaction } from './entities';
import { Material, MaterialsStock } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaterialReceiving,
      MaterialReceivingLot,
      MaterialIssuing,
      MaterialIssuingLot,
      MaterialTransaction,
      Material,
      MaterialsStock
    ])
  ],
  controllers: [ReceivingIssuingController],
  providers: [ReceivingIssuingService],
  exports: [ReceivingIssuingService]
})
export class ReceivingIssuingModule {}
