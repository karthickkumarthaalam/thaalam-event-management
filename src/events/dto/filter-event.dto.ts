import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { EventStatus } from 'src/entities/event.entity';

export class FilterEventsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
