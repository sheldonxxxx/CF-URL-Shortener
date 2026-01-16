# Design: URL Deduplication System

## Architecture Overview

The solution introduces a reverse index in KV to map original URLs to their short codes. This enables O(1) lookup time for duplicate URL detection.

```
                    ┌─────────────────────────┐
                    │  POST /api/urls         │
                    │  { url: "https://..." } │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │  Hash original URL      │
                    │  sha256(url) → hash     │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │  KV GET url:<hash>      │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
     ┌────────▼────────┐               ┌─────────▼─────────┐
     │ Found: return   │               │ Not found:        │
     │ existing code   │               │ - Generate code   │
     └─────────────────┘               │ - Store mapping   │
                                        │ - Store URL       │
                                        └───────────────────┘
```

## Data Model

### Current Schema
- Key: `short:<shortCode>` → JSON `{ originalUrl, createdAt, trackClicks }`

### New Schema
- Existing: `short:<shortCode>` → JSON `{ originalUrl, createdAt, trackClicks }`
- New: `url:<urlHash>` → `<shortCode>`

**URL Hash Strategy**: Use SHA-256 hash of the original URL, encoded as hex string. This:
- Ensures consistent length keys
- Handles URLs of any length
- Avoids KV key size limits
- Provides uniform distribution

## Key Design Decisions

### 1. URL Normalization

**Decision**: Do not normalize URLs before hashing.

**Rationale**:
- Simpler implementation
- Users may intentionally use different URL formats
- Query parameters and fragments are considered significant
- Consistent with current validation (accepts any valid URL)

### 2. Reverse Index Update Timing

**Decision**: Update reverse index atomically with short code creation.

**Rationale**:
- Prevents inconsistent states
- If either operation fails, neither persists
- KV operations are atomic per operation, but we accept eventual consistency for the pair

### 3. Custom Code Behavior

**Decision**: Custom codes bypass the duplicate check.

**Rationale**:
- Users explicitly want a specific code
- Custom codes are likely for specific purposes (branding, memorability)
- Maintains current behavior for custom codes

## API Response Changes

### Current Response (201 Created)
```json
{
  "shortUrl": "https://.../s/abc123",
  "shortCode": "abc123"
}
```

### New Response (200 OK for existing)
```json
{
  "shortUrl": "https://.../s/abc123",
  "shortCode": "abc123",
  "existing": true
}
```

The `existing` field indicates whether the URL was newly created or already existed.

## Performance Considerations

1. **KV Read Operations**: One additional read per POST request (url hash lookup)
2. **KV Write Operations**: One additional write per new URL (reverse mapping)
3. **Cache Behavior**: Cloudflare Workers KV caches frequently accessed keys globally

## Trade-offs

| Aspect | Current | Proposed |
|--------|---------|----------|
| Duplicate detection | None | O(1) lookup |
| Storage overhead | N short codes per URL | N short codes + N reverse mappings |
| Write latency | Single PUT | Two PUTs (atomic-ish) |
| Read latency | Single GET | Two GETs (parallelizable) |

## Security Considerations

1. **URL Hash信息公开**: An attacker with KV read access could enumerate all stored URLs by iterating through `url:*` keys
   - Mitigation: Same as current (KV access requires credentials)
2. **Hash Collisions**: SHA-256 collision resistance is sufficient for this use case
3. **Denial of Service**: Attacker could flood with unique URLs to consume storage
   - Mitigation: Existing rate limiting (if any) applies

## Implementation Plan

1. Add `urlHash` utility function in `src/utils/hash.ts`
2. Add `getUrlByOriginalUrl` and `setUrlMapping` in `src/storage/url.ts`
3. Update `handleCreateUrl` in `src/index.ts` to check for existing URL
4. Add unit tests for new storage functions
5. Add integration tests for duplicate URL behavior
