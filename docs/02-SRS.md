# 02 — Software Requirements Specification (SRS)

**Project:** OneMind  
**Standard:** IEEE 830 Adapted for Seva Innovation Challenge 2026  
**Version:** 1.0.0  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the OneMind offline-first examination continuity prototype. It defines external interfaces, functional specifications, data models, and non-functional guarantees.

### 1.2 System Overview
OneMind consists of a TypeScript Express backend with a SQLite relational database (managed via Prisma ORM) and a Vite React single-page frontend. Client terminals buffer unconfirmed answers in browser IndexedDB before securing durable acknowledgements from the local examination server.

---

## 2. External Interface Requirements

### 2.1 User Interfaces
- **Responsive Web UI:** Tailored for standard 1366x768 and 1920x1080 examination monitors and laptops.
- **Color Palette & Contrast:** Minimalist, high-contrast dark-slate typography on crisp white and cool-gray backgrounds adhering to WCAG 2.1 AA standards.
- **State Indicators:** High-visibility status pills (`SAVED` in green, `PENDING` in amber, `PAUSED` in red).

### 2.2 Hardware Interfaces
- Operates on commodity x86_64 Windows, macOS, or Linux development machines without specialized hardware.

### 2.3 Software & Network Interfaces
- **Client-to-Server:** JSON over HTTP REST API (`/api/*`).
- **Storage:** Local SQLite database file (`prisma/dev.db`) and Client-side IndexedDB (`OneMindOfflineDB`).

---

## 3. System Features & Detailed Functional Requirements

### 3.1 Authentication & Authorization Module
- **SRS-AUTH-1:** The system shall authenticate administrators using `email` and password verified against a salted scrypt hash.
- **SRS-AUTH-2:** The system shall authenticate candidates using `registrationId` and password.
- **SRS-AUTH-3:** The system shall issue HMAC-SHA256 session tokens with a 24-hour expiration window.
- **SRS-AUTH-4:** Candidate requests to `/api/candidate/exam/:sessionId/*` shall be rejected with HTTP 403 if the session does not belong to the authenticated candidate.

### 3.2 Examination Management Module
- **SRS-EXAM-1:** Administrators shall create examinations with title, description, duration in minutes, and multiple-choice questions.
- **SRS-EXAM-2:** Each question shall support four distinct options and designate exactly one correct answer.
- **SRS-EXAM-3:** Candidate examination requests shall strip `isCorrect` from question option payloads to prevent client-side answer leakage.
- **SRS-EXAM-4:** Administrators shall register candidates and assign them to active examinations.

### 3.3 Candidate Response & Resilience Engine
- **SRS-RESP-1:** When a candidate selects an option, the browser shall persist the event into IndexedDB object store `pending_responses` with a unique `clientEventId`.
- **SRS-RESP-2:** The backend shall record each response in `ResponseEvent` (append-only ledger) with an incremented sequence/version number.
- **SRS-RESP-3:** The backend shall upsert `CurrentResponse` to reflect the latest candidate answer.
- **SRS-RESP-4:** Duplicate requests with an existing `eventId` shall be processed idempotently without creating duplicate records or throwing errors.
- **SRS-RESP-5:** If internet connectivity is disconnected (`internetConnected = false`), the response shall be assigned status `PENDING_SYNC` and queued in `SyncOutbox`.

### 3.4 Standby Failure & Pause Safeguard
- **SRS-PAUSE-1:** If Standby Node B is marked `OFFLINE`, the system shall set `pauseActive = true`.
- **SRS-PAUSE-2:** While `pauseActive = true`, any attempt to save responses shall be rejected with HTTP 409 Conflict and status `PAUSED`.
- **SRS-PAUSE-3:** The candidate user interface shall display a prominent pause banner and prevent un-replicated response acknowledgement.
- **SRS-PAUSE-4:** When Node B is restored to `ONLINE`, the system shall permit resuming exam response processing.

### 3.5 Cloud Synchronization Simulation
- **SRS-SYNC-1:** When internet is restored, calling `/api/system/sync` shall transfer pending `SyncOutbox` records into `SyncInbox`.
- **SRS-SYNC-2:** The sync processor shall ensure idempotent insertion into `SyncInbox` based on `eventId`.
- **SRS-SYNC-3:** Successfully synced records in `ResponseEvent` and `CurrentResponse` shall update from `PENDING_SYNC` to `ACKNOWLEDGED`.
- **SRS-SYNC-4:** The outbox shall be purged of processed records and a `SYNC_COMPLETED` audit event recorded with exact synced counts.

### 3.6 Cryptographic Audit Ledger
- **SRS-AUD-1:** Every administrative, candidate, and simulation event shall be recorded in `AuditEvent`.
- **SRS-AUD-2:** Each event hash shall be calculated as `SHA-256(eventId|type|details|previousHash|candidateId|sessionId)`.
- **SRS-AUD-3:** The initial event shall link to `previousHash = "GENESIS"`.
- **SRS-AUD-4:** The system shall provide an endpoint `/api/audit/verify` that mathematically re-computes and validates the integrity of the hash chain.

---

## 4. Non-Functional Requirements

### 4.1 Performance & Latency
- Local response acknowledgement latency shall remain under 50ms on standard development laptops.
- Verification of 100+ audit events shall complete within 20ms.

### 4.2 Security & Integrity
- Passwords must never be stored in plaintext.
- Session tokens must use cryptographically secure HMAC-SHA256 signatures.
- Local SQLite database shall enforce foreign key constraints and transactional consistency.

### 4.3 Reliability & Availability
- Examination sessions must survive page reloads and browser crashes via IndexedDB recovery.
- Network disconnects must never cause data loss or unhandled application crashes.
