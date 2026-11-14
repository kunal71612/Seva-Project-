# 10 — Project Report

## Abstract

OneMind demonstrates a prototype examination center that remains operational during internet outages by buffering responses in a local backend and storing relevant events in an audit trail.

## Problem Definition

Examinations depend on resilient infrastructure. Current systems can lose continuity when internet or local servers fail.

## Proposed System

The proposed system uses a local backend with explicit state handling, simulated node health, optional synchronization, and auditable event chains.

## Methodology

The design is intentionally small and demonstrable. It deliberately avoids claiming production-grade failover while showing the core principle: local continuity with recovery controls.

## Implementation Details

- Frontend in React and Vite.
- Backend in Express and Prisma.
- Local SQLite storage for demo simplicity.
- Event logs and local response persistence.

## Limitations

- Single-machine simulation only.
- Not a production high-availability architecture.
- No real replication or quorum implementation.

## Future Scope

- Dockerized Postgres and cluster simulation.
- Real replication and failover logic.
- More complete administration workflows.
