# 03 — System Architecture Document

## High-Level Architecture

The prototype keeps a local examination center operational even if the central cloud is unavailable. A browser-based candidate interface talks to a local backend, which stores exam and response data locally in a SQLite database via Prisma. System monitors model the cloud, Node A, Node B, and Node C states.

## Component Responsibilities

- Frontend: candidate and administrator interface.
- Backend API: user authentication, exam configuration, response validation.
- SQLite database: local storage for exam, session, and event state.
- Monitoring state: cloud and node health simulation and pause logic.

## Data Flow

1. Candidate logs in.
2. Session and questions are retrieved.
3. Answer events are saved locally.
4. If internet is available, responses are acknowledged.
5. If cloud is disconnected, responses remain pending for synchronization.

## Failure Handling

- Internet disconnect: continue exam locally.
- Node B offline: pause new response acknowledgement.
- Node C off: show witness/quorum warning.

## Mermaid Diagrams

```mermaid
flowchart LR
  User[Candidate/Administrator] --> FE[React Frontend]
  FE --> BE[Express Backend]
  BE --> DB[(SQLite via Prisma)]
  BE --> Monitor[Node Health Simulation]
  Monitor --> Cloud[Central Cloud]
  Monitor --> A[Node A Primary]
  Monitor --> B[Node B Standby]
  Monitor --> C[Node C Witness]
```

```mermaid
sequenceDiagram
  participant Candidate
  participant Browser
  participant Backend
  participant DB
  Candidate->>Browser: Select answer
  Browser->>Backend: Save response event
  Backend->>DB: Insert response + audit event
  Backend-->>Browser: Ack or pending sync status
```

```mermaid
flowchart TD
  Start[Internet disconnected] --> Continue[Continue exam locally]
  Continue --> Save[Store response in local queue]
  Save --> Reconnect[Internet restored]
  Reconnect --> Sync[Sync pending records]
```

```mermaid
flowchart TD
  A[Node B failure detected] --> Pause[Pause new responses]
  Pause --> Check[Validate redundancy state]
  Check --> Restore[Restore Node B and validate]
  Restore --> Resume[Resume candidate flow]
```
