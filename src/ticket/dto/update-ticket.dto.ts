import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateAddonDto } from './update-addon.dto';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ValidateNested({ each: true })
  @Type(() => UpdateAddonDto)
  @IsOptional()
  addons?: UpdateAddonDto[];

  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  taxIds?: string[];
}
