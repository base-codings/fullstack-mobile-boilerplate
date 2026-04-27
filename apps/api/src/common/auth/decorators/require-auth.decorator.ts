import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { NotImplementedAuthGuard } from '../not-implemented-auth.guard';

/**
 * Marks a controller class or route handler as requiring authentication.
 *
 * Currently wired to NotImplementedAuthGuard which throws 501.
 * Replace by swapping the guard to a real JWT/session implementation.
 *
 * Red Team #7: Applying this decorator makes the auth requirement explicit
 * in code rather than relying on "global guard by default" behaviour.
 *
 * @example
 * @RequireAuth()
 * @Post('profile')
 * updateProfile(@Body() dto: UpdateProfileDto) { ... }
 */
export const RequireAuth = () =>
  applyDecorators(UseGuards(NotImplementedAuthGuard), ApiBearerAuth());
