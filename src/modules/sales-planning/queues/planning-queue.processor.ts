// import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
// import { Job } from 'bull';
import { PlanningImportService } from '../services/planning-import.service';
import { ProcessJobData } from '../services/planning-queue.service';

// @Processor('planning-import')
export class PlanningQueueProcessor {
  private readonly logger = new Logger(PlanningQueueProcessor.name);

  constructor(private readonly importService: PlanningImportService) {}

  // @Process('process-planning')
  async handleProcessPlanning(job: any): Promise<void> {
    this.logger.log(`Processing planning batch ${job.data.batchId}`);
    await this.importService.processPlanningBatch(job.data);
  }

  // @OnQueueActive()
  onActive(job: any) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  // @OnQueueCompleted()
  onCompleted(job: any) {
    this.logger.log(`Completed job ${job.id} of type ${job.name}`);
  }

  // @OnQueueFailed()
  onFailed(job: any, error: Error) {
    this.logger.error(
      `Failed job ${job.id} of type ${job.name}: ${error.message}`,
      error.stack,
    );
  }
}
