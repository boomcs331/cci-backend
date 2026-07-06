import { Module } from '@nestjs/common';
import { PcReceivingBusiness } from './receiving/pc-receiving.business';

@Module({
  providers: [PcReceivingBusiness],
  exports: [PcReceivingBusiness],
})
export class PcBusinessModule {}
