import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeHttpRequest } from '../execute-request';
import { HttpRequest } from '../../types';

// Mock Next.js headers()
vi.mock('next/headers', () => ({
  headers: async () => new Map(),
}));

describe('executeHttpRequest Server Action', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
});
