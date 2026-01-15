# Spec: security

**Change:** implement-url-shortener  
**Type:** Capability  
**Status:** Completed  

## Overview
Security configuration for protecting administrative API endpoints (URL creation and analytics retrieval).

---

## ADDED Requirements

### Requirement: REQ-001 - API Token Authentication

**Statement:** The system SHALL authenticate API requests using bearer tokens.

#### Scenario: Valid token for URL creation

**Given** a configured API token `secret-token-12345`  
**When** a request includes header `Authorization: Bearer secret-token-12345`  
**Then** the request SHALL be authenticated successfully

#### Scenario: Invalid token rejected

**Given** an invalid or expired token  
**When** a request includes header `Authorization: Bearer wrong-token`  
**Then** the system SHALL return status 401 with error message "Unauthorized"

#### Scenario: Missing token rejected

**Given** no Authorization header is provided  
**When** a protected endpoint is accessed  
**Then** the system SHALL return status 401 with error message "Missing authorization token"

#### Scenario: Malformed header rejected

**Given** an incorrectly formatted Authorization header  
**When** a request includes `Authorization: Basic abc123` or `Authorization: `  
**Then** the system SHALL return status 401 with error message "Invalid authorization format"

---

### Requirement: REQ-002 - Token Storage

**Statement:** The system SHALL store API tokens securely.

#### Scenario: Token stored as Cloudflare secret

**Given** the deployment configuration  
**When** tokens are configured for the Worker  
**Then** they SHALL be stored as Cloudflare secrets via `wrangler secret put`  
**And** tokens SHALL NOT be stored in code, config files, or environment variables

#### Scenario: Multiple tokens supported

**Given** a need for multiple API tokens  
**When** tokens are configured  
**Then** the system SHALL support multiple tokens as a comma-separated list  
**And** any valid token SHALL grant access

---

### Requirement: REQ-003 - Endpoint Protection

**Statement:** The system SHALL protect administrative endpoints.

#### Scenario: Create URL endpoint protected

**Given** the POST `/api/urls` endpoint  
**When** requests are received  
**Then** the system SHALL require authentication  
**And** unauthenticated requests SHALL be rejected

#### Scenario: Analytics endpoint protected

**Given** the GET `/api/urls/{code}/analytics` endpoint  
**When** requests are received  
**Then** the system SHALL require authentication  
**And** unauthenticated requests SHALL be rejected

#### Scenario: Redirect endpoint public

**Given** the GET `/s/{code}` endpoint  
**When** requests are received  
**Then** the system SHALL NOT require authentication  
**And** all requests SHALL be processed normally

---

### Requirement: REQ-004 - HTTPS Enforcement

**Statement:** The system SHALL enforce secure connections.

#### Scenario: HTTPS required

**Given** Cloudflare's default configuration  
**When** requests are made over HTTP  
**Then** Cloudflare SHALL automatically redirect to HTTPS  
**And** the Worker SHALL only receive HTTPS requests

#### Scenario: HSTS headers

**Given** a successful redirect response  
**When** the system returns the redirect  
**Then** it MAY include `Strict-Transport-Security` header

---

## Modified Requirements

*None*

## Removed Requirements

*None*

## Cross-References

- **URL Shortening:** Protected create endpoint (see: url-shortening/spec.md)
- **Analytics:** Protected analytics endpoint (see: analytics/spec.md)
