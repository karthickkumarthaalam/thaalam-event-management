import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Queue, Worker, JobsOptions } from 'bullmq';
import { RedisService } from 'src/redis/redis.service';
import IORedis from 'ioredis';

@Injectable()
export class TicketQueueService implements OnModuleInit {
  private queue: Queue;
  private logger = new Logger(TicketQueueService.name);

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    // ✅ Wait for Redis ready
    const client: IORedis = await this.redisService.getClientReady();

    // Duplicate connection for BullMQ with safe options
    const connectionOptions = {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null, // Required by BullMQ v5
    };

    // Queue
    this.queue = new Queue('ticket-generation-queue', {
      connection: connectionOptions,
    });

    // Worker
    new Worker(
      'ticket-generation-queue',
      async (job) => {
        this.logger.log(`Processing ticket job: ${JSON.stringify(job.data)}`);
        await new Promise((r) => setTimeout(r, 1000));
        this.logger.log(`Finished ticket job: ${job.id}`);
      },
      {
        connection: connectionOptions,
        concurrency: 5,
      },
    );

    this.logger.log('Ticket queue initialized');
  }

  async addJob(data: any) {
    if (!this.queue) throw new Error('Queue not initialized');

    const options: JobsOptions = {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
    };

    return this.queue.add('generate-ticket', data, options);
  }
}
