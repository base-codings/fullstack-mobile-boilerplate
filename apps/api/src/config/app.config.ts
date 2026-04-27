import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from './env.schema';

/**
 * Typed wrapper around NestJS ConfigService.
 * Provides typed getters for each env variable defined in baseEnvSchema.
 * Inject this service instead of raw ConfigService for type safety.
 */
@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  get nodeEnv(): AppEnv['NODE_ENV'] {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.config.get('PORT', { infer: true });
  }

  get apiPrefix(): string {
    return this.config.get('API_PREFIX', { infer: true });
  }

  get corsOrigins(): string[] {
    const raw = this.config.get('CORS_ORIGINS', { infer: true });
    if (!raw || raw.trim() === '') return [];
    return raw.split(',').map((o) => o.trim()).filter(Boolean);
  }

  get logLevel(): AppEnv['LOG_LEVEL'] {
    return this.config.get('LOG_LEVEL', { infer: true });
  }

  get isSwaggerEnabled(): boolean {
    const nodeEnv = this.nodeEnv;
    const enableSwagger = this.config.get('ENABLE_SWAGGER', { infer: true });
    return nodeEnv === 'development' || enableSwagger === 'true';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }
}
