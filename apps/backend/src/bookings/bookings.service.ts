import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BookingEntity } from '../common/booking.entity';
import { Role } from '../common/roles.enum';
import { UserEntity } from '../common/user.entity';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  private readonly bookings = new Map<string, BookingEntity>();

  create(dto: CreateBookingDto, user: UserEntity): BookingEntity {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601.');
    }
    if (start >= end) {
      throw new BadRequestException('startTime must be before endTime');
    }
    const overlapping = this.findOverlapping(start, end);
    if (overlapping.length > 0) {
      throw new BadRequestException(
        `Booking overlaps with existing booking(s)`,
      );
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    const booking: BookingEntity = {
      id,
      userId: user.id,
      startTime: dto.startTime,
      endTime: dto.endTime,
      createdAt: now,
    };
    this.bookings.set(id, booking);
    return booking;
  }

  findAll(): BookingEntity[] {
    return Array.from(this.bookings.values());
  }

  findOne(id: string): BookingEntity | undefined {
    return this.bookings.get(id);
  }

  delete(id: string, user: UserEntity): void {
    const booking = this.bookings.get(id);
    if (!booking) throw new NotFoundException('Booking not found');
    if (user.role === Role.User && booking.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own bookings');
    }
    this.bookings.delete(id);
  }

  deleteAllByUserId(userId: string): void {
    for (const [id, b] of this.bookings) {
      if (b.userId === userId) this.bookings.delete(id);
    }
  }

  getGroupedByUser(): Record<string, BookingEntity[]> {
    const grouped: Record<string, BookingEntity[]> = {};
    for (const b of this.bookings.values()) {
      if (!grouped[b.userId]) grouped[b.userId] = [];
      grouped[b.userId].push(b);
    }
    return grouped;
  }

  getSummary(): {
    totalBookings: number;
    byUser: { userId: string; count: number }[];
  } {
    const byUser = new Map<string, number>();
    for (const b of this.bookings.values()) {
      byUser.set(b.userId, (byUser.get(b.userId) ?? 0) + 1);
    }
    return {
      totalBookings: this.bookings.size,
      byUser: Array.from(byUser.entries()).map(([userId, count]) => ({
        userId,
        count,
      })),
    };
  }

  private findOverlapping(
    start: Date,
    end: Date,
    excludeId?: string,
  ): BookingEntity[] {
    const result: BookingEntity[] = [];
    for (const b of this.bookings.values()) {
      if (excludeId && b.id === excludeId) continue;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      if (start < bEnd && end > bStart) result.push(b);
    }
    return result;
  }
}
