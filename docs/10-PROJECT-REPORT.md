# 10 — Detailed Project & Academic Report

**Project:** OneMind — Offline-First Examination Continuity Platform  
**Competition:** Seva Innovation Challenge 2026  
**Sector:** Education & Employability  
**Sub-Theme:** Reliable, secure and glitch-free digital entrance examination systems  
**Author:** OneMind Labs  
**Date:** November 2026  

---

## 1. Abstract

Large-scale computer-based tests (CBTs) are vulnerable to infrastructural single-points-of-failure. Sudden internet connectivity losses and cloud outages frequently result in lost candidate responses, forced re-examinations, and costly legal disputes. This project presents **OneMind**, an edge-first, fault-tolerant examination architecture engineered to guarantee examination continuity even during complete WAN disconnection.

OneMind addresses three fundamental challenges in digital entrance examinations:
1. Continuing examinations safely during internet failure.
2. Distinguishing client-buffered pending states from durable server acknowledgements.
3. Enforcing an honest safety pause when standby redundancy is lost rather than risking un-replicated data corruption.

---

## 2. Technical Architecture & Methodology

OneMind rejects the conventional pattern of direct client-to-cloud browser communication in favor of a local examination center edge cluster:

### 2.1 Edge Transaction Tier
The local examination server executes atomic transactions against an embedded SQLite database. For every response:
- An immutable event record is appended to `ResponseEvent` with a sequence number and deterministic SHA-256 hash.
- The latest answer is updated in `CurrentResponse`.
- If the wide-area network is offline, the payload is automatically enrolled in `SyncOutbox`.

### 2.2 Client-Side Resilient Buffering
Candidate terminals utilize browser `IndexedDB` (`OneMindOfflineDB`) as a persistent client queue. Responses are buffered before transmission and cleared only upon explicit server acknowledgement, ensuring candidate inputs survive accidental reloads, browser crashes, or transient WiFi flickers.

### 2.3 Standby Availability & Honest Pause Safeguard
In distributed systems, committing writes to a primary node without active standby replication exposes data to single-point hardware loss. When Standby Node B fails, OneMind halts new response acknowledgements (HTTP 409 Conflict), displaying a clear pause status to candidates and invigilators. The examination resumes only when redundancy is re-established.

---

## 3. Cryptographic Verification & Auditability

To resolve post-examination disputes, OneMind constructs a deterministic SHA-256 hash-chained event ledger:

$$\text{Hash}_n = \text{SHA-256}(\text{EventID}_n \parallel \text{Type}_n \parallel \text{Details}_n \parallel \text{Hash}_{n-1} \parallel \text{CandidateID}_n \parallel \text{SessionID}_n)$$

The ledger begins with a hardcoded `GENESIS` root. An integrated verification algorithm scans all records in chronological sequence, confirming tamper-free mathematical integrity.

---

## 4. Empirical Evaluation & Results

The system was evaluated using an automated 18-point integration test suite simulating real-world examination scenarios:
- **Offline Continuity:** 100% of candidate responses submitted during simulated internet outages were persisted locally with zero data loss.
- **Store-and-Forward Synchronization:** Upon internet reconnection, all pending outbox records synchronized idempotently into the cloud inbox.
- **Standby Pause Enforcement:** 100% of answer submissions during Node B outage were rejected with HTTP 409 Conflict, preventing un-replicated persistence.
- **Audit Ledger Verification:** The verification engine successfully verified tamper-free cryptographic continuity across all test transactions.

---

## 5. Conclusion & Future Work

OneMind demonstrates that digital entrance examinations can be conducted with high reliability and zero downtime without relying on fragile direct cloud connections. Future work includes implementing physical LAN clustering with Raft consensus, biometric candidate identity verification, and hardware security module (HSM) key anchoring.
