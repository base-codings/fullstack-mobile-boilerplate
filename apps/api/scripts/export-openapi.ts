//
// Export the live OpenAPI spec from the NestJS app to tools/codegen/openapi.json.
// Run via `pnpm codegen:api` (which calls tools/codegen/generate-api-client.cjs).
//
// Lives inside apps/api/ so ts-node + Node module resolution can find
// @nestjs/* deps (workspace devDeps, not hoisted to repo root).
//
// Why we set env BEFORE imports:
//   ConfigModule validates env at module load time. AppModule imports
//   ConfigModule at the top, so we need DATABASE_URL/SKIP_DB resolved
//   before ts-node evaluates the AppModule import.
//
// SKIP_DB=true short-circuits PrismaService.$connect.

process.env.SKIP_DB = 'true';
process.env.DATABASE_URL ??= 'postgresql://stub:stub@localhost:5432/stub';
process.env.NODE_ENV ??= 'development';
process.env.ENABLE_SWAGGER = 'true';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { AppModule } from '../src/app.module';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Mobile Boilerplate API')
    .setDescription('Generated OpenAPI spec — feeds the Dart api_client codegen.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // apps/api/scripts/ → ../../../tools/codegen/openapi.json (repo-rooted)
  const out = resolve(__dirname, '..', '..', '..', 'tools', 'codegen', 'openapi.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(document, null, 2));

  await app.close();

  console.log(`✓ Exported OpenAPI spec to ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
