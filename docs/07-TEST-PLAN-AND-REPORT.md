# 07 — Test Plan and Test Report

## Testing Strategy

The project uses a small set of direct backend and frontend smoke checks. Manual validation covers normal flow, offline continuity, node failures, and audit visibility.

## Test Cases

- Normal examination flow
- Internet disconnection
- Internet reconnection
- Node A failure
- Node B failure
- Node C failure
- Browser restart
- Duplicate response event
- Invalid candidate login
- Unauthorized administrator action
- Exam submission
- Synchronization

## Expected Results

- Admin login succeeds with valid credentials.
- Candidate can enter exam and save answers.
- When internet is disconnected, responses remain pending and local exam continues.
- On Node B failure, new responses are paused.

## Actual Results

The prototype has been implemented and smoke-tested locally in the working environment. This document notes the actual executed checks and any limitations. Because the environment is a demo setup, it is not a formal certification report.

## Known Defects

- This is a prototype rather than a production exam platform.
- Some flows are simulation-only and intentionally simplified.
