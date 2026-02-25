import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { type Response } from 'express';
import type { BookingEntity } from '../common/booking.entity';
import { CurrentUser } from '../common/current-user.decorator';
import { CurrentUserGuard } from '../common/current-user.guard';
import type { PaginationMeta } from '../common/pagination.dto';
import { formatResponse } from '../common/response.types';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { RolesGuard } from '../common/roles.guard';
import type { UserEntity } from '../common/user.entity';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ReadBookingsQueryDto } from './dto/read-bookings-query.dto';

@Controller('bookings')
@UseGuards(CurrentUserGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: UserEntity,
  ) {
    const data = await this.bookingsService.create(dto, user);
    return formatResponse<
      CreateBookingDto,
      BookingEntity,
      undefined
    >({
      status: 'success',
      statusCode: 200,
      message: 'Booking created successfully.',
      data,
    });
  }

  @Get('export')
  async exportCsv(@CurrentUser() user: UserEntity, @Res() res: Response) {
    const csv = await this.bookingsService.exportBookingsCsv(user);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
    res.send(csv);
  }

  @Get()
  async findAll(@Query() query: ReadBookingsQueryDto) {
    const result = await this.bookingsService.findAll(query);
    return formatResponse<
      ReadBookingsQueryDto,
      BookingEntity[],
      PaginationMeta
    >({
      status: 'success',
      statusCode: 200,
      message: 'Read bookings success.',
      data: result.data,
      meta: result.meta,
    });
  }

  @Get('grouped-by-user')
  @UseGuards(RolesGuard)
  @Roles(Role.Owner, Role.Admin)
  async getGroupedByUser() {
    const data = await this.bookingsService.getGroupedByUser();
    return formatResponse<
      void,
      Record<string, BookingEntity[]>,
      undefined
    >({
      status: 'success',
      statusCode: 200,
      message: 'Read bookings grouped by user success.',
      data,
    });
  }

  @Get('summary')
  @UseGuards(RolesGuard)
  @Roles(Role.Owner, Role.Admin)
  async getSummary() {
    const data = await this.bookingsService.getSummary();
    return formatResponse<
      void,
      { totalBookings: number; byUser: { userId: string; count: number }[] },
      undefined
    >({
      status: 'success',
      statusCode: 200,
      message: 'Read bookings summary success.',
      data,
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    await this.bookingsService.delete(id, user);
    return formatResponse<{ id: string }, { ok: boolean }, undefined>({
      status: 'success',
      statusCode: 200,
      message: 'Booking deleted successfully.',
      data: { ok: true },
    });
  }
}
