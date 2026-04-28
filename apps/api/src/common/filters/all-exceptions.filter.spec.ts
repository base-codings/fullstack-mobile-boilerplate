import { ThrottlerException } from '@nestjs/throttler';
import { ArgumentsHost } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockReply: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    mockReply = jest.fn();
    filter = new AllExceptionsFilter({ httpAdapter: { reply: mockReply } } as never);
    mockHost = {
      switchToHttp: () => ({
        getRequest: () => ({ id: 'req-123', headers: {} }),
        getResponse: () => ({}),
      }),
    } as never;
  });

  it('maps ThrottlerException to TOO_MANY_REQUESTS envelope', () => {
    filter.catch(new ThrottlerException(), mockHost);
    const [, body, status] = mockReply.mock.calls[0];
    expect(status).toBe(429);
    expect(body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(body.requestId).toBe('req-123');
  });
});
