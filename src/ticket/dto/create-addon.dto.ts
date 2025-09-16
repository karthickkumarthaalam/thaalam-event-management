import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { AddonType } from 'src/entities/addon.entity';

export class CreateAddonDto {
  @IsString()
  @IsNotEmpty()
  addon_name: string;

  @IsEnum(AddonType)
  addon_type: AddonType;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Type(() => Number)
  @Min(0)
  addon_value: number;
}
