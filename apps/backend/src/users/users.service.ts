import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../database/schemas/user.schema';
import { Role } from '../common/roles.enum';
import type { UserEntity } from '../common/user.entity';
import {
  buildPaginationMeta,
  type PaginationMeta,
  paginationDefaults,
} from '../common/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import type { ReadUsersQueryDto } from './dto/read-users-query.dto';

const SORT_FIELDS: Record<string, string> = {
  name: 'name',
  role: 'role',
  createdAt: 'createdAt',
};

function toUserEntity(doc: UserDocument | { _id: Types.ObjectId; name: string; role: string }): UserEntity {
  return {
    id: doc._id.toString(),
    name: doc.name,
    role: doc.role as Role,
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async seedDefaultAdmin(): Promise<UserEntity> {
    const count = await this.userModel.countDocuments().exec();
    if (count > 0) {
      throw new BadRequestException('Seed already run. Users exist.');
    }
    return this.create({ name: 'Default Admin', role: Role.Admin });
  }

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const nameTrimmed = dto.name?.trim() ?? '';
    if (!nameTrimmed) {
      throw new BadRequestException('Name is required.');
    }
    const existing = await this.userModel
      .findOne({ name: { $regex: new RegExp(`^${nameTrimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } })
      .lean()
      .exec();
    if (existing) {
      throw new BadRequestException('A user with this name already exists.');
    }
    const doc = await this.userModel.create({ name: nameTrimmed, role: dto.role });
    return toUserEntity(doc);
  }

  async findAll(
    query: ReadUsersQueryDto,
  ): Promise<{ data: UserEntity[]; meta: PaginationMeta }> {
    const page = Math.max(1, query.page ?? paginationDefaults.page);
    const limit = Math.min(
      Math.max(1, query.limit ?? paginationDefaults.limit),
      paginationDefaults.maxLimit,
    );
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.role) {
      filter.role = query.role;
    }
    if (query.search?.trim()) {
      filter.name = { $regex: query.search.trim(), $options: 'i' };
    }

    const sortField = SORT_FIELDS[query.sortBy ?? 'name'] ?? 'name';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [data, total] = await Promise.all([
      this.userModel.find(filter).sort(sort).skip(skip).limit(limit).lean().exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const entities = (data as any[]).map((d) =>
      toUserEntity({ _id: d._id, name: d.name, role: d.role }),
    );
    const meta = buildPaginationMeta(page, limit, total);
    return { data: entities, meta };
  }

  async findOne(id: string): Promise<UserEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.userModel.findById(id).lean().exec();
    if (!doc) return null;
    return toUserEntity(doc as any);
  }

  async updateRole(id: string, role: Role): Promise<UserEntity> {
    const doc = await this.userModel
      .findByIdAndUpdate(id, { role }, { new: true })
      .exec();
    if (!doc) throw new NotFoundException('User not found');
    return toUserEntity(doc);
  }

  async delete(id: string): Promise<void> {
    const doc = await this.userModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('User not found');
  }

  /** All users for CSV export (admin only). */
  async getForExport(): Promise<UserEntity[]> {
    const docs = await this.userModel
      .find()
      .sort({ name: 1 })
      .limit(10_000)
      .lean()
      .exec();
    return (docs as any[]).map((d) =>
      toUserEntity({ _id: d._id, name: d.name, role: d.role }),
    );
  }

  /** CSV string for export: Name, Role. */
  async exportUsersCsv(): Promise<string> {
    const rows = await this.getForExport();
    const escape = (v: string) =>
      `"${String(v).replace(/"/g, '""')}"`;
    const header = ['Name', 'Role'];
    const dataRows = rows.map((r) => [
      escape(r.name),
      escape(r.role),
    ]);
    return [header.map(escape), ...dataRows]
      .map((row) => row.join(','))
      .join('\n');
  }
}
