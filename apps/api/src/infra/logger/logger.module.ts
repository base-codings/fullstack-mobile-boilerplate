import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { AppEnv } from '../../config/env.schema';
import { safeQueryString } from '../../common/utils/safe-url';

/** PII fields to redact from all pino log entries. Red Team #9. */
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.token',
  'req.body.refreshToken',
  '*.email',
  'res.headers["set-cookie"]',
];

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnv, true>) => {
        const nodeEnv = config.get('NODE_ENV', { infer: true });
        const logLevel = config.get('LOG_LEVEL', { infer: true });

        const isTest = nodeEnv === 'test';
        const isProduction = nodeEnv === 'production';

        return {
          pinoHttp: {
            // Silence logs completely during test runs to avoid noise
            level: isTest ? 'silent' : logLevel,

            // Red Team #9: redact sensitive fields before they hit log output
            redact: {
              paths: REDACT_PATHS,
              censor: '[REDACTED]',
            },

            // Attach requestId to every log entry for correlation
            genReqId: (req: { headers: Record<string, string | string[] | undefined> }) => {
              const existing = req.headers['x-request-id'] ?? req.headers['x-correlation-id'];
              if (existing && typeof existing === 'string') return existing;
              // Use crypto.randomUUID() available in Node 20+
              return crypto.randomUUID();
            },

            // Production: structured JSON only (no pretty-print overhead)
            ...(isProduction || isTest
              ? {}
              : {
                  transport: {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      translateTime: 'SYS:standard',
                      ignore: 'pid,hostname',
                    },
                  },
                }),

            // Normalize req/res serialization — url passes through safeQueryString
            // to prevent PII/token leaks in auto-logged pino-http entries (H2).
            serializers: {
              req(req: { method: string; url: string; id: string }) {
                return { method: req.method, url: safeQueryString(req.url), id: req.id };
              },
              res(res: { statusCode: number }) {
                return { statusCode: res.statusCode };
              },
            },
          },
        };
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
