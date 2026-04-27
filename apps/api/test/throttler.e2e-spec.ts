// Set env vars BEFORE any imports so AppModule / ConfigService picks them up
process.env.SKIP_DB = 'true';
process.env.DATABASE_URL ??= 'postgresql://stub:stub@localhost:5432/stub';
process.env.NODE_ENV ??= 'test';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { bootstrapApp } from '../src/main';

describe('Throttler (e2e, isolated)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const ref = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = ref.createNestApplication<NestExpressApplication>({ bufferLogs: true });
    await bootstrapApp(app);
    await app.init();
  });

  afterAll(async () => app.close());

  it('returns 429 envelope after exceeding 100 req/min on /api/hello', async () => {
    let last: request.Response | undefined;
    for (let i = 0; i < 105; i++) {
      last = await request(app.getHttpServer()).get('/api/hello');
      if (last.status === 429) break;
    }
    expect(last?.status).toBe(429);
    expect(last?.body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(last?.body.requestId).toMatch(/.+/);
  });
});
