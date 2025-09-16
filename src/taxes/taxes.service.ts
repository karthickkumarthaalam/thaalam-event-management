import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tax } from 'src/entities/tax.entity';
import { Repository } from 'typeorm';
import { CreateTaxDto } from './dto/create-tax.dto';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Injectable()
export class TaxesService {
  constructor(@InjectRepository(Tax) readonly taxRepo: Repository<Tax>) {}

  async findAllTaxes(eventId: string, userId: string): Promise<Tax[]> {
    return this.taxRepo.find({
      where: {
        event_id: eventId,
        user_id: userId,
      },
    });
  }

  async createTax(dto: CreateTaxDto, userId: string): Promise<Tax> {
    const existing = await this.taxRepo.findOne({
      where: { name: dto.name, user_id: userId, event_id: dto.event_id },
    });
    if (existing) {
      throw new ForbiddenException('Tax with the same name already exists');
    }

    const tax = this.taxRepo.create({ ...dto, user_id: userId });
    await this.taxRepo.save(tax);
    return tax;
  }

  async updateTax(id: string, dto: UpdateTaxDto, userId: string): Promise<Tax> {
    const tax = await this.taxRepo.findOne({ where: { id } });

    if (!tax) {
      throw new ForbiddenException('Tax not found');
    }
    if (dto.name && dto.name !== tax.name) {
      const existing = await this.taxRepo.findOne({
        where: {
          name: dto.name,
          user_id: userId,
        },
      });
      if (existing) {
        throw new ForbiddenException('Tax with the same name already exists');
      }
    }

    Object.assign(tax, dto);
    await this.taxRepo.save(tax);
    return tax;
  }

  async deleteTax(id: string): Promise<void> {
    const tax = await this.taxRepo.findOne({ where: { id } });

    if (!tax) {
      throw new ForbiddenException('Tax not found');
    }

    await this.taxRepo.softRemove(tax);
  }

  async updateStatus(id: string, isActive: boolean): Promise<Tax> {
    const tax = await this.taxRepo.findOne({ where: { id } });

    if (!tax) {
      throw new ForbiddenException('Tax not found');
    }

    tax.status = isActive;

    await this.taxRepo.save(tax);
    return tax;
  }
}
