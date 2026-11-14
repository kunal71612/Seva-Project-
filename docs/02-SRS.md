# 02 — Software Requirements Specification

## System Overview

The OneMind prototype provides a local examination center with a fault-tolerant candidate experience and a strong audit trail. It simulates central cloud connectivity, primary server operation, standby readiness, and witness coordination with honest labeling regarding the simulation nature.

## Functional Specifications

- Admin can create an examination and register candidates.
- Candidate can log in with registration ID and continue an assigned exam.
- Answers are stored with event metadata and version numbers.
- The system marks responses as acknowledged or pending based on connectivity.
- A standby failure pauses new acknowledgement of answers.
- Audit log captures login, response changes, synchronization, and node failures.

## Non-functional Specifications

- The frontend must be understandable and professional.
- Backend logic must keep state and validation explicit.
- Local simulation should be transparent and labeled.

## User Roles

- Administrator
- Candidate
- Auditor

## System Interfaces

- Browser client to backend API.
- Backend to Prisma + SQLite datastore.
- Optional Docker-managed Postgres for future production-style setup.

## Performance Requirements

- Basic dashboard loads quickly on a local dev environment.
- Single-user exam simulation should remain responsive.

## Security Requirements

- No plaintext password storage.
- Role-based separation for admin and candidate flows.
- Event-level audit trail and hash-linked records.

## Error Handling

- Invalid credentials must fail with clear messages.
- Missing candidate or session data must return structured errors.
- Offline pause states must reject unsafe new acknowledgements.
