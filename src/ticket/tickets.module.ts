import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Addon } from 'src/entities/addon.entity';
import { Ticket } from 'src/entities/ticket.entity';
import { TicketService } from './tickets.service';
import { TicketController } from './tickets.controller';
import { Tax } from 'src/entities/tax.entity';
import { RedisService } from 'src/redis/redis.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Addon, Tax])],
  controllers: [TicketController],
  providers: [TicketService, RedisService],
  exports: [TicketService],
})
export class TicketModule {}
