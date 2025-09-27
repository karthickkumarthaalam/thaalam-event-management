import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { PromoService } from './promo.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { PromoCode } from 'src/entities/promoCode.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('promo')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  // Create a new promo code
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() dto: CreatePromoDto): Promise<PromoCode> {
    return this.promoService.createPromo(dto);
  }

  // Get all promo codes
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getAll(): Promise<PromoCode[]> {
    return this.promoService.getAllPromos();
  }

  // Get promo codes for a specific event
  @Get('event/:eventId')
  async getByEvent(@Param('eventId') eventId: string): Promise<PromoCode[]> {
    return this.promoService.getPromosByEvent(eventId);
  }

  // Get promo code by ID
  @Get(':id')
  async getById(@Param('id') id: string): Promise<PromoCode> {
    return this.promoService.getPromoById(id);
  }

  // Update a promo code
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePromoDto>,
  ): Promise<PromoCode> {
    return this.promoService.updatePromo(id, dto);
  }

  // Soft delete a promo code
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.promoService.deletePromo(id);
    return { message: 'Promo code deleted successfully' };
  }

  // Validate a promo code by its code
  @Get('validate/:code')
  async validate(@Param('code') code: string) {
    return this.promoService.validatePromo(code);
  }
}
