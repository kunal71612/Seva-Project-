# OneMind — Offline-First Examination Continuity Platform

**Competition:** Seva Innovation Challenge 2026  
**Sector:** Education and Employability  
**Sub-Theme:** Reliable, secure and glitch-free digital entrance examination systems  
**Organization:** OneMind Labs  
**Repository:** [github.com/kunal71612/Seva-Project-](https://github.com/kunal71612/Seva-Project-)  
**Live Demo:** [Open OneMind on Vercel](https://seva-project-three.vercel.app/)<br>
**Prototype Version:** 1.0.0 (Working Demonstration Prototype)

---

## 1. Project Overview

Digital entrance examinations across India and globally suffer from a critical vulnerability: **direct cloud dependency**. When an examination center experiences a wide-area network (WAN) cut, fiber damage, or cloud service jitter, candidate sessions freeze, unacknowledged answers are lost, and centers are forced into costly, controversial re-examinations.

**OneMind** is an offline-first examination continuity platform engineered to prove three fundamental architectural principles:
1. **Uninterrupted Offline Assessment:** An examination must not fail simply because the center loses its external internet connection. Candidate responses continue saving locally without interruption.
2. **Persistent Store-and-Forward Sync:** Responses saved during network blackouts are buffered in client-side IndexedDB and local server transaction ledgers, then synchronized idempotently to the central cloud once connectivity is restored.
3. **Honest Standby Safety Pause:** When standby redundancy (Node B) is lost, the system halts response acknowledgement rather than pretending that single-node writes are safely protected against a sudden power or disk crash.

---

## 2. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, React Router 7, Tailwind CSS, Browser IndexedDB API.
- **Backend:** Node.js, Express 5, TypeScript, Prisma ORM 5.
- **Database:** SQLite (embedded local file `dev.db` for zero-configuration, reliable evaluation).
- **Cryptography:** Node.js `crypto` (Salted `scrypt` password hashing, HMAC-SHA256 session tokens, SHA-256 deterministic audit hash chaining).
- **Test Suite:** Automated 18-point integration test suite in TypeScript (`backend/src/test.ts`).

---

## 3. Quick Start & Setup Guide

### 3.1 Prerequisites
- **Node.js:** v18.0.0 or higher (Tested on Node.js v20/v24).
- **npm:** v9.0.0 or higher.
- **OS:** Windows, macOS, or Linux.

### 3.2 Installation (Single Setup Command)

From the project root:

```bash
# 1. Install dependencies across backend, frontend, and root (safely handles Windows paths)
npm --prefix backend install --workspaces=false
npm --prefix frontend install --workspaces=false
npm install --workspaces=false

# 2. Push database schema and seed demonstration accounts & assessments
npm run db:push
npm run db:seed

# 3. Build production bundles
npm run build
```

### 3.3 Running the Application

```bash
# Runs backend API (http://localhost:4000) and frontend UI (http://localhost:5173) concurrently
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 4. Pre-Seeded Demonstration Credentials

The login gateway features one-click quick-fill buttons for instant evaluation:

| Role | Identifier / Email | Password / Passcode | Description |
|---|---|---|---|
| **Administrator** | `admin@onemind.local` | `Admin@123` | Full dashboard, exam creator, candidate management, failure controls. |
| **Candidate 1** | `CAND-101` | `Candidate@123` | Aisha Rahman — Active demo candidate assessment. |
| **Candidate 2** | `CAND-102` | `Candidate@123` | Mehul Nair — Secondary candidate for concurrency testing. |
| **Candidate 3** | `CAND-103` | `Candidate@123` | Priya Sharma — Fresh assessment candidate. |

---

## 5. Five-Minute Seva Judge Demonstration Workflow

Follow this 5-minute walkthrough to test all five core prototype features:

1. **Candidate Login & Live Assessment:**
   - Go to `http://localhost:5173`.
   - Click **Candidate 1 (CAND-101)** -> Click **Enter Examination Interface**.
   - Notice the live countdown timer, question palette, and green **Response Saved** status pill when selecting an option.
2. **Simulate Internet Failure (Offline Continuity):**
   - In a second tab, open `http://localhost:5173/monitor`.
   - Click **Disconnect Internet**. Central Cloud turns red **DISCONNECTED**.
   - Return to the Candidate tab: an alert notes **Offline Continuity Mode Active**.
   - Answer next questions: answers persist smoothly to the local SQLite server.
3. **Simulate Standby Failure (Safe Pause):**
   - In the Monitor tab, click **Crash Node B (Pause Exam)**.
   - Return to the Candidate tab: an immediate red **EXAMINATION PAUSED** alert freezes answer writes to prevent un-replicated data loss.
   - In Monitor, click **Restore Node B (Resume)**: exam automatically unfreezes.
4. **Cloud Synchronization:**
   - In Monitor, click **Reconnect Internet** -> click **Sync Records**.
   - Shows exact count of synchronized records moved to the central repository without duplicates.
5. **Audit Chain Verification:**
   - Candidate clicks **Submit Exam** to lock and finish.
   - Open `http://localhost:5173/audit` and click **Verify SHA-256 Hash Chain**.
   - Displays green **CHAIN INTEGRITY VERIFIED (TAMPER-FREE)** confirmation!

---

## 6. Automated Integration Test Suite

Run the automated test suite verifying all 18 requirements:

```bash
npm test
```

### Verification Results (18/18 Tests Passed)
```
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
✔ Test 16: Examination submission confirmed
✔ Test 17: Audit events persisted and verified via SHA-256 hash chaining
✔ Test 18: Candidate token rejected from admin routes (403 Forbidden)
```

---

## 7. Deploying to Vercel

OneMind uses Vercel Services to deploy the frontend and backend from the repository root as one project:

1. **Via GitHub & Vercel Dashboard:**
   - Push your code to GitHub.
   - Go to [vercel.com/new](https://vercel.com/new) and import the repository.
   - Keep the Vercel project root directory set to the repository root.
   - The root [`vercel.json`](./vercel.json) builds `frontend/` and `backend/` as separate services.
   - Public `/api/*` requests route to the backend; all other paths route to the frontend.
   - Click **Deploy**.
2. **Via Vercel CLI:**
   ```bash
   npm i -g vercel
   vercel
   ```
The frontend calls the public same-origin `/api` route, so the two services do not need a private service binding. The backend includes the seeded SQLite database in its function bundle and copies it to `/tmp` at startup. This storage is ephemeral; use a persistent hosted database for production.

---

## 8. Documentation Index

Detailed specifications, design documents, and academic reports are located in `/docs`:

1. [PRD — Product Requirements Document](file:///docs/01-PRD.md)
2. [SRS — Software Requirements Specification](file:///docs/02-SRS.md)
3. [System Architecture & Mermaid Diagrams](file:///docs/03-SYSTEM-ARCHITECTURE.md)
4. [Database Design & ER Diagram](file:///docs/04-DATABASE-DESIGN.md)
5. [API Documentation & Examples](file:///docs/05-API-DOCUMENTATION.md)
6. [Security Design & Threat Model](file:///docs/06-SECURITY-DESIGN.md)
7. [Test Plan & Actual Execution Report](file:///docs/07-TEST-PLAN-AND-REPORT.md)
8. [Setup & Installation Guide](file:///docs/08-SETUP-GUIDE.md)
9. [User Guide (Admin & Candidate)](file:///docs/09-USER-GUIDE.md)
10. [Academic & Project Report](file:///docs/10-PROJECT-REPORT.md)
11. [Risk Register & Mitigation Strategy](file:///docs/11-RISK-REGISTER.md)
12. [Architecture Decision Records (ADRs)](file:///docs/12-ARCHITECTURE-DECISIONS.md)
13. [Five-Minute Seva Demo Guide & Judge Q&A](file:///docs/13-SEVA-DEMO-GUIDE.md)
14. [Product Roadmap & Future Milestones](file:///docs/14-ROADMAP.md)

---

## 8. Honest Prototype Limitations

- **Logical Single-Host Simulation:** All node states (Cloud, Node A, Node B, Node C) are logically simulated on a single development machine. This prototype demonstrates state machine logic, safe-pause safeguards, client-side IndexedDB persistence, and hash chaining without claiming physical multi-datacenter deployment.
- **Hash Chaining Scope:** Hash chaining prevents undetectable selective modification or deletion of historical records. It does not prevent an attacker possessing root access to the physical database file from recalculating the whole chain; external root anchoring is planned for production.
