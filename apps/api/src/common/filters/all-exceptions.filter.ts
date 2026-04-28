import { randomUUID } from 'node:crypto';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { Request } from 'express';

interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

/**
 * Catches all exceptions and normalises them into a consistent error envelope:
 * { error: { code, message, details? }, requestId }
 *
 * Security note: stack traces are logged internally via Pino but NEVER sent to client.
 */
@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  // Output is routed through nestjs-pino because main.ts calls
  // app.useLogger(app.get(Logger from 'nestjs-pino')). No PinoLogger named-token
  // injection needed (nestjs-pino v4 doesn't auto-register PinoLogger:Context).
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    // Extract requestId: pino-http sets req.id after genReqId runs, but early-stage
    // exceptions (e.g. throttler 429) may fire before pino-http middleware runs.
    // Fallback chain: req.id → x-request-id header → fresh UUID (never 'unknown').
    const headerRequestId = request.headers['x-request-id'];
    const requestId =
      (request as Request & { id?: string }).id ??
      (typeof headerRequestId === 'string' ? headerRequestId : undefined) ??
      randomUUID();

    let statusCode: number;
    let errorCode: string;
    let message: string;
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null) {
        const r = response as Record<string, unknown>;
        message = typeof r['message'] === 'string' ? r['message'] : exception.message;
        details = Array.isArray(r['message']) ? r['message'] : undefined;
      } else {
        message = typeof response === 'string' ? response : exception.message;
      }

      errorCode = this.httpStatusToCode(statusCode);
    } else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'INTERNAL_SERVER_ERROR';
      message = 'An unexpected error occurred';

      // Log full error internally — never expose to client
      this.logger.error(`Unhandled exception requestId=${requestId}`, exception.stack);
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'INTERNAL_SERVER_ERROR';
      message = 'An unexpected error occurred';

      this.logger.error(`Unknown exception type requestId=${requestId}`, String(exception));
    }

    const responseBody: ErrorResponseBody = {
      error: {
        code: errorCode,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      requestId,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
  }

  private httpStatusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      408: 'REQUEST_TIMEOUT',
      409: 'CONFLICT',
      410: 'GONE',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      501: 'NOT_IMPLEMENTED',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };
    return map[status] ?? `HTTP_${status}`;
  }
}
