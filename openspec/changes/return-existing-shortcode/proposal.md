# Return Existing Short Code for Duplicate URLs

**Change ID:** `return-existing-shortcode`

**Status:** Draft

**Created:** 2026-01-16

## Summary

Currently, the URL shortener creates a new short code every time a URL is submitted, even if that URL already has a short code stored in KV. This leads to duplicate entries and inconsistent short codes for the same URL.

This change implements a fast reverse lookup system that checks if a URL already exists before creating a new short code. If the URL exists, the existing short code is returned; otherwise, a new short code is created.

## Problem Statement

The current implementation in `src/index.ts:41-92` (`handleCreateUrl` function) always generates a new short code for any submitted URL:

```typescript
shortCode = generateShortCode();
while (await shortCodeExists(env.URL_STORAGE, shortCode)) {
  shortCode = generateShortCode();
}
```

This causes:
1. Multiple short codes pointing to the same URL
2. Wasted KV operations and storage
3. Inconsistent user experience (same URL = different short codes)

## Proposed Solution

Add a reverse index from URL to short code using a hashed URL as the KV key:

1. Before generating a new short code, compute a hash of the original URL
2. Check if `url:<hashed-url>` exists in KV
3. If found, return the stored short code
4. If not found, create new short code and store the reverse mapping

## Scope

- **Storage layer (`src/storage/url.ts`)**: Add `getUrlByOriginalUrl` and `setUrlMapping` functions
- **API layer (`src/index.ts`)**: Update `handleCreateUrl` to check for existing URL before creating
- **Tests**: Add integration and unit tests for the new behavior

## Out of Scope

- Migration of existing duplicate entries
- Custom code handling (already checks for collisions)
- Analytics behavior changes
