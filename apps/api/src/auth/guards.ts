import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  createParamDecorator,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Principal } from './jwt.types';

// Any valid JWT (user or admin).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Requires the principal to be an admin.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const principal = req.user as Principal | undefined;
    if (!principal || principal.type !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}

// Extracts the authenticated principal from the request.
export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Principal => {
    return ctx.switchToHttp().getRequest().user;
  },
);
