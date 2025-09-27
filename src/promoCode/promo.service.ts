import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PromoCode } from 'src/entities/promoCode.entity';
import { Repository } from 'typeorm';
import { CreatePromoDto } from './dto/create-promo.dto';
import { Event } from 'src/entities/event.entity';

@Injectable()
export class PromoService {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoRepo: Repository<PromoCode>,

    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async createPromo(dto: CreatePromoDto): Promise<PromoCode> {
    const { eventId, ...rest } = dto;

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const promo = this.promoRepo.create({
      ...rest,
      event,
    });

    return this.promoRepo.save(promo);
  }

  async getAllPromos(): Promise<PromoCode[]> {
    return await this.promoRepo.find({
      relations: ['event'],
    });
  }

  async getPromosByEvent(eventId: string): Promise<PromoCode[]> {
    const event = await this.eventRepo.findOneBy({ id: eventId });
    if (!event) throw new NotFoundException('Event not found');

    return this.promoRepo.find({
      where: { event: { id: eventId } },
    });
  }

  async getPromoById(id: string): Promise<PromoCode> {
    const promo = await this.promoRepo.findOne({
      where: { id },
      relations: ['event'],
    });
    if (!promo) throw new NotFoundException('Promo code not found');
    return promo;
  }

  async updatePromo(
    id: string,
    dto: Partial<CreatePromoDto>,
  ): Promise<PromoCode> {
    const promo = await this.getPromoById(id);

    if (dto.eventId) {
      const event = await this.eventRepo.findOne({
        where: { id: dto.eventId },
      });
      if (!event) throw new NotFoundException('Event not found');
      promo.event = event;
    }

    Object.assign(promo, dto);
    return this.promoRepo.save(promo);
  }

  async deletePromo(id: string): Promise<void> {
    const promo = await this.getPromoById(id);
    await this.promoRepo.softRemove(promo); // soft delete
  }

  async validatePromo(code: string) {
    const promo = await this.promoRepo.findOne({
      where: { code, isActive: true },
    });
    if (!promo) {
      return { valid: false, reason: 'Invalid or inactive promo code' };
    }

    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
      return { valid: false, reason: 'Promo code not yet active' };
    }

    if (promo.validTo && now > promo.validTo) {
      return { valid: false, reason: 'Promo code expired' };
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      return { valid: false, reason: 'Promo code usage limit reached' };
    }

    return {
      valid: true,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
    };
  }
}
