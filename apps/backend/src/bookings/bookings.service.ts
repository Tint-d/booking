import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument } from '../database/schemas/booking.schema';
import { User, UserDocument } from '../database/schemas/user.schema';
import { Role } from '../common/roles.enum';
import type { UserEntity } from '../common/user.entity';
import type { BookingEntity } from '../common/booking.entity';
import {
  buildPaginationMeta,
  type PaginationMeta,
  paginationDefaults,
} from '../common/pagination.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import type { ReadBookingsQueryDto } from './dto/read-bookings-query.dto';

const SORT_FIELDS: Record<string, string> = {
  startTime: 'startTime',
  endTime: 'endTime',
  createdAt: 'createdAt',
  userId: 'userId',
};

function toBookingEntity(doc: {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  createdAt?: Date;
}): BookingEntity {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    startTime: doc.startTime instanceof Date ? doc.startTime.toISOString() : String(doc.startTime),
    endTime: doc.endTime instanceof Date ? doc.endTime.toISOString() : String(doc.endTime),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : (doc as any).createdAt ?? new Date().toISOString(),
  };
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateBookingDto, user: UserEntity): Promise<BookingEntity> {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601.');
    }
    if (start >= end) {
      throw new BadRequestException('startTime must be before endTime');
    }
    const overlapping = await this.findOverlapping(start, end);
    if (overlapping.length > 0) {
      throw new BadRequestException(
        `Booking overlaps with existing booking(s)`,
      );
    }
    const doc = await this.bookingModel.create({
      userId: new Types.ObjectId(user.id),
      startTime: start,
      endTime: end,
    });
    return toBookingEntity(doc as any);
  }

  async findAll(
    query: ReadBookingsQueryDto,
  ): Promise<{ data: BookingEntity[]; meta: PaginationMeta }> {
    const page = Math.max(1, query.page ?? paginationDefaults.page);
    const limit = Math.min(
      Math.max(1, query.limit ?? paginationDefaults.limit),
      paginationDefaults.maxLimit,
    );
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.userId) {
      filter.userId = new Types.ObjectId(query.userId);
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      const isObjectId = Types.ObjectId.isValid(search) && search.length === 24;
      const searchDate = new Date(search);

      // Search by booking ID
      if (isObjectId) {
        filter._id = new Types.ObjectId(search);
      }
      // Search by date/time – bookings that include that instant
      else if (!isNaN(searchDate.getTime())) {
        filter.startTime = { $lte: searchDate };
        filter.endTime = { $gte: searchDate };
      }
      // Otherwise, treat search as partial user name
      else {
        const users = await this.userModel
          .find({ name: { $regex: search, $options: 'i' } })
          .select('_id')
          .lean()
          .exec();
        const userIds = users.map((u) => u._id as Types.ObjectId);

        if (userIds.length === 0) {
          const meta = buildPaginationMeta(page, limit, 0);
          return { data: [], meta };
        }

        filter.userId = { $in: userIds };
      }
    }

    const sortField = SORT_FIELDS[query.sortBy ?? 'startTime'] ?? 'startTime';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [data, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.bookingModel.countDocuments(filter).exec(),
    ]);

    const entities = (data as any[]).map((d) => toBookingEntity(d));

    const meta = buildPaginationMeta(page, limit, total);
    return { data: entities, meta };
  }

  async findOne(id: string): Promise<BookingEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.bookingModel.findById(id).lean().exec();
    if (!doc) return null;
    return toBookingEntity(doc as BookingDocument);
  }

  async delete(id: string, user: UserEntity): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Booking not found');
    const doc = await this.bookingModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Booking not found');
    if (user.role === Role.User && doc.userId.toString() !== user.id) {
      throw new ForbiddenException('You can only delete your own bookings');
    }
    await this.bookingModel.findByIdAndDelete(id).exec();
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.bookingModel.deleteMany({ userId: new Types.ObjectId(userId) }).exec();
  }

  async getGroupedByUser(): Promise<Record<string, BookingEntity[]>> {
    const docs = await this.bookingModel.find().sort({ userId: 1, startTime: 1 }).lean().exec();
    const grouped: Record<string, BookingEntity[]> = {};
    for (const d of docs as any[]) {
      const uid = d.userId?.toString?.() ?? d.userId;
      if (!grouped[uid]) grouped[uid] = [];
      grouped[uid].push(toBookingEntity(d));
    }
    return grouped;
  }

  async getSummary(): Promise<{
    totalBookings: number;
    byUser: { userId: string; count: number }[];
  }> {
    const byUser = await this.bookingModel
      .aggregate<{ _id: Types.ObjectId; count: number }>([
        { $group: { _id: '$userId', count: { $sum: 1 } } },
      ])
      .exec();
    const total = await this.bookingModel.countDocuments().exec();
    return {
      totalBookings: total,
      byUser: byUser.map((x) => ({ userId: x._id.toString(), count: x.count })),
    };
  }

  /** All bookings the user can see (for CSV export). User role = own only; Owner/Admin = all. */
  async getForExport(user: UserEntity): Promise<BookingEntity[]> {
    const filter: Record<string, unknown> = {};
    if (user.role === Role.User) {
      filter.userId = new Types.ObjectId(user.id);
    }
    const limit = 10_000;
    const docs = await this.bookingModel
      .find(filter)
      .sort({ startTime: 1 })
      .limit(limit)
      .lean()
      .exec();
    return (docs as any[]).map((d) => toBookingEntity(d));
  }

  /** CSV string for export: ID, User, Start, End, Created (ISO dates). */
  async exportBookingsCsv(user: UserEntity): Promise<string> {
    const rows = await this.getForExport(user);
    const userIds = [...new Set(rows.map((r) => r.userId))].filter(
      (id) => Types.ObjectId.isValid(id),
    );
    const userDocs = await this.userModel
      .find({ _id: { $in: userIds.map((id) => new Types.ObjectId(id)) } })
      .select('_id name')
      .lean()
      .exec();
    const nameByUserId = new Map<string, string>();
    for (const u of userDocs as { _id: Types.ObjectId; name: string }[]) {
      nameByUserId.set(u._id.toString(), u.name);
    }
    const escape = (v: string) =>
      `"${String(v).replace(/"/g, '""')}"`;
    const header = ['ID', 'User', 'Start', 'End', 'Created'];
    const dataRows = rows.map((r) => [
      escape(r.id),
      escape(nameByUserId.get(r.userId) ?? r.userId),
      escape(r.startTime),
      escape(r.endTime),
      escape(r.createdAt),
    ]);
    return [header.map(escape), ...dataRows]
      .map((row) => row.join(','))
      .join('\n');
  }

  private async findOverlapping(
    start: Date,
    end: Date,
    excludeId?: string,
  ): Promise<BookingDocument[]> {
    const q: Record<string, unknown> = {
      startTime: { $lt: end },
      endTime: { $gt: start },
    };
    if (excludeId && Types.ObjectId.isValid(excludeId)) {
      q._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const docs = await this.bookingModel.find(q).exec();
    return docs as BookingDocument[];
  }
}
