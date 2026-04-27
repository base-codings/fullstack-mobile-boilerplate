import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/auth/decorators/public.decorator';
import { ApiStandardResponse } from '../../common/decorators/api-standard-response.decorator';
import { HelloResponseDto } from './dto/hello-response.dto';
import { HelloService } from './hello.service';

/**
 * Stateless hello endpoint — verifies the API is up and envelope wiring works.
 * Red Team #7: @Public() applied at class level so every route in this controller is public.
 * Red Team #3: Uses @ApiStandardResponse (not raw @ApiOkResponse) for correct codegen.
 */
@ApiTags('hello')
@Public()
@Controller('hello')
export class HelloController {
  constructor(private readonly helloService: HelloService) {}

  @Get()
  @ApiOperation({ operationId: 'getHello', summary: 'Returns a hello message with timestamp' })
  @ApiStandardResponse(HelloResponseDto)
  getHello(): HelloResponseDto {
    return this.helloService.getMessage();
  }
}
