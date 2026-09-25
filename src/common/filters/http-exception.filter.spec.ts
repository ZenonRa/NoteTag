import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url: '/notes' }),
    }),
  } as unknown as ArgumentsHost;
  const filter = new HttpExceptionFilter();

  beforeEach(() => vi.clearAllMocks());

  it('keeps status, message, error and request path for HTTP errors', () => {
    filter.catch(new BadRequestException(['content should not be empty']), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: ['content should not be empty'],
        error: 'Bad Request',
        path: '/notes',
        timestamp: expect.any(String),
      }),
    );
  });

  it('does not leak internal error details', () => {
    filter.catch(new Error('database password leaked'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        error: 'INTERNAL SERVER ERROR',
      }),
    );
    expect(JSON.stringify(response.json.mock.calls[0][0])).not.toContain('database password');
  });
});
