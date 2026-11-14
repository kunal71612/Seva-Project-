# 12 — Architecture Decisions

## Decision: SQLite for local prototype

SQLite is chosen for local demonstration due to ease of setup and zero external dependency. A Postgres configuration is also included as a development option for closer alignment with production architecture.

## Decision: explicit simulation of node states

The project simulates cloud and node states rather than pretending to deliver a real distributed cluster.

## Decision: hash-linked audit log

Hash chaining is included as a demonstration of tamper-evidence only; it does not guarantee secure storage.
