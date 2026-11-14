# 04 — Database Design

## ER Overview

The system models users, candidates, examinations, questions, assignments, sessions, response events, submissions, audit events, and node health.

## Core Tables

- `User`: account identity and role
- `Candidate`: candidate profile and registration
- `Examination`: exam metadata and status
- `Question`: question text and ordering
- `Option`: answer choices
- `ExamAssignment`: candidate-to-exam mapping
- `ExamSession`: active exam session lifecycle
- `ResponseEvent`: immutable event history for every answer change
- `CurrentResponse`: latest candidate answer state
- `AuditEvent`: hash-linked event log
- `NodeHealth`: state of Cloud, Node A, Node B, Node C
- `SyncOutbox` / `SyncInbox`: synchronization queueing
- `ExamSubmission`: final submission record

## Response Event Design

Each response is saved with a unique UUID, sequence number, version, and hash link. The design supports duplicate-event protection, version validation, and audit proof-of-sequence.

## Audit Event Design

Audit data records event type, timestamp, details, related candidate/session, and previous/current hash values. This supports tamper-evident review at the prototype level.

## Important Limitation

Hash linkage is useful for evidence but does not replace independent signed logs or isolated storage. A single compromised storage system could still delete or alter all records.
