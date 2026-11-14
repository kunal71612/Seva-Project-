# 05 — API Documentation

## Endpoint Summary

- `GET /api/health`
- `POST /api/auth/admin/login`
- `POST /api/auth/candidate/login`
- `GET /api/admin/dashboard`
- `POST /api/admin/exams`
- `POST /api/admin/candidates`
- `GET /api/system-status`
- `PUT /api/system-status`
- `GET /api/audit`
- `GET /api/exams`
- `POST /api/candidate/exam/:sessionId/response`
- `POST /api/candidate/exam/:sessionId/submit`
- `POST /api/system/sync`

## Authentication

- Admin login requires email and password.
- Candidate login requires registration ID.

## Validation

- Missing required inputs returns HTTP 400.
- Invalid access returns HTTP 401 or 404.
- Pause conditions return HTTP 409 with the reason encoded in the body.

## Idempotency

The prototype uses response sequence numbers and unique event IDs to prevent duplicate processing at the application level.

## Error Codes

- 400: invalid request
- 401: invalid credentials
- 404: resource not found
- 409: paused or conflicting state
