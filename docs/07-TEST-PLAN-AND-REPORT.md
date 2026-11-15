# 07 — Test Plan & Execution Report

**Project:** OneMind  
**Test Suite:** Automated Integration & Resilience Test Suite (`backend/src/test.ts`)  
**Execution Date:** 2026-11-15  
**Result:** 18 of 18 Tests Passed (100% Success Rate)  

---

## 1. Test Execution Summary

The OneMind prototype was subjected to an automated end-to-end integration test suite covering authentication, question lifecycle, offline persistence, idempotency, standby pause enforcement, and SHA-256 audit verification.

```
====================================================
OneMind Seva Prototype — Automated Integration Tests
====================================================

Starting in-process backend server on 127.0.0.1:4000...
OneMind Exam Continuity Backend running at http://127.0.0.1:4000
Backend server verified healthy.

✔ Test 1: Admin can log in (200 OK, Token generated)
✔ Test 2: Candidate can log in (200 OK, Candidate authenticated)
✔ Test 3: Admin can create an exam (201 Created)
✔ Test 4: Admin can add multiple-choice questions with 4 options and correct answer
✔ Test 5: Candidate can start an exam session (Session ID generated)
✔ Test 6: Candidate can view/navigate questions (isCorrect is strictly sanitized)
✔ Test 7: Candidate can save answers (Status: ACKNOWLEDGED)
✔ Test 8: Answer remains persisted in SQLite database after page refresh
✔ Test 9: Duplicate response event is handled idempotently without re-execution
✔ Test 10: Unauthorized candidate cannot access another candidate session (403 Forbidden)
✔ Test 11: Internet disconnection allows local examination to continue (PENDING_SYNC)
✔ Test 12: Reconnection synchronizes 1 pending records without duplicates
✔ Test 13: Node B failure safely PAUSES examination and rejects writes (409 Conflict)
✔ Test 14: Node B restoration resumes examination write capabilities
✔ Test 15: Node C failure updates witness health and triggers quorum warning
✔ Test 16: Examination submission confirmed (Submission ID: 9446911c-6418-472c-954d-ee1f9d7d04a9)
✔ Test 17: Audit events persisted and verified via SHA-256 hash chaining (18 events)
✔ Test 18: Candidate token rejected from admin routes (403 Forbidden)

====================================================
ALL 18 INTEGRATION TESTS PASSED PERFECTLY!
====================================================
```

---

## 2. Test Case Specifications & Results

| # | Test Case Description | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| **TC-01** | Admin Authentication | Valid email/password returns 200 and signed bearer token. | HTTP 200, JWT token issued. | **PASS** |
| **TC-02** | Candidate Authentication | Valid Registration ID returns 200 and candidate payload. | HTTP 200, CAND-101 verified. | **PASS** |
| **TC-03** | Exam Creation | Admin creates assessment with metadata. | HTTP 201, Record inserted in SQLite. | **PASS** |
| **TC-04** | Question Management | MCQs configured with 4 options and designated correct answer. | HTTP 201, Correct answer flag saved. | **PASS** |
| **TC-05** | Start Exam Session | Candidate begins assigned exam; session token bound. | HTTP 200, Session UUID generated. | **PASS** |
| **TC-06** | Question Navigation & Sanitization | Questions returned to candidate omit `isCorrect`. | `isCorrect` stripped from options payload. | **PASS** |
| **TC-07** | Response Persistence | Candidate answer saved to `ResponseEvent` and `CurrentResponse`. | HTTP 200, Status `ACKNOWLEDGED`. | **PASS** |
| **TC-08** | Refresh Persistence | Answer persists across simulated browser refresh. | Answer verified in DB on reload. | **PASS** |
| **TC-09** | Response Idempotency | Resending duplicate `eventId` returns existing state without error. | HTTP 200, Duplicate prevented. | **PASS** |
| **TC-10** | Session Authorization | Candidate A cannot read or modify Candidate B's session. | HTTP 403 Forbidden returned. | **PASS** |
| **TC-11** | Offline Continuity | Response saved locally when internet is disconnected. | HTTP 200, Status `PENDING_SYNC`. | **PASS** |
| **TC-12** | Cloud Synchronization | Reconnecting internet synchronizes outbox without duplication. | Records ingested into `SyncInbox`. | **PASS** |
| **TC-13** | Standby Failure Pause | Crashing Node B halts response acknowledgements. | HTTP 409 Conflict (PAUSED). | **PASS** |
| **TC-14** | Standby Recovery Resume | Restoring Node B resumes normal response processing. | HTTP 200, Resumed write ACK. | **PASS** |
| **TC-15** | Witness Quorum Warning | Crashing Node C triggers quorum warning state. | Node C marked OFFLINE, quorum degraded. | **PASS** |
| **TC-16** | Exam Submission | Submitting exam locks session and records submission receipt. | HTTP 200, Status `SUBMITTED`. | **PASS** |
| **TC-17** | Cryptographic Audit Hash Chain | Audit ledger mathematically verified from `GENESIS`. | Hash chain verified (TAMPER_FREE). | **PASS** |
| **TC-18** | Privilege Enforcement | Candidate token rejected when accessing administrative endpoints. | HTTP 403 Forbidden returned. | **PASS** |
