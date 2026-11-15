# 03 — System Architecture

**Project:** OneMind  
**Architecture Model:** Local Offline-First High-Availability Simulation  
**Version:** 1.0.0  

---

## 1. Architectural Overview

OneMind implements a layered, offline-first edge architecture designed for high-stakes examination centers. Instead of routing all interactions across the public internet to a distant cloud cluster, examination terminals connect to an in-center edge tier that maintains transactional persistence, standby redundancy, and an append-only audit trail.

```mermaid
flowchart TD
    subgraph Central_Tier["Central Cloud Tier (Simulated)"]
        Cloud[("Central Cloud Store\n(SyncInbox)")]
    end

    subgraph WAN_Link["Wide Area Network (WAN)"]
        WAN{{"Internet Link\n(Simulated Online/Offline)"}}
    end

    subgraph Center_Tier["Local Examination Center Tier"]
        NodeA["Node A — Primary Server\n(Express API + SQLite)"]
        NodeB["Node B — Standby Node\n(Replication Partner)"]
        NodeC["Node C — Witness Node\n(Quorum Arbitrator)"]
    end

    subgraph Client_Tier["Candidate Terminal Tier"]
        Browser["Candidate Terminal (Vite + React)"]
        IDB[("IndexedDB Queue\n(pending_responses)")]
    end

    Browser <--> IDB
    Browser -->|"HTTP REST (/api/*)"| NodeA
    NodeA <-->|"Heartbeat & Replication"| NodeB
    NodeA <-->|"Quorum Health"| NodeC
    NodeA -->|"Sync Outbox"| WAN
    WAN -->|"Batch Ingest"| Cloud

    classDef primary fill:#f0fdf4,stroke:#16a34a,stroke-width:2px;
    classDef standby fill:#eff6ff,stroke:#2563eb,stroke-width:2px;
    classDef warning fill:#fffbeb,stroke:#d97706,stroke-width:2px;
    classDef cloud fill:#f8fafc,stroke:#475569,stroke-width:2px;

    class NodeA primary;
    class NodeB standby;
    class NodeC warning;
    class Cloud cloud;
```

---

## 2. Component Architecture

### 2.1 Candidate Client Terminal (Frontend)
- **Framework:** React 19, TypeScript, Vite, Tailwind CSS.
- **Client Storage:** Browser `IndexedDB` (`OneMindOfflineDB`) maintains an unacknowledged queue (`pending_responses`).
- **State Machine:**
  - Transitions through `INITIALIZING`, `ACTIVE`, `PENDING_ACK`, `SAVED_LOCAL`, `PAUSED`, and `SUBMITTED`.
  - Automatically recovers unconfirmed answers upon page reload or network recovery.

### 2.2 Local Center Edge (Primary Node A)
- **Runtime:** Node.js, Express, TypeScript.
- **ORM & Database:** Prisma ORM connected to SQLite (`prisma/dev.db`).
- **Transaction Engine:**
  - Executes atomic `$transaction` blocks for response ingestion.
  - Appends to immutable `ResponseEvent` history while updating `CurrentResponse` latest state.
  - Generates deterministic SHA-256 hash chains for `AuditEvent`.

### 2.3 Standby Node B & Safe-Pause Engine
- **Role:** Simulates the active replication partner.
- **Failure Protocol:** When Node B is marked `OFFLINE`, Node A enters `pauseActive = true`.
- **Honest Ingestion Rule:** If standby redundancy is unavailable, Node A refuses to return durable acknowledgement to the candidate (HTTP 409 Conflict), preventing single-point-of-failure data loss.

### 2.4 Central Cloud Aggregator (SyncInbox)
- **Role:** Simulates the upstream central repository where candidate results are consolidated after the examination window closes or when connectivity returns.

---

## 3. Core Data Flow & Failure Sequences

### 3.1 Normal Response Persistence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate Browser
    participant IDB as Browser IndexedDB
    participant NodeA as Primary Node A
    participant DB as SQLite DB
    participant NodeB as Standby Node B

    Candidate->>IDB: 1. Put pending response (clientEventId)
    Candidate->>NodeA: 2. POST /api/candidate/exam/:id/response
    NodeA->>NodeB: 3. Verify Standby Online
    NodeB-->>NodeA: Standby Healthy (ACK)
    NodeA->>DB: 4. Atomic Transaction: Append ResponseEvent & Upsert CurrentResponse
    NodeA->>DB: 5. Append SHA-256 AuditEvent
    NodeA-->>Candidate: 6. HTTP 200 { status: 'ACKNOWLEDGED', seq: N }
    Candidate->>IDB: 7. Delete acknowledged item from IndexedDB
    Candidate->>Candidate: 8. Update UI Badge to SAVED (Green)
```

---

### 3.2 Internet Disconnect & Offline Continuity Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    actor Candidate as Candidate Browser
    participant NodeA as Primary Node A
    participant Outbox as SyncOutbox (SQLite)

    Admin->>NodeA: POST /api/system/simulate { action: 'disconnect_internet' }
    NodeA->>NodeA: Set internetConnected = false, Cloud = OFFLINE
    Candidate->>NodeA: POST /api/candidate/exam/:id/response
    NodeA->>Outbox: Save response locally + insert into SyncOutbox (PENDING)
    NodeA-->>Candidate: HTTP 200 { status: 'PENDING_SYNC' }
    Candidate->>Candidate: Update UI: Local Exam Continues (Cloud Offline)
```

---

### 3.3 Standby Node B Crash & Safe-Pause Protocol

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    actor Candidate as Candidate Browser
    participant IDB as Browser IndexedDB
    participant NodeA as Primary Node A

    Admin->>NodeA: POST /api/system/simulate { action: 'fail_node_b' }
    NodeA->>NodeA: Set nodeB = OFFLINE, pauseActive = true
    Candidate->>IDB: Store answer in IndexedDB
    Candidate->>NodeA: POST /api/candidate/exam/:id/response
    NodeA-->>Candidate: HTTP 409 Conflict { status: 'PAUSED', message: 'Standby node offline' }
    Candidate->>Candidate: Display Red PAUSED Banner (Freeze exam input)
    Admin->>NodeA: POST /api/system/simulate { action: 'restore_node_b' }
    NodeA->>NodeA: Set nodeB = ONLINE, pauseActive = false
    Candidate->>NodeA: Retry buffered answer
    NodeA-->>Candidate: HTTP 200 { status: 'ACKNOWLEDGED' }
    Candidate->>Candidate: Return to Active Exam State
```

---

## 4. SHA-256 Hash Chaining Architecture

Every event in the `AuditEvent` ledger incorporates the cryptographic digest of its immediate predecessor:

$$\text{currentHash}_n = \text{SHA-256}(\text{eventId}_n \parallel \text{type}_n \parallel \text{details}_n \parallel \text{currentHash}_{n-1} \parallel \text{candidateId}_n \parallel \text{sessionId}_n)$$

$$\text{currentHash}_0 = \text{SHA-256}(\text{eventId}_0 \parallel \text{type}_0 \parallel \text{details}_0 \parallel \text{"GENESIS"} \parallel \text{"system"} \parallel \text{"none"})$$

This structure guarantees that any retrospective alteration of a candidate's answer, score, or timestamp invalidates all subsequent hash links in the ledger.
