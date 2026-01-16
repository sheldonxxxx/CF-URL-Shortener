# URL Deduplication Capability

## Overview

Add the ability to detect and return existing short codes when a URL is submitted that already exists in the system.

## ADDED Requirements

### Requirement: Duplicate URL Detection

The system MUST check for existing short codes when a URL is submitted.

#### Scenario: Same URL returns existing code

**Given** a URL `https://example.com` has been previously shortened to `abc123`

**When** a user submits a POST request to `/api/urls` with `{"url": "https://example.com"}`

**Then** the response MUST return HTTP 200 with the existing short code `abc123`

**And** the response MUST include `"existing": true`

#### Scenario: New URL creates new code

**Given** no URL `https://new.example.com` exists in the system

**When** a user submits a POST request to `/api/urls` with `{"url": "https://new.example.com"}`

**Then** the response MUST return HTTP 200 with a newly generated short code

**And** the response MUST NOT include `"existing"` or it MUST be `false`

### Requirement: Reverse Index Storage

The system MUST store a reverse mapping from URL to short code for fast lookups.

#### Scenario: Reverse index is updated on new URL creation

**When** a new URL is successfully shortened

**Then** the system MUST store a key-value pair where:
- Key format: `url:<sha256-hash-of-original-url>`
- Value: the generated short code

#### Scenario: Reverse index is queried before creating short code

**When** a URL is submitted for shortening

**Then** the system MUST query the reverse index before generating a new short code

**And** if a mapping exists, the system MUST return the existing short code

### Requirement: URL Hashing

The system MUST use SHA-256 hashing for URL-to-key mapping.

#### Scenario: Hash produces consistent key

**Given** the URL `https://example.com/path?query=value`

**When** the system computes the hash for reverse index lookup

**Then** the hash MUST be computed using SHA-256

**And** the hash MUST be encoded as a lowercase hex string

#### Scenario: Hash handles special characters

**Given** URLs with special characters: `https://example.com/path#fragment`

**When** the hash is computed

**Then** the fragment MUST be included in the hash computation

**And** the hash MUST differ from the hash of `https://example.com/path`

### Requirement: Custom Code Priority

Custom short codes MUST take priority over duplicate URL detection.

#### Scenario: Custom code is used even if URL exists

**Given** the URL `https://example.com` has been shortened to `abc123`

**When** a user submits a POST request with `{"url": "https://example.com", "customCode": "custom"}`

**Then** the system MUST use `custom` as the short code

**And** the reverse index MUST NOT be updated (custom codes bypass duplicate check)

#### Scenario: Custom code collision returns error

**Given** a short code `custom` already exists for a different URL

**When** a user submits a POST request with `{"url": "https://example.com", "customCode": "custom"}`

**Then** the system MUST return HTTP 409 Conflict

**And** the response MUST indicate the code already exists

## MODIFIED Requirements

### Requirement: API Response Status Codes

The response status code MUST reflect whether the URL is new or existing.

#### Scenario: New URL returns 200

**When** a URL does not exist in the system

**Then** the response MUST have status code 200 Created

#### Scenario: Existing URL returns 200

**When** a URL already exists in the system

**Then** the response MUST have status code 200 OK

## Cross-Reference

- Related capability: None (foundational feature)
- Depends on: None
