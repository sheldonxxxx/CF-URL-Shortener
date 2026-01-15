# URL Shortener

A lightweight URL shortener built with Cloudflare Workers and KV storage.

## Features

- Create short URLs via protected API
- Redirect short URLs to original destinations
- Optional click analytics tracking
- Secure API token authentication
- Edge caching for fast redirects

## Setup

### Prerequisites

- Node.js 18+
- Cloudflare account with Workers and KV enabled
- Wrangler CLI (`npm install -g wrangler`)

### Installation

```bash
npm install
```

### Configure Cloudflare

1. Log in to Wrangler:
   ```bash
   npx wrangler login
   ```

2. Create KV namespaces:
   ```bash
   npx wrangler kv namespace create URL_STORAGE
   npx wrangler kv namespace create ANALYTICS
   ```

3. Add the returned IDs to `wrangler.toml`

4. Set the API token secret:
   ```bash
   npx wrangler secret put API_TOKEN
   ```

## Development

Run locally with:
```bash
npm run dev
```

## Deployment

Deploy to Cloudflare:
```bash
npm run deploy
```

## API Usage

### Create Short URL

```bash
curl -X POST https://your-worker.dev.cloudflare.com/api/urls \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/very/long/path"}'
```

Response:
```json
{
  "shortUrl": "https://your-worker.dev.cloudflare.com/s/abc123",
  "shortCode": "abc123"
}
```

### Create with Custom Code

```bash
curl -X POST https://your-worker.dev.cloudflare.com/api/urls \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "customCode": "mylabel"}'
```

### Create with Click Tracking

```bash
curl -X POST https://your-worker.dev.cloudflare.com/api/urls \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "trackClicks": true}'
```

### Redirect

Visit `https://your-worker.dev.cloudflare.com/s/abc123` to redirect to the original URL.

### Get Analytics

```bash
curl https://your-worker.dev.cloudflare.com/api/urls/abc123/analytics \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

Response:
```json
{
  "shortCode": "abc123",
  "originalUrl": "https://example.com",
  "clicks": 42,
  "trackingEnabled": true,
  "createdAt": "2026-01-10T08:00:00Z",
  "lastClicked": "2026-01-15T14:30:00Z"
}
```

## Testing

Run unit tests:
```bash
npm test
```

Run type checking:
```bash
npm run typecheck
```
