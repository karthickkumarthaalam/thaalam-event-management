import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { DiscountType } from 'src/entities/promoCode.entity';

export class CreatePromoDto {
  @IsNotEmpty()
  code: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  discountValue: number;

  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @IsOptional()
  @IsDateString()
  validTo?: Date;

  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @IsNotEmpty()
  @IsUUID()
  eventId: string;

  @IsOptional()
  isActive: boolean;
}

export class UpdatePromoDto {
  @IsOptional()
  code?: string;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @IsOptional()
  @IsDateString()
  validTo?: Date;

  @IsOptional()
  @IsNumber()
  usageLimit?: number;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  isActive?: boolean;
}
