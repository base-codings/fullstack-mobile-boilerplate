import { z } from 'zod';

/**
 * Base env schema. DATABASE_URL is conditionally required: if SKIP_DB is 'true'
 * (OpenAPI codegen path; see tools/codegen/export-openapi.ts), DATABASE_URL
 * may be absent or stub, otherwise it's required.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    API_PREFIX: z.string().default('api'),
    /**
     * Comma-separated list of allowed CORS origins.
     * Empty string = deny all. Use exact origins only (no wildcards when credentials=true).
     * Example: "http://localhost:3000,https://app.example.com"
     */
    CORS_ORIGINS: z.string().default(''),
    LOG_LEVEL: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'])
      .default('debug'),
    /**
     * Opt-in Swagger UI for non-development environments.
     * In development, Swagger is always enabled regardless of this flag.
     */
    ENABLE_SWAGGER: z.enum(['true', 'false']).optional(),

    // --- Database (Phase 03) ---
    /**
     * Postgres connection string. Pooled (PgBouncer, port 6543) recommended.
     * Required unless SKIP_DB === 'true'.
     */
    DATABASE_URL: z.string().optional(),
    /**
     * Direct Postgres connection (port 5432) for migrations.
     */
    DIRECT_URL: z.string().optional(),
    /**
     * Skip Prisma $connect on startup. Used by OpenAPI codegen path.
     */
    SKIP_DB: z.enum(['true', 'false']).optional(),

    /**
     * Trust proxy hop count. Set to 1 if behind one LB (typical: ALB, Cloudflare).
     * Set to N for N proxy hops. Leave 0 in dev or when directly exposed.
     * Affects: req.ip resolution → throttler keying, log correlation.
     */
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),

    /**
     * Maximum JSON/urlencoded body size. DoS hardening.
     * For file uploads, use multer per-route instead of bumping this.
     * Format: '100kb', '1mb', '10mb'.
     */
    BODY_LIMIT: z.string().default('1mb'),
  })
  .superRefine((data, ctx) => {
    if (data.SKIP_DB !== 'true' && (!data.DATABASE_URL || data.DATABASE_URL.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['DATABASE_URL'],
        message: 'DATABASE_URL is required unless SKIP_DB="true"',
      });
    }
  });

// Backwards-compatible alias for code already importing baseEnvSchema.
export const baseEnvSchema = envSchema;

export type AppEnv = z.infer<typeof envSchema>;

/**
 * Validation function for NestJS ConfigModule.
 * Throws with details if env is invalid — app fails fast on startup.
 */
export function validateEnv(config: Record<string, unknown>): AppEnv {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.format();
    throw new Error(`Environment validation failed:\n${JSON.stringify(formatted, null, 2)}`);
  }
  return result.data;
}
