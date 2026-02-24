import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from '../bookings/bookings.service';
import { CurrentUserGuard } from '../common/current-user.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { RolesGuard } from '../common/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Get('for-login')
  listForLogin() {
    return this.usersService.findAll();
  }

  @Post('seed')
  seed() {
    return this.usersService.seedDefaultAdmin();
  }

  @Post()
  @UseGuards(CurrentUserGuard, RolesGuard)
  @Roles(Role.Admin)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @UseGuards(CurrentUserGuard, RolesGuard)
  @Roles(Role.Admin)
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  @UseGuards(CurrentUserGuard, RolesGuard)
  @Roles(Role.Admin)
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }

  @Delete(':id')
  @UseGuards(CurrentUserGuard, RolesGuard)
  @Roles(Role.Admin)
  delete(@Param('id') id: string) {
    this.bookingsService.deleteAllByUserId(id);
    this.usersService.delete(id);
    return { ok: true };
  }
}
