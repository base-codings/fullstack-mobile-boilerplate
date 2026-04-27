import { ApiProperty } from '@nestjs/swagger';

/** Response shape for GET /api/hello */
export class HelloResponseDto {
  @ApiProperty({
    description: 'Greeting message from the API',
    example: 'Hello from NestJS',
  })
  message!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp of when the response was generated',
    example: '2026-04-26T22:30:00.000Z',
  })
  timestamp!: string;
}
