import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

/**
 * Swagger decorator that correctly describes the standard response envelope:
 * { data: T, meta: {}, requestId: string }
 *
 * Red Team #3: ALL controllers MUST use this decorator instead of raw @ApiOkResponse({ type }).
 * Using raw @ApiOkResponse would omit the envelope wrapper from the generated OpenAPI spec,
 * breaking SDK codegen contracts.
 *
 * @param model - The DTO class that populates the `data` field
 *
 * @example
 * @Get()
 * @ApiStandardResponse(HelloResponseDto)
 * getHello(): Promise<HelloResponseDto> { ... }
 */
export const ApiStandardResponse = <T extends Type<unknown>>(model: T) =>
  applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
              meta: {
                type: 'object',
                description: 'Response metadata (pagination, counts, etc.)',
                additionalProperties: true,
              },
              requestId: {
                type: 'string',
                description: 'Correlation ID for tracing',
                example: '550e8400-e29b-41d4-a716-446655440000',
              },
            },
            required: ['data', 'meta', 'requestId'],
          },
        ],
      },
    }),
  );
