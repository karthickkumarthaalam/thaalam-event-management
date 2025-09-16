import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { DiscountType } from '../../entities/ticket.entity';
import { CreateAddonDto } from './create-addon.dto';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  ticket_name: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @Type(() => Number) // ✅ convert incoming string to number
  @IsNumber()
  price: number;

  @IsInt()
  @IsOptional()
  min_buy?: number;

  @IsInt()
  @IsOptional()
  max_buy?: number;

  @IsOptional()
  description?: string;

  @IsDateString()
  sales_start_date: string;

  @IsString()
  sales_start_time: string;

  @IsDateString()
  sales_end_date: string;

  @IsString()
  sales_end_time: string;

  @IsOptional()
  @IsEnum(DiscountType)
  discount_type?: DiscountType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  discount_value?: number;

  @IsOptional()
  @IsBoolean()
  early_bird_enabled?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  early_bird_discount_value?: number;

  @IsOptional()
  @Type(() => Date)
  early_bird_start?: Date;

  @IsOptional()
  @Type(() => Date)
  early_bird_end?: Date;

  @ValidateNested({ each: true })
  @Type(() => CreateAddonDto)
  @IsOptional()
  addons?: CreateAddonDto[];

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  taxIds?: string[];
}
