import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class CurrentUserGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { 'x-user-id'?: string };
      user?: unknown;
    }>();
    const userId = request.headers['x-user-id'];
    if (!userId) throw new UnauthorizedException('X-User-Id header required');
    const user = await this.usersService.findOne(userId);
    if (!user) throw new UnauthorizedException('User not found');
    request.user = user;
    return true;
  }
}
