import { CanActivate, ExecutionContext, Injectable, NotImplementedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { REQUIRES_AUTH_KEY } from './decorators/require-auth.decorator';

/**
 * Default-deny auth guard. Reads metadata set by @Public() / @RequireAuth().
 *
 * Behavior:
 *   - @Public()      → allow
 *   - @RequireAuth() → throw 501 (real auth not wired yet)
 *   - no decorator   → throw 501 (default-deny: missing intent declaration)
 *
 * Migration: swap this guard's useClass in app.module.ts for a real JWT/session
 * guard. Replacement guard should follow the same metadata contract.
 */
@Injectable()
export class NotImplementedAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiresAuth = this.reflector.getAllAndOverride<boolean>(REQUIRES_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiresAuth) {
      throw new NotImplementedException(
        'Auth not configured. Replace NotImplementedAuthGuard with a real AuthGuard in app.module.ts.',
      );
    }

    throw new NotImplementedException(
      'Default-deny: route is missing @Public() or @RequireAuth() decorator. ' +
        'Every endpoint must declare its auth intent explicitly.',
    );
  }
}
