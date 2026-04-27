import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { AppEnv } from './config/env.schema';

/**
 * Applies all global wiring to the NestJS application instance.
 *
 * Extracted so that e2e tests can reuse IDENTICAL configuration:
 *   const app = await Test.createTestingModule({ imports: [AppModule] }).compile();
 *   const nestApp = app.createNestApplication();
 *   await bootstrapApp(nestApp);
 *   await nestApp.init();
 *
 * Red Team #3: bootstrapApp ensures test config == runtime config.
 */
export async function bootstrapApp(app: INestApplication): Promise<void> {
  const config = app.get(ConfigService<AppEnv, true>);

  const nodeEnv = config.get('NODE_ENV', { infer: true });
  const apiPrefix = config.get('API_PREFIX', { infer: true });
  const corsOriginsRaw = config.get('CORS_ORIGINS', { infer: true });
  const enableSwagger = config.get('ENABLE_SWAGGER', { infer: true });

  // Security: helmet sets sensible HTTP headers — ON by default, Red Team #6
  app.use(helmet());

  // API prefix (e.g. /api/hello, /api/health)
  app.setGlobalPrefix(apiPrefix);

  // CORS: parse CSV → array of exact origins
  // Red Team #2: reject '*' — wildcards with credentials are a security hazard.
  // Native mobile clients don't need CORS; enable only for web debug origins.
  const origins = corsOriginsRaw
    ? corsOriginsRaw.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  if (origins.length > 0) {
    app.enableCors({
      origin: (requestOrigin, callback) => {
        // Allow non-browser requests (native mobile, Postman, server-to-server)
        if (!requestOrigin) {
          callback(null, true);
          return;
        }
        if (origins.includes(requestOrigin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin '${requestOrigin}' not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    });
  }

  // Swagger: gate by NODE_ENV === 'development' OR explicit ENABLE_SWAGGER=true
  // Validation #4 / Red Team #6: NOT auto-enabled in staging/production
  const isSwaggerEnabled =
    nodeEnv === 'development' || enableSwagger === 'true';

  if (isSwaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Mobile Boilerplate API')
      .setDescription(
        'NestJS monolith API for the mobile-boilerplate monorepo. ' +
          'All successful responses are wrapped in { data, meta, requestId }.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    // UI at /api-docs, JSON spec at /api-docs/json
    SwaggerModule.setup(`${apiPrefix}-docs`, app, document, {
      jsonDocumentUrl: `${apiPrefix}-docs/json`,
    });
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Buffer logs until Pino logger is attached — prevents lost startup logs
    bufferLogs: true,
  });

  // Attach the Pino logger for all NestJS internal logs
  app.useLogger(app.get(Logger));

  await bootstrapApp(app);

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
