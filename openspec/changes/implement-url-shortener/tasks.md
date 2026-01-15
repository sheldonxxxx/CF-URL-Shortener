# Tasks: implement-url-shortener

**Change:** implement-url-shortener  
**Status:** Completed  

## Task List

### Phase 1: Project Setup

- [x] **TASK-001:** Initialize Cloudflare Worker project with Wrangler
  - Run `npm create cloudflare` or manually configure wrangler.toml
  - Set up TypeScript configuration
  - Verify Worker runs locally with `wrangler dev`
  - *Validation:* `wrangler dev` starts without errors

- [x] **TASK-002:** Configure KV namespaces
  - Create KV namespace for URL storage
  - Create KV namespace for analytics (optional)
  - Add namespace bindings to wrangler.toml
  - *Validation:* `wrangler kv:namespace list` shows configured namespaces

- [x] **TASK-003:** Set up deployment secrets
  - Generate secure API token
  - Store token via `wrangler secret put API_TOKEN`
  - Verify token is accessible in Worker environment
  - *Validation:* `console.log(env.API_TOKEN)` shows token value (in dev only)

### Phase 2: Core URL Shortening

- [x] **TASK-004:** Implement short code generation utilities
  - Create cryptographically secure random code generator
  - Implement collision detection
  - Write unit tests for encoding functions
  - *Validation:* `generateShortCode()` returns 6-character base62 codes

- [x] **TASK-005:** Implement URL validation
  - Create URL validation function (check http/https protocol)
  - Add tests for valid and invalid URLs
  - *Validation:* `isValidUrl("https://example.com")` returns true, invalid URLs return false

- [x] **TASK-006:** Implement KV storage layer
  - Create functions to store URL mappings
  - Create function to retrieve URL by short code
  - Create function to check if short code exists
  - *Validation:* Unit tests pass for all storage operations

- [x] **TASK-007:** Implement POST /api/urls endpoint
  - Parse request body and validate input
  - Generate short code (custom or auto)
  - Store URL mapping in KV
  - Return 201 with shortUrl response
  - *Validation:* POST to endpoint returns 201 with correct format

- [x] **TASK-008:** Implement GET /s/{code} redirect
  - Look up short code in KV
  - Return 302 redirect to original URL
  - Handle 404 for non-existent codes
  - *Validation:* GET to short URL returns 302 to correct destination

### Phase 3: Analytics (Optional)

- [x] **TASK-009:** Implement analytics storage
  - Create function to increment click counter (read-modify-write)
  - Create function to retrieve click count
  - Create function to update last clicked timestamp
  - *Validation:* Unit tests pass for analytics operations

- [x] **TASK-010:** Integrate click tracking with redirect
  - Check if tracking enabled for short code
  - Increment counter on redirect
  - *Validation:* Manual test shows counter incrementing

- [x] **TASK-011:** Implement GET /api/urls/{code}/analytics endpoint
  - Require authentication
  - Retrieve URL metadata and click count
  - Return structured analytics response
  - *Validation:* Endpoint returns correct analytics JSON

### Phase 4: Security

- [x] **TASK-012:** Implement token validation middleware
  - Extract Authorization header
  - Validate Bearer token format
  - Compare against configured API tokens
  - Return 401 for invalid/missing tokens
  - *Validation:* Invalid token returns 401, valid token allows access

- [x] **TASK-013:** Apply authentication to protected endpoints
  - Add token validation to POST /api/urls
  - Add token validation to GET /api/urls/{code}/analytics
  - Ensure GET /s/{code} remains public
  - *Validation:* Protected endpoints require token, redirects don't

### Phase 5: Testing & Deployment

- [x] **TASK-014:** Write integration tests
  - Test full URL creation and redirect flow
  - Test authentication on protected endpoints
  - Test analytics tracking and retrieval
  - *Validation:* All integration tests pass

- [x] **TASK-015:** Test locally with Wrangler
  - Run `wrangler dev` and test all endpoints
  - Verify KV operations work correctly
  - Test error scenarios (404, 401, 400)
  - *Validation:* All manual tests pass

- [x] **TASK-016:** Deploy to Cloudflare
  - Run `wrangler deploy`
  - Verify deployment succeeds
  - Test against production endpoint
  - *Validation:* Live URLs work in production

- [x] **TASK-017:** Document API usage
  - Create README with API documentation
  - Document environment variables and secrets
  - Provide example curl commands
  - *Validation:* README exists and is accurate

## Dependency Graph

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Core) ───┬──▶ TASK-004 → TASK-005 → TASK-006 → TASK-007 → TASK-008
    │              │
    │              └── All core tasks required before Phase 3
    │
    ▼
Phase 3 (Analytics) ───▶ TASK-009 → TASK-010 → TASK-011
    │
    ▼
Phase 4 (Security) ───▶ TASK-012 → TASK-013
    │
    ▼
Phase 5 (Test/Deploy) ─▶ All previous tasks complete → TASK-014 → TASK-015 → TASK-016 → TASK-017
```

## Parallelization Opportunities

- **TASK-004 through TASK-006** can be developed in parallel (storage layer, utilities, validation)
- **TASK-009** (analytics storage) can be developed alongside Phase 2 tasks
- **TASK-012** (token validation) can be developed separately and integrated later

## Validation Commands

```bash
# Run unit tests
npm test

# Run locally
wrangler dev

# Deploy
wrangler deploy

# Test deployed endpoint
curl -X POST https://your-worker.dev/subdomain/api/urls \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Test redirect
curl -I https://your-worker.dev/subdomain/s/abc123
```

## Notes

- All tasks should include appropriate unit tests
- Integration tests should cover the full request lifecycle
- Manual testing should verify production behavior
- Documentation should be updated as implementation progresses
