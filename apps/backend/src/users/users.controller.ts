import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { BookingsService } from '../bookings/bookings.service';
import { CurrentUserGuard } from '../common/current-user.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/roles.enum';
import { RolesGuard } from '../common/roles.guard';
import { formatResponse } from '../common/response.types';
import type { UserEntity } from '../common/user.entity';
import type { PaginationMeta } from '../common/pagination.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UsersService } from './users.service';
import { ReadUsersQueryDto } from './dto/read-users-query.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Get('for-login')
  async listForLogin() {
    const result = await this.usersService.findAll({
      page: 1,
      limit: 1000,
    } as ReadUsersQueryDto);
    return result.data;
  }

  @Post('seed')
  async seed() {
    const data = await this.usersService.seedDefaultAdmin();
    return formatResponse<void, UserEntity, undefined>({
      status: 'success',
      statusCode: 200,
      message: 'Default admin user created.',
      data,
    });
  }

  @Post()
  @UseGuards(CurrentUserGuard, RolesGuard)
  @Roles(Role.Admin)
  async create(@Body() dto: CreateUserDto) {
    const data = await this.usersService.create(dto);
    return formatResponse<CreateUserDto, UserEntity, undefined>({
      status: 'success',
      statusCode: 200,
      message: 'User created successfully.',
      data,
    });
  }

  @Get('export')
  @UseGuards(CurrentUserGuard, RolesGuard)
  @Roles(Role.Admin)
  async exportCsv(@Res() res: Response) {
    const csv = await this.usersService.exportUsersCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(csv);
  }

  @Get()
  @UseGuards(CurrentUserGuard, RolesGuard)
  @Roles(Role.Admin)
  async findAll(@Query() query: ReadUsersQueryDto) {
    const result = await this.usersService.findAll(query);
    return formatResponse<ReadUsersQueryDto, UserEntity[], PaginationMeta>({
      status: 'success',
      statusCode: 200,
      message: 'Read users success.',
      data: result.data,
      meta: result.meta,
    });
  }

  @Patch(':id/role')
  @UseGuards(CurrentUserGuard, RolesGuard)
  @Roles(Role.Admin)
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const data = await this.usersService.updateRole(id, dto.role);
    return formatResponse<UpdateRoleDto, UserEntity, undefined>({
      status: 'success',
      statusCode: 200,
      message: 'User role updated successfully.',
      data,
    });
  }

  @Delete(':id')
  @UseGuards(CurrentUserGuard, RolesGuard)
  @Roles(Role.Admin)
  async delete(@Param('id') id: string) {
    await this.bookingsService.deleteAllByUserId(id);
    await this.usersService.delete(id);
    return formatResponse<{ id: string }, { ok: boolean }, undefined>({
      status: 'success',
      statusCode: 200,
      message: 'User deleted successfully.',
      data: { ok: true },
    });
  }
}
