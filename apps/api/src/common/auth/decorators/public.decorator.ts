import { SetMetadata } from '@nestjs/common';

/** Metadata key used by NotImplementedAuthGuard to identify public routes. */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a controller class or route handler as publicly accessible —
 * the global NotImplementedAuthGuard (and any real AuthGuard replacing it)
 * will skip authentication for decorated routes.
 *
 * Red Team #7: Every endpoint MUST have either @Public() or @RequireAuth().
 * No unannotated routes should exist.
 *
 * @example
 * @Public()
 * @Get('health')
 * getHealth() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
