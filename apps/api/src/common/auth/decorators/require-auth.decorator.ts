import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const REQUIRES_AUTH_KEY = 'requiresAuth';

/**
 * Marks a controller class or route handler as requiring authentication.
 *
 * MARKER-ONLY: this decorator only sets metadata. The active global AuthGuard
 * (e.g. NotImplementedAuthGuard, or your real JwtAuthGuard) reads the metadata
 * and decides enforcement.
 *
 * Pattern: swap `useClass: NotImplementedAuthGuard` in app.module.ts to a real
 * guard — every route already decorated with @RequireAuth() will be enforced
 * automatically. No code edits needed elsewhere.
 *
 * @example
 * @RequireAuth()
 * @Post('profile')
 * updateProfile(@Body() dto: UpdateProfileDto) { ... }
 */
export const RequireAuth = () =>
  applyDecorators(SetMetadata(REQUIRES_AUTH_KEY, true), ApiBearerAuth());
