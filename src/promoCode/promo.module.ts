import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromoCode } from 'src/entities/promoCode.entity';
import { PromoService } from './promo.service';
import { PromoController } from './promo.controller';
import { Event } from 'src/entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, PromoCode])],
  providers: [PromoService],
  controllers: [PromoController],
  exports: [PromoService],
})
export class PromoModule {}
