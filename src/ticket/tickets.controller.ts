import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Patch,
  Delete,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { TicketService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post(':eventId')
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateTicketDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.ticketService.createTicket(dto, eventId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.ticketService.updateTicket(id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.ticketService.deleteTicket(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/events/:eventId')
  findTicketsByEvent(@Param('eventId') eventId: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.ticketService.findTicketByEvent(eventId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.ticketService.findTicketById(id);
  }
}
