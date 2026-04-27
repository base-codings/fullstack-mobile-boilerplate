import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

/**
 * Applies all global wiring to the NestJS application instance.
 *
 * Extracted so that e2e tests can reuse IDENTICAL configuration:
 *   const app = moduleRef.createNestApplication<NestExpressApplication>({ bufferLogs: true });
 *   await bootstrapApp(app);
 *   await app.init();
 *
 * RT-6: bootstrapApp ensures test config == runtime config.
 */
export async function bootstrapApp(app: NestExpressApplication): Promise<void> {
  const config = app.get(AppConfig); // ★ M2: use typed wrapper

  // ★ H6: trust proxy BEFORE any middleware that reads req.ip
  if (config.trustProxy > 0) {
    app.set('trust proxy', config.trustProxy);
  }

  // ★ L5 (RT-1): explicit body-size limits via NestJS API.
  // Do NOT use raw `app.use(express.json(...))` — Nest auto-registers its own
  // body parsers; raw Express middleware double-parses or is overridden silently.
  app.useBodyParser('json', { limit: config.bodyLimit });
  app.useBodyParser('urlencoded', { extended: true, limit: config.bodyLimit });

  // ★ H5 (RT-3 / Q4): helmet CSP gated by NODE_ENV + Swagger flag.
  //   - dev:                    CSP disabled (fast iteration)
  //   - non-dev + Swagger ON:   CSP allowlist with 'unsafe-inline' for Swagger UI
  //                             (TRADE-OFF: weakens XSS protection — adopters MUST treat
  //                             ENABLE_SWAGGER=true in non-dev as short-term debug only,
  //                             never leave on in production. Documented in deployment.md.)
  //   - non-dev + Swagger OFF:  helmet defaults (strict CSP)
  const isDev = config.nodeEnv === 'development';
  app.use(
    helmet({
      contentSecurityPolicy: isDev
        ? false
        : config.isSwaggerEnabled
          ? {
              directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                'script-src': ["'self'", "'unsafe-inline'"],
                'img-src': ["'self'", 'data:', 'https:'],
              },
            }
          : undefined, // helmet defaults — strict CSP
      crossOriginEmbedderPolicy: config.isSwaggerEnabled ? false : undefined,
    }),
  );

  // ★ H4 (RT-2): setGlobalPrefix. The `exclude` is a defensive guard — Swagger mounts
  // as Express middleware (not a Nest controller route), so global prefix shouldn't
  // affect it in practice. Verify empirically post-deploy with:
  //   curl http://localhost:3000/api-docs        → 200 (Swagger UI)
  //   curl http://localhost:3000/api/api-docs    → 404 (no double-prefix)
  // If the exclude turns out unnecessary, drop it in a follow-up.
  const apiPrefix = config.apiPrefix;
  app.setGlobalPrefix(apiPrefix, {
    exclude: [`${apiPrefix}-docs`, `${apiPrefix}-docs/json`],
  });

  // ★ C4: CORS — callback(null, false) instead of new Error → graceful reject
  const origins = config.corsOrigins;
  if (origins.length > 0) {
    app.enableCors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) {
          callback(null, true); // non-browser clients
          return;
        }
        callback(null, origins.includes(requestOrigin));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    });
  }

  // ★ M6: graceful shutdown for k8s/docker SIGTERM
  app.enableShutdownHooks();

  // Swagger gating (unchanged)
  if (config.isSwaggerEnabled) {
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
    SwaggerModule.setup(`${apiPrefix}-docs`, app, document, {
      jsonDocumentUrl: `${apiPrefix}-docs/json`,
    });
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  await bootstrapApp(app);

  const port = app.get(AppConfig).port;
  await app.listen(port);
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
