import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

import type { AppEnv } from '../../config/env.schema';

/**
 * PrismaService extends PrismaClient and binds its lifecycle to NestJS.
 *
 * SKIP_DB=true short-circuits $connect/$disconnect so the app can boot without
 * a database (used by tools/codegen/export-openapi.ts to dump OpenAPI spec).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: ConfigService<AppEnv, true>) {
    super({
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    if (this.isSkipped()) {
      this.logger.warn('SKIP_DB=true — Prisma $connect skipped');
      return;
    }
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.isSkipped()) return;
    await this.$disconnect();
  }

  private isSkipped(): boolean {
    return this.config.get('SKIP_DB', { infer: true }) === 'true';
  }
}
