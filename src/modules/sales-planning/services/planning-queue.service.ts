import { Injectable } from '@nestjs/common';
// import { InjectQueue } from '@nestjs/bull';
// import { Queue } from 'bull';

export interface ProcessJobData {
  batchId: number;
  filePath: string;
  year: number;
  month: number;
}

@Injectable()
export class PlanningQueueService {
  // constructor(
  //   @InjectQueue('planning-import')
  //   private readonly planningQueue: Queue,
  // ) {}

  async addProcessJob(data: ProcessJobData): Promise<void> {
    // TODO: Implement when Bull is installed
    // await this.planningQueue.add('process-planning', data, {
    //   attempts: 3,
    //   backoff: {
    //     type: 'exponential',
    //     delay: 2000,
    //   },
    //   removeOnComplete: 10,
    //   removeOnFail: 50,
    // });
  }

  async getJobStatus(jobId: string): Promise<any> {
    // TODO: Implement when Bull is installed
    // const job = await this.planningQueue.getJob(jobId);
    // if (!job) {
    //   return null;
    // }
    // return {
    //   id: job.id,
    //   name: job.name,
    //   data: job.data,
    //   progress: job.progress,
    //   state: await job.getState(),
    //   failedReason: job.failedReason,
    //   processedOn: job.processedOn,
    //   finishedOn: job.finishedOn,
    // };
    return null;
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    // TODO: Implement when Bull is installed
    // const counts = await this.planningQueue.getJobCounts();
    // return counts;
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }
}
