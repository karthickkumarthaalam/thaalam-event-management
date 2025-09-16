import { CreateAddonDto } from './create-addon.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateAddonDto extends CreateAddonDto {
  @IsUUID()
  @IsOptional()
  id?: string;
}
