import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class CreateOrderItemAddonDto {
  @IsString()
  addonRefId: string;

  @IsString()
  addonName: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;
}

class CreateOrderItemTaxDto {
  @IsString()
  taxRefId: string;

  @IsString()
  taxName: string;

  @IsNumber()
  taxRate: number;

  @IsNumber()
  taxAmount: number;
}

class CreateOrderItemDto {
  @IsString()
  ticketRefId: string;

  @IsString()
  ticketClass: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemAddonDto)
  addons?: CreateOrderItemAddonDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemTaxDto)
  taxes?: CreateOrderItemTaxDto[];
}

export class CreateOrderDto {
  @IsString()
  eventId: string;

  @IsString()
  purchaserName: string;

  @IsEmail()
  purchaseEmail: string;

  @IsString()
  purchaseMobile: string;

  @IsOptional()
  @IsString()
  purchaseBillingAddress?: string;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsString()
  affiliateCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
