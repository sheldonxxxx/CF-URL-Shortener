# Design: implement-url-shortener

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Cloudflare    │     │   Cloudflare    │     │   Cloudflare    │
│     Worker      │────▶│      KV         │     │ Analytics KV    │
│   (Edge Code)   │     │  (URL Storage)  │     │   (Optional)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Redirects     │
│ & API Responses │
└─────────────────┘
```

## Key Design Decisions

### 1. Short Code Generation Strategy

**Decision:** Cryptographically secure random 6-character codes from base62 character set

**Rationale:**
- Unpredictable codes prevent enumeration attacks
- Uses `crypto.getRandomValues()` for secure randomness
- Collision probability extremely low for expected traffic
- Supports custom codes without complexity

**Trade-off:**
- 6 characters fixed length (not shorter for early URLs)
- Requires collision detection on creation

**Implementation:**
```javascript
const CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

function generateRandomCode(length = 6) {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => CHARS[byte % CHARS.length]).join('')
}

// On creation:
let shortCode = generateRandomCode()
while (await shortCodeExists(kv, shortCode)) {
  shortCode = generateRandomCode()
}
```

### 2. Storage Schema

**Decision:** Single KV namespace with prefix-based key organization

**Rationale:**
- Simpler configuration (one namespace to manage)
- Flexible prefix organization prevents key collisions
- Easy to migrate to separate namespaces later if needed

**Schema:**
```
URL storage:
  short:{shortCode} → { originalUrl, createdAt, trackClicks }

Analytics (optional):
  analytics:{shortCode}:clicks → { count }
  analytics:{shortCode}:lastClicked → { timestamp }
```

**Alternative Considered:** Separate namespaces for URLs and analytics
- Rejected: Adds deployment complexity for minimal benefit

### 3. API Authentication

**Decision:** Simple API token in `Authorization: Bearer <token>` header

**Rationale:**
- Minimal implementation (no user management needed)
- Easy to rotate tokens via Cloudflare secrets
- Sufficient for single-user or small-team use cases

**Security Considerations:**
- Token stored as Cloudflare secret, not in code
- Token validated on every write operation
- HTTPS enforced by Cloudflare

**Alternative Considered:** API key in query parameter
- Rejected: Less secure, tokens may appear in logs

### 4. Click Analytics Implementation

**Decision:** Feature-gated read-modify-write counter

**Rationale:**
- Optional feature doesn't burden basic shortening with overhead
- KV atomic increment not available in Workers API
- Read-modify-write is acceptable for click counters
- Simple to query and aggregate

**Implementation:**
```javascript
async function incrementClicks(kv, shortCode) {
  const now = new Date().toISOString()
  const clicksData = await kv.get(`analytics:${shortCode}:clicks`)
  const currentClicks = clicksData ? parseInt(clicksData, 10) : 0
  await Promise.all([
    kv.put(`analytics:${shortCode}:clicks`, String(currentClicks + 1)),
    kv.put(`analytics:${shortCode}:lastClicked`, now),
  ])
}

// Only increment if analytics enabled for this short code
if (await shouldTrackClicks(shortCode)) {
  await incrementClicks(ANALYTICS, shortCode)
}
```

**Trade-off:** Not atomic - potential for counter drift under high concurrency
- Acceptable for analytics use case where exact precision not required

### 5. URL Redirect Flow

**Decision:** 302 (temporary) redirect for all URLs

**Rationale:**
- Allows URL updates without breaking existing links
- Better for analytics accuracy
- Standard practice for shorteners

**Alternative:** 301 (permanent) redirect
- Rejected: Caching at edge could prevent URL updates

## Performance Considerations

1. **KV Read Caching:** Consider caching frequently accessed redirects in Worker memory
2. **Edge Caching:** Cloudflare automatically caches responses at edge locations
3. **KV Latency:** Average 10-30ms read latency from edge

## Cost Estimation

- **Workers:** Free tier covers ~10M requests/month
- **KV Reads:** Free tier includes 1M reads/day
- **KV Writes:** Free tier includes 1M writes/day
- **Bandwidth:** Free tier includes 10GB/month

For personal/small-team use, likely to stay within free tier limits.

## Security Considerations

1. **URL Validation:** Sanitize input URLs to prevent open redirect vulnerabilities
2. **Rate Limiting:** Consider adding to prevent abuse (future enhancement)
3. **HTTPS:** Enforced by Cloudflare
4. **Token Security:** Stored as Cloudflare secrets, never logged

## Future Extensibility

The design allows for:
- Adding URL expiration
- Custom short codes (already implemented)
- Geographic analytics
- User authentication with multiple API keys
- URL tagging/categories
