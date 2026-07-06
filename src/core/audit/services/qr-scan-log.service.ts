import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QrScanAction, QrScanDomain, QrScanLog } from '../entities';

export interface QrScanLogInput {
  domain: QrScanDomain;
  action: QrScanAction;
  qrCode: string;
  userId?: string | null;
  username?: string | null;
  departmentId?: string | null;
  isSuccess: boolean;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class QrScanLogService {
  private readonly logger = new Logger(QrScanLogService.name);

  constructor(
    @InjectRepository(QrScanLog)
    private readonly qrScanLogRepository: Repository<QrScanLog>,
  ) {}

  async logEvent(input: QrScanLogInput): Promise<void> {
    try {
      await this.qrScanLogRepository.save(
        this.qrScanLogRepository.create({
          domain: input.domain,
          action: input.action,
          qrCode: input.qrCode,
          userId: input.userId ?? null,
          username: input.username ?? null,
          departmentId: input.departmentId ?? null,
          isSuccess: input.isSuccess,
          errorMessage: input.errorMessage ?? null,
          metadata: input.metadata ?? null,
        }),
      );
    } catch (err) {
      this.logger.warn(
        `Failed to write qr scan log: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
