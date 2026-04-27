import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

/**
 * Default-deny auth guard — Red Team #7.
 *
 * Ships in the boilerplate as the global AUTH guard so that:
 * 1. No endpoint is accidentally left unauthenticated if a real guard is forgotten.
 * 2. Routes must explicitly opt in to public access via @Public().
 * 3. Routes that need real auth throw 501 until a proper AuthGuard is implemented.
 *
 * Migration path: replace this guard with a real JWT/session guard and keep
 * the @Public() / @RequireAuth() decorator contract intact.
 */
@Injectable()
export class NotImplementedAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check both handler-level and class-level @Public() metadata
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // No real auth configured — 501 is more honest than 401/403 here
    throw new NotImplementedException(
      'Auth not configured. Decorate the route with @Public() or implement a real AuthGuard.',
    );
  }
}
