# Spec: analytics

**Change:** implement-url-shortener  
**Type:** Capability  
**Status:** Completed  

## Overview
Optional click tracking and analytics retrieval functionality. Analytics are feature-gated to avoid overhead when not needed.

---

## ADDED Requirements

### Requirement: REQ-001 - Click Tracking

**Statement:** The system SHALL optionally track click counts for short URLs.

#### Scenario: Track click when enabled

**Given** a short URL with click tracking enabled  
**When** a user accesses the short URL (GET `/s/{code}`)  
**Then** the system SHALL increment the click counter for that short code

#### Scenario: Skip tracking when disabled

**Given** a short URL with click tracking disabled (default)  
**When** a user accesses the short URL  
**Then** the system SHALL NOT increment any counter

#### Scenario: Enable tracking at creation

**Given** a valid API token  
**When** the user creates a short URL with `{ "trackClicks": true }`  
**Then** the system SHALL enable click tracking for that short code  
**And** future clicks SHALL be counted

---

### Requirement: REQ-002 - Retrieve Analytics

**Statement:** The system SHALL provide a protected endpoint to retrieve click analytics.

#### Scenario: Get analytics for a single URL

**Given** a valid API token and an existing short code  
**When** the user sends a GET request to `/api/urls/{code}/analytics`  
**Then** the system SHALL return status 200 with JSON `{ "clicks": 42, "lastClicked": "2026-01-15T10:30:00Z" }`

#### Scenario: Get analytics for non-existent URL

**Given** a short code that doesn't exist  
**When** the user sends a GET request to `/api/urls/{code}/analytics`  
**Then** the system SHALL return status 404 with error message "Short URL not found"

#### Scenario: Analytics reflect disabled tracking

**Given** a short URL with click tracking disabled  
**When** the user requests analytics  
**Then** the system SHALL return `{ "clicks": 0, "trackingEnabled": false }`

---

### Requirement: REQ-003 - Analytics Format

**Statement:** The system SHALL return analytics in a consistent format.

#### Scenario: Analytics response structure

**Given** any short URL with tracking enabled and 10 clicks  
**When** analytics are requested  
**Then** the response SHALL be:
```json
{
  "shortCode": "abc123",
  "originalUrl": "https://example.com/very/long/url",
  "clicks": 10,
  "trackingEnabled": true,
  "createdAt": "2026-01-10T08:00:00Z",
  "lastClicked": "2026-01-15T14:30:00Z"
}
```

#### Scenario: No last clicked timestamp when no clicks

**Given** a short URL with tracking enabled but zero clicks  
**When** analytics are requested  
**Then** the `lastClicked` field SHALL be `null`

---

## Modified Requirements

*None*

## Removed Requirements

*None*

## Cross-References

- **URL Shortening:** Click tracking integration with redirect flow (see: url-shortening/spec.md)
- **Security:** Analytics endpoint authentication (see: security/spec.md)
