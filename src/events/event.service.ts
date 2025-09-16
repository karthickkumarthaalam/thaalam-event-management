import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from 'src/entities/event.entity';
import { ILike, Repository } from 'typeorm';
import { CreateEventDto } from './dto/create-event.dto';
import { User } from 'src/entities/user.entity';
import { FilterEventsDto } from './dto/filter-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { deleteFileIfExists } from 'src/common/utils/file-upload.utils';
import slugify from 'slugify';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async create(dto: CreateEventDto, user: User) {
    const slugBase =
      dto.slug || slugify(dto.name, { lower: true, strict: true });

    let slug = slugBase;
    let counter = 1;

    while (await this.eventRepo.findOne({ where: { slug } })) {
      slug = `${slugBase}-${counter++}`;
    }

    const event = this.eventRepo.create({
      ...dto,
      slug,
      created_by: user,
    });

    return this.eventRepo.save(event);
  }

  async findAll(filter: FilterEventsDto, user?: User) {
    const { page = 1, limit = 10, search, status } = filter;

    const where: any = {};

    if (search) where.name = ILike(`%${search}%`);
    if (status) where.status = status;
    if (user) where.created_by = { id: user.id }; // restrict to logged-in user's events

    const [data, total] = await this.eventRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { start_date: 'DESC' },
    });

    return { data, total, page, limit };
  }

  async findOne(id: string, user?: User) {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['created_by'],
    });

    if (!event) throw new NotFoundException(`Event with id "${id}" not found`);

    if (user && event.created_by.id !== user.id) {
      throw new ForbiddenException('You are not allowed to view this event');
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto, user: User) {
    const event = await this.findOne(id, user);

    // Handle logo removal/update
    if (dto.logo === 'null') {
      if (event.logo) {
        deleteFileIfExists(event.logo);
      }
      event.logo = null;
    } else if (dto.logo !== undefined && dto.logo !== event.logo) {
      if (event.logo) {
        deleteFileIfExists(event.logo);
      }
      // Update to new logo path
      event.logo = dto.logo;
    }
    // If dto.logo is undefined, do nothing (logo remains unchanged)

    const end_date =
      dto.end_date === null || dto.end_date === undefined
        ? null
        : (dto.end_date ?? event.end_date);

    // Update other fields (excluding logo since we handled it above)
    Object.assign(event, {
      name: dto.name ?? event.name,
      slug: dto.slug ?? event.slug,
      description: dto.description ?? event.description,
      start_date: dto.start_date ?? event.start_date,
      end_date: end_date,
      country: dto.country ?? event.country,
      location: dto.location ?? event.location,
      address: dto.address ?? event.address,
      currency: dto.currency ?? event.currency,
      currency_symbol: dto.currency_symbol ?? event.currency_symbol,
      status: dto.status ?? event.status,
      // logo is handled separately above
    });

    return this.eventRepo.save(event);
  }

  async remove(id: string, user: User) {
    const event = await this.findOne(id, user);

    return this.eventRepo.softRemove(event);
  }
}
