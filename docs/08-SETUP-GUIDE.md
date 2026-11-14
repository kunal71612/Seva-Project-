# 08 — Setup and Installation Guide

## Prerequisites

- Node.js v18 or later
- npm
- Optional: Docker for local Postgres demonstration

## Installation

```bash
npm install
npm run db:push --workspace backend
npm run db:seed --workspace backend
npm run dev --workspace backend
npm run dev --workspace frontend
```

## Environment files

- Root `.env.example` contains sample environment values.
- Backend `.env.example` contains backend settings.

## Demo credentials

- Admin: `admin@onemind.local` / `Admin@123`
- Candidate: `CAND-101` / `Candidate@123`
