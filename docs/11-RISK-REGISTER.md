# 11 — Risk Register & Mitigation Strategy

**Project:** OneMind  
**Version:** 1.0.0  

---

## 1. Technical & Operational Risks

| Risk ID | Risk Description | Severity | Likelihood | Impact | Mitigation Strategy Implemented in OneMind |
|---|---|---|---|---|---|
| **RSK-01** | **Total WAN Disconnect:** Examination center loses primary internet connection during assessment. | HIGH | HIGH | Critical exam interruption; candidate panic. | **Offline Continuity Mode:** Local Node A continues saving responses to SQLite; responses marked `PENDING_SYNC` and queued for post-reconnection sync. |
| **RSK-02** | **Standby Node Hardware Crash:** Standby Node B suffers disk or power failure. | HIGH | MEDIUM | Risk of single-point-of-failure data loss on Node A. | **Safety Pause Safeguard:** System automatically detects Node B outage, safely halts response acknowledgement (HTTP 409), and resumes only after Node B recovery. |
| **RSK-03** | **Client Terminal Crash:** Candidate browser closes or terminal loses power mid-question. | MEDIUM | HIGH | Unconfirmed answer loss. | **Browser IndexedDB Queue:** Candidate selections are buffered into persistent IndexedDB before dispatch, surviving reloads and browser crashes. |
| **RSK-04** | **Duplicate Record Ingestion:** Network flickers cause candidates or sync processes to replay identical responses. | MEDIUM | HIGH | Inconsistent sequence counts or database pollution. | **Strict Idempotency:** Unique constraints on `eventId` and composite `[sessionId, questionId, sequenceNumber]` reject duplicate transactions safely. |
| **RSK-05** | **Post-Exam Result Dispute:** Candidate or center disputes recorded answer or submission time. | HIGH | MEDIUM | Legal challenge, audit failure. | **Deterministic SHA-256 Hash Chain:** Every event is cryptographically linked to its predecessor; verifiable via `/api/audit/verify`. |
| **RSK-06** | **Unauthorized Exam Modification:** Candidate attempts to alter question answers or access administrative controls. | HIGH | LOW | Assessment integrity breach. | **Role-Based Token Authentication:** HMAC-SHA256 tokens; candidate endpoints derive identity strictly from authenticated claims. |
