# Tasks: Return Existing Short Code

## Phase 1: Storage Layer

### 1.1 Add URL hashing utility
**File**: `src/utils/hash.ts` (new)
- Create `hashUrl(url: string): string` function
- Use SHA-256 for hashing
- Return lowercase hex encoded string
- **Validation**: Unit tests for various URL formats
- **Status**: ✅ Completed

### 1.2 Add reverse index functions to storage
**File**: `src/storage/url.ts`
- Add `getUrlByOriginalUrl(kv, url): Promise<string | null>`
  - Hash the URL, look up `url:<hash>` key
  - Return short code or null if not found
- Add `setUrlMapping(kv, url, shortCode): Promise<void>`
  - Hash the URL, store `url:<hash>` -> shortCode
- **Validation**: Unit tests for both functions
- **Status**: ✅ Completed

### 1.3 Update setUrl to maintain reverse index
**File**: `src/storage/url.ts`
- Modify `setUrl` to also call `setUrlMapping`
- Ensure both operations succeed together
- **Validation**: Integration test with mock KV
- **Status**: ✅ Completed

## Phase 2: API Layer

### 2.1 Update handleCreateUrl for duplicate detection
**File**: `src/index.ts`
- Before generating short code, call `getUrlByOriginalUrl`
- If exists, return 200 with `existing: true`
- If not exists, proceed with current logic
- Add `existing` field to response JSON
- **Validation**: Integration tests for duplicate and new URL scenarios
- **Status**: ✅ Completed

### 2.2 Preserve custom code behavior
**File**: `src/index.ts`
- Custom codes bypass duplicate check (current behavior)
- Ensure custom code collision check happens first
- **Validation**: Existing tests pass, no regression
- **Status**: ✅ Completed

## Phase 3: Testing

### 3.1 Add unit tests for hash utility
**File**: `src/utils.test.ts` or new test file
- Test consistent hashing for same URL
- Test different URLs produce different hashes
- Test URLs with special characters
- **Status**: ✅ Completed

### 3.2 Add storage unit tests
**File**: `src/storage.test.ts`
- Test `getUrlByOriginalUrl` returns null for new URL
- Test `getUrlByOriginalUrl` returns code for existing URL
- Test `setUrlMapping` stores correct mapping
- **Status**: ✅ Completed

### 3.3 Add integration tests
**File**: `src/integration.test.ts`
- Test: Same URL submitted twice returns existing code
- Test: Response includes `existing: true` for duplicates
- Test: Response status is 200 for duplicates
- Test: Response status is 200 for new URLs
- Test: Custom codes still work independently
- **Status**: ✅ Completed

## Phase 4: Validation

### 4.1 Run full test suite
**Command**: `npm test`
- Ensure all existing tests pass
- Ensure all new tests pass
- **Status**: ✅ Completed

### 4.2 Run type checking
**Command**: `npm run typecheck`
- No TypeScript errors
- **Status**: ✅ Completed
