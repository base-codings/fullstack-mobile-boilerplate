/* eslint-disable @typescript-eslint/no-floating-promises */
//
// Export the live OpenAPI spec from the NestJS app to tools/codegen/openapi.json.
// Run via `pnpm codegen:api` (which calls tools/codegen/generate-api-client.sh).
//
// Why we set env BEFORE imports:
//   ConfigModule validates env at module load time. AppModule imports
//   ConfigModule at the top, so we need DATABASE_URL/SKIP_DB resolved
//   before ts-node evaluates the AppModule import.
//
// SKIP_DB=true short-circuits PrismaService.$connect (see Phase 03).

process.env.SKIP_DB = 'true';
process.env.DATABASE_URL ??= 'postgresql://stub:stub@localhost:5432/stub';
process.env.NODE_ENV ??= 'development';
process.env.ENABLE_SWAGGER = 'true';

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { AppModule } from '../../apps/api/src/app.module';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Mobile Boilerplate API')
    .setDescription('Generated OpenAPI spec — feeds the Dart api_client codegen.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const out = resolve(__dirname, 'openapi.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(document, null, 2));

  await app.close();
  // eslint-disable-next-line no-console
  console.log(`✓ Exported OpenAPI spec to ${out}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
