import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/auth/decorators/public.decorator';
import { SkipTransform } from '../../common/interceptors/transform-response.interceptor';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

/**
 * Lightweight health check endpoint.
 *
 * - @Public(): no auth required for infra probes
 * - @SkipTransform(): k8s/LB probes expect bare JSON, not envelope
 * - @SkipThrottle(): LB probes can spam this every 5s without exhausting throttler budget
 *   (avoids cascading failures when TRUST_PROXY=0 and all probes share LB IP)
 */
@ApiTags('health')
@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  @SkipTransform()
  @ApiOperation({ operationId: 'getHealth', summary: 'Liveness health check' })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
