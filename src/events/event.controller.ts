import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { FilterEventsDto } from './dto/filter-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { UploadFile } from 'src/common/decorators/file-upload.decorator';
import { getFilePath } from 'src/common/utils/file-upload.utils';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UploadFile('logo', 'events')
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateEventDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const logoPath = file ? getFilePath('events', file.filename) : undefined;
    return this.eventService.create({ ...dto, logo: logoPath }, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Query() filter: FilterEventsDto, @Req() req: Request) {
    return this.eventService.findAll(filter, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findById(@Param('id') id: string, @Req() req: Request) {
    return this.eventService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @UploadFile('logo', 'events')
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateEventDto,
    @Req() req: Request,
  ) {
    const logoPath = file ? getFilePath('events', file.filename) : undefined;

    const updateData: any = { ...dto };

    if (dto.end_date === null || dto.end_date === undefined) {
      updateData.end_date === null;
    }

    if (logoPath) {
      updateData.logo = logoPath;
    }

    return this.eventService.update(id, updateData, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.eventService.remove(id, req.user);
  }
}
