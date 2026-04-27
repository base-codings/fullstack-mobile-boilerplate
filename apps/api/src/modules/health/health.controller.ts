import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators/public.decorator';
import { SkipTransform } from '../../common/interceptors/transform-response.interceptor';

interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

/**
 * Lightweight health check endpoint.
 * Red Team #7: @Public() — no auth required for infrastructure health probes.
 * Uses @SkipTransform() because load balancers/k8s probes expect the raw shape,
 * not the standard data envelope.
 */
@ApiTags('health')
@Public()
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
