// Inject env BEFORE imports — same pattern as the codegen export script.
// AppModule's ConfigModule validates env at module load time.
process.env.SKIP_DB = 'true';
process.env.DATABASE_URL ??= 'postgresql://stub:stub@localhost:5432/stub';
process.env.NODE_ENV ??= 'test';

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { bootstrapApp } from '../src/main';

describe('Hello (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    // Reuse the same wiring as production main.ts (helmet, prefix, swagger gate, etc.)
    await bootstrapApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/hello → 200 with envelope shape', async () => {
    const res = await request(app.getHttpServer()).get('/api/hello').expect(200);
    expect(res.body.data.message).toBe('Hello from NestJS');
    expect(res.body.data.timestamp).toBeDefined();
    expect(res.body.requestId).toMatch(/.+/);
    expect(res.body.meta).toBeDefined();
  });

  it('GET /api/hello respects @Public() (no 501 from NotImplementedAuthGuard)', async () => {
    await request(app.getHttpServer()).get('/api/hello').expect(200);
  });

  it('GET /api/health → 200 with status ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    // Health uses @SkipTransform — bare body, no envelope.
    expect(res.body.status).toBe('ok');
  });
});
