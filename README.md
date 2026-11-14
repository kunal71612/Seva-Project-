# OneMind

OneMind is a lightweight examination continuity prototype designed for the Seva Innovation Challenge 2026. It demonstrates offline-first examination continuity, response reliability, and fault simulation for local examination centers that may lose internet connectivity or face local server failures.

## Features

- Administrator dashboard for creating exams and registering candidates.
- Candidate assessment flow with question navigation and response status.
- Offline continuity simulation with local pending response retention.
- Node monitoring for Cloud, Node A, Node B, and Node C.
- Audit event hashing to show tamper-evidence concepts.
- SQLite local persistence for the prototype with Prisma ORM.

## Project structure

- `frontend/` — React + TypeScript + Vite client
- `backend/` — Express + TypeScript API
- `docs/` — project documentation and reports
- `docker-compose.yml` — optional Postgres service for local demo

## Quick start

1. Install dependencies:
   npm install
2. Start the backend:
   npm run dev --workspace backend
3. Start the frontend:
   npm run dev --workspace frontend
4. Open the app at http://localhost:5173

## Demo credentials

- Admin: `admin@onemind.local` / `Admin@123`
- Candidate: `CAND-101` / `Candidate@123`

## Important note

This prototype uses a single-machine simulation to demonstrate the concept. It is not a production-grade high-availability system and should be treated as a credible educational MVP rather than an industrial deployment.
