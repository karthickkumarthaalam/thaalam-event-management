import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tax } from 'src/entities/tax.entity';
import { TaxesController } from './taxes.controller';
import { TaxesService } from './taxes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tax])],
  controllers: [TaxesController],
  providers: [TaxesService],
  exports: [TaxesService],
})
export class TaxesModule {}
