# 13 — Five-Minute Seva Demonstration Guide & Judge Q&A

**Project:** OneMind — Offline-First Examination Continuity Platform  
**Target Event:** Seva Innovation Challenge 2026 Presentation  
**Time Limit:** 5 Minutes  
**Demonstration URL:** `http://localhost:5173`  

---

## 1. Five-Minute Demonstration Script

### Minute 1: The Problem & Baseline Exam Flow (60s)
1. **Introduction:** "Good morning, judges. In high-stakes digital examinations, losing an internet connection usually means lost answers, candidate panic, and disputed results. OneMind solves this with an offline-first examination platform."
2. **Candidate Login:**
   - Open `http://localhost:5173`.
   - Click **Candidate 1 (CAND-101)** to quick-fill credentials and click **Enter Examination Interface**.
   - Show the live countdown timer, interactive question sheet, and question palette.
   - Answer Question 1: point out the green **Response Saved** status badge.

### Minute 2: Innovation 1 — Total Internet Disconnect (60s)
1. **Simulate Outage:**
   - In a second tab or window, open `http://localhost:5173/monitor`.
   - Click **Disconnect Internet**. Show the **Central Cloud** node flip to red **DISCONNECTED**.
2. **Candidate Continuity:**
   - Switch back to the Candidate tab. Show the amber banner: **Offline Continuity Mode Active**.
   - Answer Question 2 and Question 3.
   - Explain to judges: "Notice the exam never stopped! The answers are saved locally on the center's SQLite server and queued in the sync outbox."

### Minute 3: Innovation 2 — Honest Redundancy (Standby Crash & Safe Pause) (60s)
1. **Simulate Standby Failure:**
   - In the Monitor tab, click **Crash Node B (Pause Exam)**.
   - Standby Node B flips to red **OFFLINE**.
2. **Honest Pause Safeguard:**
   - Switch to the Candidate tab. An immediate red alert appears: **EXAMINATION PAUSED**.
   - Try selecting an answer: the status pill displays **Paused (Standby Lost)**.
   - Explain to judges: "Most systems falsely claim high availability by continuing to write to a single disk when the standby dies. OneMind enforces honest resilience: if standby redundancy is gone, we pause to prevent un-replicated data loss."
3. **Recovery:**
   - In Monitor, click **Restore Node B (Resume)**.
   - Return to Candidate tab: exam automatically unfreezes and answers confirm immediately.

### Minute 4: Innovation 3 — Store-and-Forward Reconnection & Cloud Sync (60s)
1. **Reconnect Internet:**
   - In Monitor, click **Reconnect Internet**.
   - Notice the button: **Sync Records (3)**.
2. **Idempotent Ingestion:**
   - Click **Sync Records**. The system ingests all offline answers into the cloud inbox without duplicates.
   - Point out the confirmation message: "Successfully synchronized 3 records with central repository."

### Minute 5: Innovation 4 — Tamper-Evident SHA-256 Audit Verification (60s)
1. **Submission:**
   - Candidate clicks **Submit Exam** -> confirms in modal.
   - Show the final score and immutable submission receipt.
2. **Cryptographic Proof:**
   - Navigate to `http://localhost:5173/audit`.
   - Click **Verify SHA-256 Hash Chain**.
   - Show the green verification banner: **INTEGRITY VERIFIED (TAMPER-FREE)**.
   - Conclude: "Every login, answer selection, network cut, pause, and sync is chained with SHA-256 digests from GENESIS. Thank you, judges!"

---

## 2. Anticipated Judge Questions & Answers

### Q1: Is this really running on multiple physical servers?
**Answer:** "No, judges. As clearly stated on the monitor screen, this prototype logically simulates the multi-node topology on a single development machine using SQLite and Express. This accurately demonstrates state transitions, pause safeguards, IndexedDB buffering, and hash chaining without unnecessary cloud costs during evaluation."

### Q2: Why pause when Node B fails instead of continuing on Node A?
**Answer:** "Because acknowledging an answer to a candidate when only one server remains is a false guarantee. If Node A experiences a sudden power cut or disk crash while Node B is down, that answer is permanently lost. OneMind pauses safely to protect candidate integrity."

### Q3: What happens if the candidate terminal crashes or loses power?
**Answer:** "Candidate inputs are saved to browser `IndexedDB` before transmission. When the browser re-opens or the terminal reboots, the unacknowledged queue is reloaded and confirmed with the server."

### Q4: Does SHA-256 hash chaining prevent database tampering by a rogue admin?
**Answer:** "Hash chaining prevents undetectable selective modification or insertion of historical events. While an admin with root database access could recompute the entire chain, in production the root hash is periodically published to an external immutable ledger or timestamping authority."
