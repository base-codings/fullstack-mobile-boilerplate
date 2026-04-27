import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { LoggerModule } from './infra/logger/logger.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { NotImplementedAuthGuard } from './common/auth/not-implemented-auth.guard';
import { HelloModule } from './modules/hello/hello.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Global config — isGlobal: true in ConfigModule.forRoot
    AppConfigModule,
    // Pino structured logger
    LoggerModule,
    // Prisma — global, SKIP_DB-aware
    PrismaModule,
    // Rate limiting — Red Team #6: ON by default, not optional
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1 minute window in ms
        limit: 100, // max 100 requests per window per IP
      },
    ]),
    // Feature modules
    HelloModule,
    HealthModule,
  ],
  providers: [
    // Global ValidationPipe via APP_PIPE — applies in tests automatically (no bootstrapApp needed)
    // Red Team #8: whitelist + forbidNonWhitelisted prevents unknown field injection
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // strip unknown properties
        forbidNonWhitelisted: true, // reject body with extra properties (HTTP 400)
        // forbidUnknownValues removed — known footgun with nested DTOs missing @Type()
        // see: https://github.com/nestjs/nest/issues/9759
        transform: true,
        transformOptions: {
          // Explicit: no implicit type coercion — prevents "123" being cast to number silently
          enableImplicitConversion: false,
        },
      }),
    },
    // Default-deny auth guard — Red Team #7
    {
      provide: APP_GUARD,
      useClass: NotImplementedAuthGuard,
    },
    // Rate limiting guard — Red Team #6
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global exception → error envelope formatter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Per-request timing logs
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Wrap successful responses in { data, meta, requestId }
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class AppModule {}
