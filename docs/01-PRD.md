# 01 — Product Requirements Document (PRD)

**Project Name:** OneMind  
**Organization:** OneMind Labs  
**Competition:** Seva Innovation Challenge 2026  
**Sector:** Education and Employability  
**Sub-Theme:** Reliable, secure, and glitch-free digital entrance examination systems  
**Version:** 1.0.0 (Working Seva Prototype)

---

## 1. Executive Summary

Digital entrance examinations in India and globally frequently suffer catastrophic disruptions due to localized internet outages, cloud endpoint latency, and unreliable standby failovers. When examination connectivity drops, candidates face lost progress, unconfirmed submissions, panic, and costly legal/administrative disputes.

**OneMind** is an offline-first examination continuity platform engineered to ensure digital assessments continue seamlessly during complete internet disconnection. The platform preserves candidate responses locally in resilient SQLite databases, maintains an unconfirmed client-side IndexedDB queue, enforces a strict safety-pause protocol when standby replication is unavailable, and provides a tamper-evident SHA-256 hash-chained audit ledger.

---

## 2. Core Problem & Market Need

In typical digital examination centers:
1. **Network Fragility:** Candidate terminals make direct HTTP calls to a central cloud server. A severed fiber link or ISP outage immediately halts the assessment.
2. **Ambiguous Persistence:** Candidates have no clarity on whether their responses were saved or dropped when network glitches occur.
3. **Standby Illusions:** Many platforms claim "high availability" while silently dropping redundancy, acknowledging candidate responses to a single failing disk without standby replication.
4. **Disputed Audit Trails:** In post-exam disputes, lack of verifiable, chained audit logs makes it impossible to prove whether an answer was altered or submitted in time.

---

## 3. Product Vision & Principles

- **Continuity First:** Examinations must never fail simply because external internet connectivity drops.
- **Honest Redundancy:** If standby replication is lost, the system must pause safely rather than pretending single-node writes are protected against hardware crashes.
- **Explicit Response States:** Every answer displays one of three clear statuses:
  - `SAVED`: Confirmed and persisted on local server transaction log.
  - `PENDING`: Stored in client-side IndexedDB buffer; awaiting server acknowledgement.
  - `PAUSED`: Halted due to lost redundancy on standby server (Node B).
- **Tamper-Evident History:** All candidate and system operations are committed to a deterministic SHA-256 hash-linked audit chain.

---

## 4. User Personas

### 4.1 Examination Administrator
- Schedules, creates, and monitors active examinations.
- Enrolls and assigns candidates to assessments.
- Observes multi-node health status (Cloud, Primary Node A, Standby Node B, Witness Node C).
- Controls simulated failover and triggers cloud synchronization when connectivity returns.

### 4.2 Candidate
- Logs in using their Registration ID and demo passcode.
- Views assigned assessment instructions, question sheet, and interactive question palette.
- Experiences a countdown timer and instant response feedback (`SAVED` vs `PENDING` vs `PAUSED`).
- Confirms submission with clear receipts and scores.

### 4.3 Center Auditor & Hackathon Judge
- Verifies system state transitions during internet disconnects and node crashes.
- Inspects the SHA-256 hash-linked audit trail.
- Runs cryptographic verification to confirm tamper-free event ordering from `GENESIS`.

---

## 5. Functional Scope & Requirements

| ID | Feature | Specification | Status |
|---|---|---|---|
| **FR-1** | Multi-Role Authentication | Administrator (email/password) and Candidate (Registration ID) login with salted scrypt hashing and session tokens. | **Implemented** |
| **FR-2** | Admin Exam Management | Create exam with title, duration, 4-option MCQs, designated answer, candidate assignment, and status toggles. | **Implemented** |
| **FR-3** | Interactive Exam Interface | Question palette, countdown timer, radio options, previous/next, and submit confirmation modal. | **Implemented** |
| **FR-4** | Client IndexedDB Queue | Preserves unconfirmed responses in browser IndexedDB across page reloads. | **Implemented** |
| **FR-5** | Append-Only Response Ledger | Dual-table architecture: `ResponseEvent` (immutable history) and `CurrentResponse` (latest state). | **Implemented** |
| **FR-6** | Offline Continuity | Internet disconnection allows candidates to continue answering; records marked `PENDING_SYNC`. | **Implemented** |
| **FR-7** | Reconnection & Cloud Sync | When internet returns, pending records sync idempotently to `SyncInbox` without duplicate ingestion. | **Implemented** |
| **FR-8** | Standby Loss Safe Pause | Crashing Node B safely PAUSES exams with HTTP 409 Conflict; resumes only upon Node B recovery. | **Implemented** |
| **FR-9** | Witness Quorum Warning | Crashing Node C triggers a degraded quorum warning banner. | **Implemented** |
| **FR-10**| Cryptographic Audit Trail | Deterministic SHA-256 chained hashes linking all administrative, candidate, and simulation events. | **Implemented** |

---

## 6. Prototype Scope vs. Production Scope

- **Working Prototype (Seva Innovation Challenge 2026):**
  - Runs locally on a single machine using SQLite, Express, and Vite React.
  - Simulates multi-node topology (Cloud, Node A, Node B, Node C) via interactive state controls.
  - Proves the offline continuity algorithm, safe standby pause behavior, and tamper-evident audit chaining.
- **Production Roadmap (Post-Hackathon):**
  - Physical clustering across separate edge appliances over LAN.
  - Raft consensus for automatic primary promotion.
  - Biometric candidate verification and hardware security module (HSM) signing.
