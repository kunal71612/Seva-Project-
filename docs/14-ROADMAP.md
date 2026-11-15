# 14 — Product Roadmap & Future Milestones

**Project:** OneMind  
**Phases:** Working Prototype (Current) -> Center Pilot -> National Scale  
**Version:** 1.0.0  

---

## Phase 1: Working Prototype (Seva Innovation Challenge 2026 — Current)
- [x] Dual-role authentication (Admin & Candidate) with salted scrypt hashing.
- [x] Functional Admin Dashboard: exam creation, duration, 4-option MCQs, candidate assignment, status controls.
- [x] Real Candidate Exam Interface: live timer, question sheet, palette, previous/next, and submit confirmation.
- [x] Browser IndexedDB resilient pending queue surviving page refreshes.
- [x] Local response persistence with dual-table architecture (`ResponseEvent` + `CurrentResponse`).
- [x] Strict safety pause safeguard when standby Node B fails (HTTP 409 Conflict).
- [x] Offline continuity mode during internet loss with store-and-forward cloud sync.
- [x] Deterministic SHA-256 hash-chained audit ledger with mathematical chain verification.
- [x] Automated 18-point integration test suite with 100% pass rate.

---

## Phase 2: Center Pilot Deployment (Q1-Q2 2027)
- [ ] **Physical Hardware Clustering:** Deploy on physical mini-PCs (Primary, Standby, Witness) connected via isolated center LAN switch.
- [ ] **Raft Consensus Protocol:** Implement automated leader election and split-brain fencing using Raft.
- [ ] **LAN Heartbeat & Auto-Promotion:** Physical socket heartbeats triggering controlled standby promotion if Primary power is severed.
- [ ] **Local Network Time Protocol (NTP):** In-center GPS/NTP time synchronization to guarantee sub-millisecond clock consistency across terminals.

---

## Phase 3: National Scale & High-Assurance Production (2027-2028)
- [ ] **Biometric Verification:** Fingerprint / facial matching integrated into candidate login flow.
- [ ] **Hardware Security Modules (HSM):** Private key signing of audit event batches using cryptographic hardware tokens.
- [ ] **Public Blockchain / RFC 3161 Timestamping:** Periodic public anchoring of the audit ledger root hash to prevent host-level database rewrite attacks.
- [ ] **Bandwidth-Optimized Binary Protocols:** Protocol Buffers over WebSockets for extreme-concurrency centers (10,000+ simultaneous candidates per center).
