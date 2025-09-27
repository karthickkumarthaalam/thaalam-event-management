import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, EntityManager } from 'typeorm';
import { Addon } from 'src/entities/addon.entity';
import { Ticket } from 'src/entities/ticket.entity';
import { Tax } from 'src/entities/tax.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Addon)
    private readonly addonRepo: Repository<Addon>,
    @InjectRepository(Tax)
    private readonly taxRepo: Repository<Tax>,
    private readonly redisService: RedisService,
  ) {}

  async createTicket(dto: CreateTicketDto, eventId: string): Promise<Ticket> {
    const ticket = this.ticketRepo.create({
      ...dto,
      event: { id: eventId },
    });

    if (dto.taxIds && dto.taxIds.length > 0) {
      ticket.taxes = await this.taxRepo.findBy({ id: In(dto.taxIds) });
    }

    const savedTicket = await this.ticketRepo.save(ticket);

    const client = this.redisService.getClient();
    await client.set(
      `remainingTickets:${savedTicket.id}`,
      savedTicket.quantity,
    );

    if (dto.addons && dto.addons.length > 0) {
      const addons = dto.addons.map((addon) =>
        this.addonRepo.create({ ...addon, ticket: savedTicket }),
      );
      savedTicket.addons = await this.addonRepo.save(addons);
    }

    return savedTicket;
  }

  async updateTicket(id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['addons', 'taxes'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }

    Object.assign(ticket, dto);

    if (dto.taxIds) {
      ticket.taxes =
        dto.taxIds.length > 0
          ? await this.taxRepo.findBy({ id: In(dto.taxIds) })
          : [];
    }

    const updatedTicket = await this.ticketRepo.save(ticket);

    if (dto.addons) {
      const existingAddons = ticket.addons ?? [];

      const incomingWithId = dto.addons.filter((a) => !!a.id);
      const incomingWithoutId = dto.addons.filter((a) => !a.id);

      for (const addonDto of incomingWithId) {
        const existing = existingAddons.find((a) => a.id === addonDto.id);
        if (existing) {
          Object.assign(existing, addonDto);
          await this.addonRepo.save(existing);
        }
      }

      if (incomingWithoutId.length > 0) {
        const newAddons = this.addonRepo.create(
          incomingWithoutId.map((addon) => ({
            ...addon,
            ticket: updatedTicket,
          })),
        );
        await this.addonRepo.save(newAddons);
      }

      const incomingIds = incomingWithId.map((a) => a.id);
      const toDelete = existingAddons.filter(
        (a) => !incomingIds.includes(a.id),
      );
      if (toDelete.length > 0) {
        await this.addonRepo.remove(toDelete);
      }

      updatedTicket.addons = await this.addonRepo.find({
        where: { ticket: { id } },
      });
    }

    const client = this.redisService.getClient();
    await client.set(
      `remainingTickets:${updatedTicket.id}`,
      updatedTicket.quantity,
    );

    return updatedTicket;
  }

  async findTicketByEvent(eventId: string): Promise<Ticket[]> {
    return this.ticketRepo.find({
      where: { event: { id: eventId } },
      relations: ['addons', 'taxes', 'event'],
      order: { createdAt: 'ASC' },
    });
  }

  async findTicketById(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['addons', 'taxes', 'event'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }

    return ticket;
  }

  async deleteTicket(id: string): Promise<void> {
    const ticket = await this.ticketRepo.findOne({ where: { id } });

    if (!ticket) {
      throw new NotFoundException(`Ticket with id ${id} not found`);
    }

    await this.ticketRepo.remove(ticket);
  }

  async reserveTickets(ticketId: string, quantity: number, orderId: string) {
    const client = this.redisService.getClient();

    const remainingKey = `remainingTickets:${ticketId}`;
    const reservationKey = `reservation:${orderId}:${ticketId}`;

    const remaining = await client.decrby(remainingKey, quantity);

    if (remaining < 0) {
      await client.incrby(remainingKey, quantity);
      throw new BadRequestException(`Not enough tickets available`);
    }

    await client.set(reservationKey, quantity, 'EX', 900);
  }
}
