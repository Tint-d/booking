import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from '../common/roles.enum';
import { UserEntity } from '../common/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly users = new Map<string, UserEntity>();

  seedDefaultAdmin(): UserEntity {
    if (this.users.size > 0) {
      throw new BadRequestException('Seed already run. Users exist.');
    }
    return this.create({ name: 'Default Admin', role: Role.Admin });
  }

  create(dto: CreateUserDto): UserEntity {
    const id = randomUUID();
    const user: UserEntity = {
      id,
      name: dto.name,
      role: dto.role,
    };
    this.users.set(id, user);
    return user;
  }

  findAll(): UserEntity[] {
    return Array.from(this.users.values());
  }

  findOne(id: string): UserEntity | undefined {
    return this.users.get(id);
  }

  updateRole(id: string, role: Role): UserEntity {
    const user = this.users.get(id);
    if (!user) throw new NotFoundException('User not found');
    user.role = role;
    return user;
  }

  delete(id: string): void {
    if (!this.users.has(id)) throw new NotFoundException('User not found');
    this.users.delete(id);
  }
}
