# 09 — User Guide (Admin & Candidate Operations)

**Project:** OneMind  
**Target Audience:** Center Administrators, Invigilators, and Candidates  
**Version:** 1.0.0  

---

## 1. Candidate User Guide

### 1.1 Logging In
1. Navigate to `http://localhost:5173`.
2. Under **Candidate Sign In**, enter your Registration ID (e.g., `CAND-101`) and Passcode (`Candidate@123`), or click **Candidate 1 (CAND-101)** to quick-fill demo credentials.
3. Click **Enter Examination Interface**.

### 1.2 Answering Questions
1. View the active question prompt and 4 multiple-choice options.
2. Select any option by clicking its row. The system immediately:
   - Buffers the answer in your browser's IndexedDB queue (`PENDING`).
   - Dispatches the answer to the local examination server.
   - Updates the status pill to `SAVED` (Green) once durable server confirmation is received.
3. Use the **Previous** and **Next** buttons or click directly on any question number in the **Question Palette** to jump between items.

### 1.3 Handling Network & System Interruptions
- **Internet Outage (Offline Continuity):** If the center's internet uplink fails, an alert banner will notify you that **Offline Continuity Mode** is active. You can continue answering without interruption; answers are safely stored on the local center server.
- **Standby Server Outage (Safety Pause):** If the standby server crashes, the system enters **Safety Pause** (`PAUSED` in red). Answer selection is temporarily halted to prevent data loss. As soon as the invigilator restores standby redundancy, answer submission automatically resumes.

### 1.4 Submitting the Examination
1. Click **Submit Exam** in the upper right header.
2. A confirmation modal will display your total answered vs. unanswered questions.
3. Click **Yes, Submit Now** to permanently lock and complete your session.
4. View your official submission receipt, Submission ID, and score summary.

---

## 2. Administrator User Guide

### 2.1 Accessing the Control Panel
1. From the top navigation bar, click **Admin Dashboard**.
2. Sign in with `admin@onemind.local` / `Admin@123`.

### 2.2 Managing Examinations
1. Click the **Examinations** tab.
2. Click **+ Create New Examination** to configure an assessment title, duration in minutes, and 4-option MCQs.
3. Use the **Start Exam / Pause Exam** toggle buttons to change live assessment availability.

### 2.3 Registering & Assigning Candidates
1. Click the **Candidates** tab.
2. Click **+ Register Candidate** to enroll candidates with their Name, Email, and Registration ID, and assign them to an examination.

### 2.4 Monitoring & Failure Simulation
1. Click **System Monitor** in the top navigation bar.
2. Review real-time node health for **Central Cloud**, **Node A (Primary)**, **Node B (Standby)**, and **Node C (Witness)**.
3. Click **Disconnect Internet** to test offline local continuity.
4. Click **Reconnect Internet** and **Sync Records** to demonstrate store-and-forward synchronization.
5. Click **Crash Node B** to demonstrate the immediate safety pause safeguard.
