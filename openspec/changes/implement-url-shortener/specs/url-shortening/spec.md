# Spec: url-shortening

**Change:** implement-url-shortener  
**Type:** Capability  
**Status:** Completed  

## Overview
Core URL shortening functionality: creating short URLs and redirecting requests to original URLs.

---

## ADDED Requirements

### Requirement: REQ-001 - Create Short URL

**Statement:** The system SHALL provide a protected API endpoint to create short URLs.

#### Scenario: Create short URL via POST API

**Given** a valid long URL and a valid API token  
**When** the user sends a POST request to `/api/urls` with body `{ "url": "https://example.com/very/long/path" }` and header `Authorization: Bearer <token>`  
**Then** the system SHALL return status 200 with JSON response containing `{ "shortUrl": "https://domain.com/s/abc123", "shortCode": "abc123" }`

#### Scenario: Create short URL with custom short code

**Given** a valid long URL, a valid API token, and a custom short code  
**When** the user sends a POST request to `/api/urls` with body `{ "url": "https://example.com", "customCode": "mylabel" }`  
**Then** the system SHALL create the short URL with code `mylabel` if it doesn't already exist  
**And** return status 200 with `{ "shortUrl": "https://domain.com/s/mylabel", "shortCode": "mylabel" }`

#### Scenario: Reject invalid URL

**Given** an invalid URL string (not a valid http/https URL)  
**When** the user sends a POST request to `/api/urls`  
**Then** the system SHALL return status 400 with error message "Invalid URL"

#### Scenario: Reject duplicate custom short code

**Given** a custom short code that already exists in the system  
**When** the user sends a POST request with that custom code  
**Then** the system SHALL return status 409 with error message "Short code already exists"

---

### Requirement: REQ-002 - Redirect Short URL

**Statement:** The system SHALL redirect requests to short URLs to their original destinations.

#### Scenario: Redirect to original URL

**Given** a short URL code that exists in the system  
**When** the user sends a GET request to `/s/abc123`  
**Then** the system SHALL return HTTP 302 redirect to the original URL  
**And** set `Location` header to the original URL

#### Scenario: Handle non-existent short code

**Given** a short URL code that doesn't exist  
**When** the user sends a GET request to `/s/unknown`  
**Then** the system SHALL return HTTP 404 with error message "Short URL not found"

#### Scenario: Preserve URL fragments

**Given** a short URL mapped to `https://example.com/page#section`  
**When** the user requests the short URL  
**Then** the redirect SHALL preserve the fragment identifier

---

### Requirement: REQ-003 - Short URL Format

**Statement:** The system SHALL use a consistent format for short URLs.

#### Scenario: Default subpath format

**Given** the configured domain is `myshort.io`  
**When** a URL is shortened with code `abc123`  
**Then** the full short URL SHALL be `https://myshort.io/s/abc123`

#### Scenario: Short code length

**Given** the system uses cryptographically secure random generation  
**When** creating short codes  
**Then** codes SHALL always be 6 characters in length  
**And** codes SHALL contain only characters `0-9`, `A-Z`, `a-z`

---

## Modified Requirements

*None*

## Removed Requirements

*None*

## Cross-References

- **Security:** API authentication for create endpoint (see: security/spec.md)
- **Analytics:** Click tracking for redirects (see: analytics/spec.md)
