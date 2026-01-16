/// <reference types="@cloudflare/workers-types" />

import { isValidUrl } from './utils/validation';
import { validateAuthHeader } from './utils/auth';
import { getUrl, setUrl, shortCodeExists, generateShortCode, getUrlByOriginalUrl } from './storage/url';
import { incrementClicks, getAnalytics, shouldTrackClicks } from './storage/analytics';

interface Env {
  URL_STORAGE: KVNamespace;
  ANALYTICS: KVNamespace;
  API_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/urls' && request.method === 'POST') {
      return handleCreateUrl(request, env);
    }

    if (path.startsWith('/api/urls/') && path.endsWith('/analytics') && request.method === 'GET') {
      const shortCode = path.split('/')[3];
      return handleGetAnalytics(request, env, shortCode);
    }

    if (path.startsWith('/s/') && (request.method === 'GET' || request.method === 'HEAD')) {
      const shortCode = path.slice(3);
      return handleRedirect(env, shortCode);
    }

    if (path === '/' || path === '/health') {
      return new Response('URL Shortener is running', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleCreateUrl(request: Request, env: Env): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  if (!validateAuthHeader(authHeader, env.API_TOKEN)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json() as { url: string; customCode?: string; trackClicks?: boolean };
    const { url, customCode, trackClicks = false } = body;

    if (!url || !isValidUrl(url)) {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let shortCode: string;

    if (customCode) {
      if (await shortCodeExists(env.URL_STORAGE, customCode)) {
        return new Response(JSON.stringify({ error: 'Short code already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      shortCode = customCode;
    } else {
      const existingCode = await getUrlByOriginalUrl(env.URL_STORAGE, url);
      if (existingCode) {
        const shortUrl = `${new URL(request.url).origin}/s/${existingCode}`;
        return new Response(JSON.stringify({ shortUrl, shortCode: existingCode, existing: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      shortCode = generateShortCode();
      while (await shortCodeExists(env.URL_STORAGE, shortCode)) {
        shortCode = generateShortCode();
      }
    }

    await setUrl(env.URL_STORAGE, shortCode, url, trackClicks);

    const shortUrl = `${new URL(request.url).origin}/s/${shortCode}`;

    return new Response(JSON.stringify({ shortUrl, shortCode }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleRedirect(env: Env, shortCode: string): Promise<Response> {
  const record = await getUrl(env.URL_STORAGE, shortCode);

  if (!record) {
    return new Response(JSON.stringify({ error: 'Short URL not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (record.trackClicks) {
    await incrementClicks(env.ANALYTICS, shortCode);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: record.originalUrl },
  });
}

async function handleGetAnalytics(request: Request, env: Env, shortCode: string): Promise<Response> {
  const authHeader = request.headers.get('Authorization');
  if (!validateAuthHeader(authHeader, env.API_TOKEN)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const record = await getUrl(env.URL_STORAGE, shortCode);

  if (!record) {
    return new Response(JSON.stringify({ error: 'Short URL not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const analytics = await getAnalytics(env.ANALYTICS, shortCode);

  return new Response(JSON.stringify({
    shortCode,
    originalUrl: record.originalUrl,
    clicks: analytics.clicks,
    trackingEnabled: record.trackClicks,
    createdAt: record.createdAt,
    lastClicked: analytics.lastClicked,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
