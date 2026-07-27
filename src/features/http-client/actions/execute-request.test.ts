import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeHttpRequest } from './execute-request';
import { HttpRequest } from '../types';
import { resetRateLimiter } from '../../../shared/lib/rate-limiter';

// Mock Next.js headers() to return a consistent test IP address
vi.mock('next/headers', () => ({
  headers: async () => new Map([['x-forwarded-for', '192.168.1.100']]),
}));

describe('executeHttpRequest Server Action', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetRateLimiter(); // Reset Rate Limiter memory before each test
  });

  it('should successfully execute a GET request and return formatted response', async () => {
    const mockResponseText = JSON.stringify({ message: 'Success' });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        text: async () => mockResponseText,
      })
    );

    const mockRequest: HttpRequest = {
      id: 'req-1',
      method: 'GET',
      url: 'https://api.example.com/data',
      queryParams: [{ id: 'p1', key: 'search', value: 'vitest', enabled: true }],
      headers: [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
      auth: { type: 'none' },
      body: { type: 'none' },
    };

    const response = await executeHttpRequest(mockRequest);

    expect(response.status).toBe(200);
    expect(response.statusText).toBe('OK');
    expect(response.data).toBe(mockResponseText);
    expect(response.isError).toBe(false);
    expect(response.contentType).toBe('application/json');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/data?search=vitest',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Accept: 'application/json' }),
      })
    );
  });

  it('should format Bearer authentication header correctly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        ok: true,
        headers: new Map(),
        text: async () => 'OK',
      })
    );

    const mockRequest: HttpRequest = {
      id: 'req-2',
      method: 'POST',
      url: 'https://api.example.com/secure',
      queryParams: [],
      headers: [],
      auth: { type: 'bearer', bearerToken: 'secret-token-123' },
      body: { type: 'json', rawContent: '{"key":"value"}' },
    };

    await executeHttpRequest(mockRequest);

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/secure',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-token-123',
          'Content-Type': 'application/json',
        }),
        body: '{"key":"value"}',
      })
    );
  });

  it('should handle network errors gracefully without crashing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Failed to fetch / DNS lookup failed'))
    );

    const mockRequest: HttpRequest = {
      id: 'req-3',
      method: 'GET',
      url: 'https://invalid-domain-that-does-not-exist.test',
      queryParams: [],
      headers: [],
      auth: { type: 'none' },
      body: { type: 'none' },
    };

    const response = await executeHttpRequest(mockRequest);

    expect(response.status).toBe(0);
    expect(response.statusText).toBe('Network Error');
    expect(response.isError).toBe(true);
    expect(response.errorDetails).toContain('Failed to fetch');
  });

  it('should enforce rate limit and return 429 Too Many Requests on the 31st request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        ok: true,
        headers: new Map(),
        text: async () => 'OK',
      })
    );

    const mockRequest: HttpRequest = {
      id: 'req-rate-limit',
      method: 'GET',
      url: 'https://api.example.com/ping',
      queryParams: [],
      headers: [],
      auth: { type: 'none' },
      body: { type: 'none' },
    };

    // Execute 30 requests - all should succeed
    for (let i = 0; i < 30; i++) {
      const res = await executeHttpRequest(mockRequest);
      expect(res.status).toBe(200);
    }

    // 31st request from the same IP must fail with 429 Too Many Requests
    const rateLimitedResponse = await executeHttpRequest(mockRequest);

    expect(rateLimitedResponse.status).toBe(429);
    expect(rateLimitedResponse.statusText).toBe('Too Many Requests');
    expect(rateLimitedResponse.isError).toBe(true);
    expect(rateLimitedResponse.errorDetails).toContain('Rate limit exceeded');
    expect(rateLimitedResponse.headers['retry-after']).toBe('60');
  });
});
