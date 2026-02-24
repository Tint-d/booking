import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import type { UserEntity } from '../common/user.entity';
import { CurrentUserGuard } from '../common/current-user.guard';
import { RolesGuard } from '../common/roles.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
@UseGuards(CurrentUserGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: UserEntity) {
    return this.bookingsService.create(dto, user);
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get('grouped-by-user')
  @UseGuards(RolesGuard)
  @Roles(Role.Owner, Role.Admin)
  getGroupedByUser() {
    return this.bookingsService.getGroupedByUser();
  }

  @Get('summary')
  @UseGuards(RolesGuard)
  @Roles(Role.Owner, Role.Admin)
  getSummary() {
    return this.bookingsService.getSummary();
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    this.bookingsService.delete(id, user);
    return { ok: true };
  }
}
