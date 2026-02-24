import { Module, forwardRef } from '@nestjs/common';
import { CurrentUserGuard } from '../common/current-user.guard';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [forwardRef(() => BookingsModule)],
  controllers: [UsersController],
  providers: [UsersService, CurrentUserGuard],
  exports: [UsersService, CurrentUserGuard],
})
export class UsersModule {}
