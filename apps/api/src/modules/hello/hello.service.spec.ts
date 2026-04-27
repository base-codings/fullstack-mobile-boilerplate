import { Test } from '@nestjs/testing';

import { HelloService } from './hello.service';

describe('HelloService', () => {
  let service: HelloService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [HelloService],
    }).compile();

    service = module.get(HelloService);
  });

  it('returns the canonical hello message', () => {
    const result = service.getMessage();
    expect(result.message).toBe('Hello from NestJS');
  });

  it('returns an ISO-8601 timestamp', () => {
    const result = service.getMessage();
    const ts = new Date(result.timestamp);
    expect(Number.isNaN(ts.getTime())).toBe(false);
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
