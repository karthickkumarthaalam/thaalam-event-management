import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateTaxDto } from './dto/create-tax.dto';
import type { Request } from 'express';
import { UpdateTaxDto } from './dto/update-tax.dto';

@Controller('taxes')
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(@Body() dto: CreateTaxDto, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('user not authenticated');
    }

    const userId = String(req.user.sub);
    return this.taxesService.createTax(dto, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':eventId')
  finaAll(@Param('eventId') eventId: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('user not authenticated');
    }

    return this.taxesService.findAllTaxes(eventId, req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaxDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.taxesService.updateTax(id, dto, req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('status/:id')
  updateStatus(
    @Param('id') id: string,
    @Body() isActive: boolean,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.taxesService.updateStatus(id, isActive);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.taxesService.deleteTax(id);
  }
}
