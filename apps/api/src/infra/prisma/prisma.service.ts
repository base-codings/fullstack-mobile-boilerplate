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
    // emit: 'stdout' (Option A) — Prisma errors/warns surface via Node stdout and
    // are visible in Docker/k8s log aggregation without requiring $on() subscribers.
    // Option B (structured $on events wired to Pino) is documented in code-standards.md
    // for adopters that need fully-structured DB log context in production.
    super({
      log: [
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
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
