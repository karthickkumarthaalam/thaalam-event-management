import { Module } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { TicketQueueService } from './ticket-queue.service';

@Module({
  providers: [TicketQueueService, RedisService],
  exports: [TicketQueueService],
})
export class TicketQueueModule {}
