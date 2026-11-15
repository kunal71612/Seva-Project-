# 12 — Architecture Decision Records (ADRs)

**Project:** OneMind  
**Format:** Michael Nygard ADR Template  
**Version:** 1.0.0  

---

## ADR 01: Offline-First Edge Ingestion Over Direct Cloud Access

### Context
Direct browser-to-cloud CBT systems immediately crash or freeze when the center's internet uplink experiences latency, jitter, or full disconnection.

### Decision
Deploy an in-center edge architecture where candidate terminals interact with a local primary examination server (Node A). Responses are written to local storage and queued in an outbox for asynchronous cloud synchronization.

### Consequences
- **Pros:** Candidate assessments continue completely unaffected by internet outages.
- **Cons:** Requires a store-and-forward reconciliation protocol when connectivity returns.

---

## ADR 02: Honest Safety Pause on Standby Loss (Rejecting False HA)

### Context
When Standby Node B crashes, many commercial systems continue acknowledging writes to Primary Node A, giving administrators a false sense of security while operating with zero redundancy.

### Decision
If Node B is offline, Node A enters `pauseActive = true` and rejects new response acknowledgements with HTTP 409 Conflict. Candidate inputs are held in client-side IndexedDB buffers until standby redundancy is restored.

### Consequences
- **Pros:** Eliminates the risk of catastrophic data loss if Node A experiences a subsequent hardware crash while unprotected.
- **Cons:** Temporarily halts exam progression until invigilators restore standby replication.

---

## ADR 03: Dual-Table Persistence (ResponseEvent + CurrentResponse)

### Context
Examinations require both fast, constant-time retrieval of a candidate's latest answer for question palette rendering AND an immutable audit trail of every intermediate option selection.

### Decision
Maintain two synchronized tables:
1. `ResponseEvent`: Immutable, append-only stream of all selections with sequence numbers and hashes.
2. `CurrentResponse`: Upserted single latest answer per question for optimal query performance.

### Consequences
- **Pros:** Eliminates expensive window functions during high-frequency candidate navigation while preserving complete historical auditability.
- **Cons:** Requires atomic transaction management to keep both tables in sync.

---

## ADR 04: SHA-256 Hash Chained Audit Log Over Blockchain

### Context
Judges and auditors need verifiable proof that exam event logs have not been retroactively altered.

### Decision
Implement deterministic SHA-256 hash chaining within the relational database rather than introducing complex distributed ledger or blockchain technologies.

### Consequences
- **Pros:** Extremely fast (<20ms verification), zero transaction fees, zero blockchain dependencies, fully compatible with SQLite.
- **Cons:** Does not prevent host-level database rewrite by a root administrator with full file access; requires external periodic root anchoring in production.
