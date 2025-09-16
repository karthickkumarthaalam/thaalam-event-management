import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { TaxApplicableOn, TaxMode, TaxType } from 'src/entities/tax.entity';

export class CreateTaxDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEnum(TaxMode)
  mode: TaxMode;

  @IsEnum(TaxType)
  type: TaxType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value: number;

  @IsEnum(TaxApplicableOn)
  @IsOptional()
  applicable_on?: TaxApplicableOn;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  status?: boolean;

  @IsString()
  @IsNotEmpty()
  event_id: string;
}
