import { Injectable } from '@nestjs/common';
import type { HelloResponseDto } from './dto/hello-response.dto';

/**
 * Stateless hello service — no dependencies, easy to test.
 * Phase 03 will add database-backed services as a reference pattern.
 */
@Injectable()
export class HelloService {
  getMessage(): HelloResponseDto {
    return {
      message: 'Hello from NestJS',
      timestamp: new Date().toISOString(),
    };
  }
}
