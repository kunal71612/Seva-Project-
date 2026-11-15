# 06 — Security Design & Threat Model

**Project:** OneMind  
**Scope:** Examination Security, Data Protection, and Threat Mitigation  
**Version:** 1.0.0  

---

## 1. Threat Modeling (STRIDE Analysis)

| Threat Category | Potential Attack Vector | OneMind Control / Mitigation |
|---|---|---|
| **Spoofing** | Candidate impersonates another candidate using their ID. | Cryptographically signed HMAC-SHA256 session tokens; candidate ID derived from token claims, never trusted from body. |
| **Tampering** | Malicious client alters local database answers retroactively. | Deterministic SHA-256 hash chaining on all `AuditEvent` and `ResponseEvent` records; discrepancies detected via `/api/audit/verify`. |
| **Repudiation** | Candidate claims an answer was lost or modified by administrators. | Complete, append-only `ResponseEvent` history recording every intermediate selection with sequence numbers and timestamps. |
| **Information Disclosure** | Candidate inspects browser network payloads or DOM to discover correct MCQ options. | Backend projection explicitly strips `isCorrect` from all candidate question payloads. Answers are evaluated only on submission. |
| **Denial of Service** | Network link severed to force examination failure. | Local offline-first architecture; responses persist locally in SQLite and client-side in IndexedDB during outages. |
| **Elevation of Privilege** | Candidate attempts administrative actions (creating exams, triggering failure states). | `requireAdmin` middleware enforces strict role verification on all `/api/admin/*` routes. |

---

## 2. Password Security & Cryptography

### 2.1 Salted Key Derivation (scrypt)
- OneMind uses Node.js standard `crypto.scryptSync` with a randomly generated 16-byte cryptographic salt and 64-byte derived key.
- Hash format: `scrypt:<salt_hex>:<derived_key_hex>`
- Verification uses `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
- Plaintext passwords are never persisted to disk or emitted in logs.

### 2.2 Session Tokens
- HMAC-SHA256 signed bearer tokens with encoded payload: `{ userId, email, role, candidateId, exp }`.
- Tokens expire after 24 hours.

---

## 3. Repository Hygiene & Secret Management

### 3.1 `.env` Tracking Prevention
- The production secret file `.env` and `backend/.env` have been untracked from Git (`git rm --cached backend/.env`).
- Standard `.gitignore` entries ensure `.env`, SQLite database files (`*.db`, `*.db-journal`), and build artifacts (`dist/`) are permanently ignored.
- Placeholder configuration is published in `.env.example` and `backend/.env.example`.

---

## 4. Architectural Limitations & Honest Disclosure

- **Host-Level Threat:** Hash-linking alone cannot prevent an attacker with full root/administrative access to the underlying SQLite database file from recalculating the entire hash chain from scratch. In high-assurance production deployments, ledger roots must be periodically anchored to an external immutable timestamping authority or append-only cloud ledger.
- **Single-Machine Simulation:** The prototype simulates multiple nodes on a single machine for evaluation. Physical clustering, TLS encryption between nodes, and hardware-secured key storage represent post-hackathon roadmap milestones.
