import { Module } from '@nestjs/common';
import { PcBusinessModule } from './pc/pc-business.module';

/**
 * Root business layer — domain rules live under business/, not in controllers/services/DTOs.
 */
@Module({
  imports: [PcBusinessModule],
  exports: [PcBusinessModule],
})
export class BusinessModule {}
