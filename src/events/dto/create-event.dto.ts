import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EventStatus } from 'src/entities/event.entity';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  end_date?: Date;

  @IsNotEmpty()
  @IsString()
  country?: string;

  @IsNotEmpty()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsString()
  currency_symbol: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  @Transform(({ value }) => value ?? EventStatus.PLANING)
  status?: EventStatus;
}
