import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Request } from 'express';

export const SKIP_TRANSFORM_KEY = 'skipTransform';

/**
 * Decorator to opt out of the standard response envelope on a per-handler basis.
 * Use on controllers or individual route methods when you need raw response control
 * (e.g., streaming, file downloads, redirects).
 *
 * @example
 * @Get('download')
 * @SkipTransform()
 * downloadFile() { ... }
 */
export const SkipTransform = (): MethodDecorator & ClassDecorator =>
  SetMetadata(SKIP_TRANSFORM_KEY, true);

interface StandardResponse<T> {
  data: T;
  meta: Record<string, unknown>;
  requestId: string;
}

/**
 * Wraps every successful response in the standard envelope:
 * { data, meta: {}, requestId }
 *
 * Skip wrapping by applying @SkipTransform() to the controller class or handler.
 * Red Team #3: All controllers MUST declare @ApiStandardResponse, not raw @ApiOkResponse.
 */
@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<StandardResponse<T>> {
    const shouldSkip = this.reflector.getAllAndOverride<boolean>(
      SKIP_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (shouldSkip) {
      // Return stream as-is when @SkipTransform() is applied
      return next.handle() as unknown as Observable<StandardResponse<T>>;
    }

    const request = context.switchToHttp().getRequest<Request & { id?: string }>();
    const requestId = request.id ?? 'unknown';

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {},
        requestId,
      })),
    );
  }
}
