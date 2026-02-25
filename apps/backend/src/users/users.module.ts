import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CurrentUserGuard } from '../common/current-user.guard';
import { BookingsModule } from '../bookings/bookings.module';
import { User, UserSchema } from '../database/schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => BookingsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, CurrentUserGuard],
  exports: [UsersService, CurrentUserGuard],
})
export class UsersModule {}
