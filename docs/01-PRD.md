# 01 — Product Requirements Document

## Executive Summary

OneMind is a prototype examination infrastructure platform that helps local examination centers continue running assessments even when the internet connection fails. The solution emphasizes local continuity, response reliability, explicit failure handling, and auditability rather than raw convenience.

## Problem Statement

Examination centers rely on a stable internet connection and central cloud services. Internet outages, local server issues, or cloud instability can disrupt assessments and create disputes over candidate responses.

## Target Users

- Examination administrators
- Candidates
- Center coordinators
- Auditors

## User personas

### Administrator

- Needs to schedule and monitor examinations.
- Wants confidence that responses are tracked and recoverable.

### Candidate

- Needs a predictable examination experience.
- Must clearly know whether answers are saved or pending.

### Auditor

- Needs a tamper-aware event timeline and synchronized record history.

## Functional Requirements

- Candidate login with registration ID.
- Exam creation and question management.
- Candidate registration and assignment.
- Offline answer persistence and queueing.
- Status and pause handling when standby node fails.
- Audit log with event IDs and hash chaining.

## Non-functional Requirements

- Clear status indicators.
- Reasonable local latency.
- Maintainable code and documentation.
- Honest simulation of high-availability assumptions.

## MVP Scope

- Local demo center app.
- Simulated cloud and node health states.
- Candidate exam flow.
- Local audit log with hash chaining.

## Out of scope

- Real blockchain, biometric identification, or production-grade failover.

## Success metrics

- Candidate can continue answering during simulated internet failure.
- Paused exam resumes only when redundancy is restored.
- Audit log shows clear event sequence.
