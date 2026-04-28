import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
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
  // Output is routed through nestjs-pino via app.useLogger() in main.ts.
  private readonly logger = new Logger(LoggingInterceptor.name);

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
            `Request handled ${method} ${url} ${className}.${handlerName} ${duration}ms requestId=${requestId}`,
          );
        },
        error: (err: unknown) => {
          const duration = Date.now() - start;
          const errMsg = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Request failed ${method} ${url} ${className}.${handlerName} ${duration}ms requestId=${requestId} err=${errMsg}`,
          );
        },
      }),
    );
  }
}
