import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';
import { safeQueryString } from '../utils/safe-url';

/**
 * Logs controller-level request/response duration.
 * pino-http handles raw HTTP layer; this interceptor logs at the NestJS handler level
 * (after guards, pipes, interceptors — closer to business logic timing).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger(LoggingInterceptor.name)
    private readonly logger: PinoLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { id?: string }>();

    const method = request.method;
    const url = safeQueryString(request.url);
    const requestId = request.id ?? 'unknown';
    const start = Date.now();

    const className = context.getClass().name;
    const handlerName = context.getHandler().name;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.debug(
            {
              requestId,
              method,
              url,
              handler: `${className}.${handlerName}`,
              durationMs: duration,
            },
            'Request handled',
          );
        },
        error: (err: unknown) => {
          const duration = Date.now() - start;
          this.logger.warn(
            {
              requestId,
              method,
              url,
              handler: `${className}.${handlerName}`,
              durationMs: duration,
              err,
            },
            'Request failed',
          );
        },
      }),
    );
  }
}
