/// <reference types="@cloudflare/workers-types" />

import { describe, it, expect, beforeEach } from 'vitest';
import exportedHandler from './index';

function createMockEnv(apiToken: string = 'test-token'): any {
  const urlStorage: any = {
    data: {},
    get: async function(key: string) {
      return this.data[key] !== undefined ? this.data[key] : null;
    },
    put: async function(key: string, value: string) {
      this.data[key] = value;
    },
    increment: async function(key: string, delta?: number) {
      const current = this.data[key] !== undefined ? parseInt(this.data[key], 10) : 0;
      const incrementDelta = delta !== undefined ? delta : 1;
      const result = current + incrementDelta;
      this.data[key] = String(result);
      return result;
    },
  };

  const analytics: any = {
    data: {},
    get: async function(key: string) {
      return this.data[key] !== undefined ? this.data[key] : null;
    },
    put: async function(key: string, value: string) {
      this.data[key] = value;
    },
    increment: async function(key: string, delta?: number) {
      const current = this.data[key] !== undefined ? parseInt(this.data[key], 10) : 0;
      const incrementDelta = delta !== undefined ? delta : 1;
      const result = current + incrementDelta;
      this.data[key] = String(result);
      return result;
    },
  };

  return {
    URL_STORAGE: urlStorage,
    ANALYTICS: analytics,
    API_TOKEN: apiToken,
  };
}

async function makeRequest(handler: any, request: Request, env: any): Promise<Response> {
  return handler.fetch(request, env);
}

describe('POST /api/urls', () => {
  it('creates short URL with valid request', async () => {
    const env = createMockEnv();
    const request = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    const response = await makeRequest(exportedHandler, request, env);

    expect(response.status).toBe(201);
    const body: any = await response.json();
    expect(body).toHaveProperty('shortUrl');
    expect(body).toHaveProperty('shortCode');
    expect(body.shortUrl).toContain('/s/');
  });

  it('rejects request without auth', async () => {
    const env = createMockEnv();
    const request = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com' }),
    });

    const response = await makeRequest(exportedHandler, request, env);

    expect(response.status).toBe(401);
  });

  it('rejects invalid URL', async () => {
    const env = createMockEnv();
    const request = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'not-a-url' }),
    });

    const response = await makeRequest(exportedHandler, request, env);

    expect(response.status).toBe(400);
  });

  it('creates URL with custom code', async () => {
    const env = createMockEnv();
    const request = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com', customCode: 'mycode' }),
    });

    const response = await makeRequest(exportedHandler, request, env);

    expect(response.status).toBe(201);
    const body: any = await response.json();
    expect(body.shortCode).toBe('mycode');
    expect(body.shortUrl).toContain('/s/mycode');
  });

  it('rejects duplicate custom code', async () => {
    const env = createMockEnv();
    await env.URL_STORAGE.put('short:mycode', JSON.stringify({
      originalUrl: 'https://existing.com',
      createdAt: new Date().toISOString(),
      trackClicks: false,
    }));

    const request = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com', customCode: 'mycode' }),
    });

    const response = await makeRequest(exportedHandler, request, env);

    expect(response.status).toBe(409);
  });

  it('creates URL with click tracking enabled', async () => {
    const env = createMockEnv();
    const request = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com', trackClicks: true }),
    });

    const response = await makeRequest(exportedHandler, request, env);

    expect(response.status).toBe(201);
  });
});

describe('GET /s/{code}', () => {
  it('redirects to original URL', async () => {
    const env = createMockEnv();
    await env.URL_STORAGE.put('short:abc123', JSON.stringify({
      originalUrl: 'https://example.com',
      createdAt: new Date().toISOString(),
      trackClicks: false,
    }));

    const request = new Request('https://test.dev/s/abc123', {
      method: 'GET',
    });

    const response = await makeRequest(exportedHandler, request, env);

    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('https://example.com');
  });

  it('returns 404 for non-existent code', async () => {
    const env = createMockEnv();
    const request = new Request('https://test.dev/s/nonexistent', {
      method: 'GET',
    });

    const response = await makeRequest(exportedHandler, request, env);

    expect(response.status).toBe(404);
  });

  it('increments click counter when tracking enabled', async () => {
    const env = createMockEnv();
    await env.URL_STORAGE.put('short:abc123', JSON.stringify({
      originalUrl: 'https://example.com',
      createdAt: new Date().toISOString(),
      trackClicks: true,
    }));

    const request = new Request('https://test.dev/s/abc123', {
      method: 'GET',
    });

    await makeRequest(exportedHandler, request, env);

    const clicks = await env.ANALYTICS.get('analytics:abc123:clicks');
    expect(clicks).toBe('1');
  });
});

describe('GET /api/urls/{code}/analytics', () => {
  it('returns analytics for existing URL', async () => {
    const env = createMockEnv();
    await env.URL_STORAGE.put('short:abc123', JSON.stringify({
      originalUrl: 'https://example.com',
      createdAt: '2026-01-10T08:00:00Z',
      trackClicks: true,
    }));
    await env.ANALYTICS.put('analytics:abc123:clicks', '42');
    await env.ANALYTICS.put('analytics:abc123:lastClicked', '2026-01-15T14:30:00Z');

    const request = new Request('https://test.dev/api/urls/abc123/analytics', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer test-token' },
    });

    const response = await makeRequest(exportedHandler, request, env);

    expect(response.status).toBe(200);
    const body: any = await response.json();
    expect(body.shortCode).toBe('abc123');
    expect(body.originalUrl).toBe('https://example.com');
    expect(body.clicks).toBe(42);
    expect(body.trackingEnabled).toBe(true);
  });

  it('requires authentication', async () => {
    const env = createMockEnv();
    const request = new Request('https://test.dev/api/urls/abc123/analytics', {
      method: 'GET',
    });

    const response = await makeRequest(exportedHandler, request, env);

    expect(response.status).toBe(401);
  });

  it('returns 404 for non-existent URL', async () => {
    const env = createMockEnv();
    const request = new Request('https://test.dev/api/urls/nonexistent/analytics', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer test-token' },
    });

    const response = await makeRequest(exportedHandler, request, env);

    expect(response.status).toBe(404);
  });
});

describe('Health check', () => {
  it('returns 200 for root path', async () => {
    const env = createMockEnv();
    const request = new Request('https://test.dev/', {
      method: 'GET',
    });

    const response = await makeRequest(exportedHandler, request, env);

    expect(response.status).toBe(200);
  });
});

describe('URL deduplication', () => {
  it('returns existing short code for duplicate URL', async () => {
    const env = createMockEnv();
    const url = 'https://example.com/duplicate';

    const request1 = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const response1 = await makeRequest(exportedHandler, request1, env);
    expect(response1.status).toBe(201);
    const body1: any = await response1.json();
    expect(body1).toHaveProperty('shortCode');
    expect(body1.existing).toBeUndefined();

    const request2 = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const response2 = await makeRequest(exportedHandler, request2, env);
    expect(response2.status).toBe(200);
    const body2: any = await response2.json();
    expect(body2.shortCode).toBe(body1.shortCode);
    expect(body2.existing).toBe(true);
  });

  it('returns 201 for new URL', async () => {
    const env = createMockEnv();
    const request = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com/new' }),
    });

    const response = await makeRequest(exportedHandler, request, env);
    expect(response.status).toBe(201);
    const body: any = await response.json();
    expect(body).toHaveProperty('shortCode');
    expect(body.existing).toBeUndefined();
  });

  it('different URLs get different short codes', async () => {
    const env = createMockEnv();

    const request1 = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com/page1' }),
    });

    const response1 = await makeRequest(exportedHandler, request1, env);
    const body1: any = await response1.json();

    const request2 = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com/page2' }),
    });

    const response2 = await makeRequest(exportedHandler, request2, env);
    const body2: any = await response2.json();

    expect(body1.shortCode).not.toBe(body2.shortCode);
  });

  it('custom codes bypass duplicate check', async () => {
    const env = createMockEnv();
    const url1 = 'https://example.com/page';

    const request1 = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url1, customCode: 'custom1' }),
    });

    const response1 = await makeRequest(exportedHandler, request1, env);
    expect(response1.status).toBe(201);

    const url2 = 'https://example.com/different-page';

    const request2 = new Request('https://test.dev/api/urls', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url2, customCode: 'custom1' }),
    });

    const response2 = await makeRequest(exportedHandler, request2, env);
    expect(response2.status).toBe(409);
  });
});
