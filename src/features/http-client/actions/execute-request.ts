'use server';

import { HttpRequest, HttpResponse } from '../types';
import { checkRateLimit } from '../../../shared/lib/rate-limiter';
import { getClientIp } from '../../../shared/utils/get-client-ip';

export async function executeHttpRequest(request: HttpRequest): Promise<HttpResponse> {
  const startTime = performance.now();

  // 0. Rate Limiting Check (Upstash Redis in Production or In-Memory with auto-cleanup)
  const clientIp = await getClientIp();
  const rateLimitResult = await checkRateLimit(clientIp);

  if (!rateLimitResult.success) {
    return {
      status: 429,
      statusText: 'Too Many Requests',
      headers: {
        'retry-after': '60',
        'x-ratelimit-limit': rateLimitResult.limit.toString(),
        'x-ratelimit-remaining': rateLimitResult.remaining.toString(),
      },
      data: '',
      executionTimeMs: 0,
      sizeBytes: 0,
      isError: true,
      errorDetails: 'Rate limit exceeded. Maximum 30 requests per minute allowed to protect proxy infrastructure.',
    };
  }

  try {
    // 1. Build URL with enabled query parameters
    const urlObj = new URL(request.url);

    request.queryParams
      .filter((param) => param.enabled && param.key.trim() !== '')
      .forEach((param) => {
        urlObj.searchParams.append(param.key, param.value);
      });

    // 2. Build Headers
    const headersObj: Record<string, string> = {};

    request.headers
      .filter((header) => header.enabled && header.key.trim() !== '')
      .forEach((header) => {
        headersObj[header.key] = header.value;
      });

    // 3. Apply Authentication
    const { auth } = request;
    if (auth.type === 'bearer' && auth.bearerToken) {
      headersObj['Authorization'] = `Bearer ${auth.bearerToken}`;
    } else if (auth.type === 'basic' && (auth.basicUsername || auth.basicPassword)) {
      const credentials = `${auth.basicUsername || ''}:${auth.basicPassword || ''}`;
      const encoded = Buffer.from(credentials).toString('base64');
      headersObj['Authorization'] = `Basic ${encoded}`;
    } else if (auth.type === 'apikey' && auth.apiKeyName && auth.apiKeyValue) {
      if (auth.apiKeyAddTo === 'query') {
        urlObj.searchParams.append(auth.apiKeyName, auth.apiKeyValue);
      } else {
        headersObj[auth.apiKeyName] = auth.apiKeyValue;
      }
    }

    // 4. Prepare Request Body
    let bodyPayload: string | undefined = undefined;

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (request.body.type === 'json' && request.body.rawContent) {
        bodyPayload = request.body.rawContent;
        if (!headersObj['Content-Type'] && !headersObj['content-type']) {
          headersObj['Content-Type'] = 'application/json';
        }
      } else if (request.body.type === 'raw' && request.body.rawContent) {
        bodyPayload = request.body.rawContent;
      }
    }

    // 5. Execute HTTP Request on Server
    const response = await fetch(urlObj.toString(), {
      method: request.method,
      headers: headersObj,
      body: bodyPayload,
      cache: 'no-store',
    });

    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    // 6. Parse Response Headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // 7. Parse Response Body Data
    const responseData = await response.text();
    const sizeBytes = new Blob([responseData]).size;
    const contentType = responseHeaders['content-type'] || 'text/plain';

    return {
      status: response.status,
      statusText: response.statusText || getHttpStatusText(response.status),
      headers: responseHeaders,
      data: responseData,
      executionTimeMs,
      sizeBytes,
      contentType,
      isError: !response.ok,
    };
  } catch (error: unknown) {
    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);
    const errorMessage = error instanceof Error ? error.message : 'Unknown network error';

    return {
      status: 0,
      statusText: 'Network Error',
      headers: {},
      data: '',
      executionTimeMs,
      sizeBytes: 0,
      isError: true,
      errorDetails: errorMessage,
    };
  }
}

function getHttpStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return statusTexts[status] || 'Unknown Status';
}
