# 08 — Setup & Installation Guide

**Project:** OneMind  
**Platform:** Windows, macOS, Linux, Cloud (Vercel)  
**Runtime:** Node.js v18+ (Tested on Node v20/v24)  
**Version:** 1.0.0  

---

## 1. Prerequisites

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Git**

---

## 2. Quickstart Installation (Single Command)

From the project root:

```bash
# 1. Install root, backend, and frontend packages (without Windows symlink issues)
npm --prefix backend install --workspaces=false
npm --prefix frontend install --workspaces=false
npm install --workspaces=false

# 2. Push database schema & generate Prisma client
npm run db:push
npm run db:seed

# 3. Build production bundles
npm run build
```

---

## 3. Running the Application

### 3.1 Development Mode (Concurrent Backend + Frontend)

```bash
npm run dev
```

- **Backend API:** `http://localhost:4000`
- **Frontend Web UI:** `http://localhost:5173`

---

## 4. Running Automated Tests

To execute the 18-point integration test suite:

```bash
npm test
```

---

## 5. Pre-Seeded Demonstration Accounts

| Role | Identifier / Email | Password / Passcode | Purpose |
|---|---|---|---|
| **Administrator** | `admin@onemind.local` | `Admin@123` | Control panel, exam creation, candidate assignment, failure controls. |
| **Candidate 1** | `CAND-101` | `Candidate@123` | Aisha Rahman — Active demo candidate assessment. |
| **Candidate 2** | `CAND-102` | `Candidate@123` | Mehul Nair — Secondary candidate for concurrency testing. |
| **Candidate 3** | `CAND-103` | `Candidate@123` | Priya Sharma — Candidate for fresh session demonstration. |

*(Note: The login interface features one-click quick-fill buttons for immediate evaluation).*

---

## 6. Deploying to Vercel

OneMind is configured as a Vercel Services project with separate `backend` and `frontend` services. Keep the Vercel project root directory set to the repository root so both service roots and the root `vercel.json` are available.

### Method A: Deploy via Vercel CLI (Fastest)

```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Deploy from the project root
vercel
```

Follow the prompts:
- **Set up and deploy?** [Y]
- **Which scope?** (Select your account)
- **Link to existing project?** [N]
- **What’s your project’s name?** `onemind-seva`
- **In which directory is your code located?** `./` (repository root)

### Method B: Deploy via GitHub & Vercel Web Dashboard

1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your GitHub repository (`Seva-Project-`).
4. Vercel automatically detects `vercel.json`:
   - `backend/` builds as the Express service.
   - `frontend/` builds as the Vite service.
   - Public `/api/*` routes go to the backend; other routes go to the frontend.
5. Click **Deploy**.

The frontend calls `/api` on the same public origin; no service binding is needed because there are no server-to-server HTTP calls. The backend bundles the seeded SQLite database and copies it to `/tmp` at startup. That storage is ephemeral, so configure a persistent hosted database for production.
