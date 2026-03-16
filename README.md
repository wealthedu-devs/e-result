# Completeschoolresult (SmartResultChecker)

School result management system with **role-based dashboards** and **PIN-based public result checking**.

## Tech stack

- **Backend**: Node.js + Express (TypeScript)
- **Frontend**: React + Vite (TypeScript), Wouter routing, TanStack React Query
- **DB**: PostgreSQL (Neon/serverless compatible) via **Drizzle ORM**
- **Auth**: JWT (Bearer tokens) + bcrypt password hashing
- **UI**: Tailwind + Radix/shadcn components

## Repo layout

- `server/` — Express API, auth middleware, route handlers, DB access
  - `server/index.ts` — server entry
  - `server/routes.ts` — API routes (most business logic lives here)
  - `server/middleware/auth.ts` — JWT `authenticate` + role `authorize`
  - `server/db.ts` — Drizzle connection (uses `DATABASE_URL` or `DATABASE_URI`)
  - `server/storage.ts` — DB access layer (`IStorage` / `DatabaseStorage`)
- `client/` — React app
  - `client/src/App.tsx` — client router + protected-route wrapper
  - `client/src/lib/queryClient.ts` — API request helper + React Query config
- `shared/schema.ts` — Drizzle schema + Zod schemas + shared types
- `AUDIT_REPORT.md` — security/gating/logic audit and recommended fixes (now implemented)

## Environment variables

Backend requires a Postgres connection string and a JWT secret.

- **Database**
  - `DATABASE_URL` (preferred)
  - `DATABASE_URI` (supported fallback)
- **Auth**
  - `JWT_SECRET` (**required in production**)
- **Server**
  - `PORT` (defaults to `5000`)
  - `NODE_ENV` (`development` or `production`)

There is a `.env` file in the repo root; `server/db.ts` loads env via `dotenv/config`.

## Install & run (local)

Prerequisites:
- Install **Node.js (LTS)** which provides `node` and `npm`.
- Have a reachable Postgres database (local Docker, hosted, etc.).

Commands (PowerShell):

```powershell
cd "C:\Users\USER\Desktop\result\Completeschoolresult"
npm install
npm run db:push
npm run dev
```

Open:
- App: `http://localhost:5000`

Build + run production:

```powershell
npm run build
$env:NODE_ENV="production"
npm run start
```

## Roles & permissions

Roles used across API and UI:
- `super_admin`
- `school_admin`
- `teacher`

Server-side enforcement is done via:
- `authenticate` (JWT Bearer)
- `authorize(...roles)` (role checks)
- **school scoping** checks in handlers (e.g. resource `schoolId` must match `req.user.schoolId`)

## Main workflows

### Result workflow (student result records)
- Teacher creates results (`POST /api/results`) -> status `draft`
- Submit -> `submitted`
- School admin approves -> `approved`
- Optionally publish -> `published`
- Public result checking requires `approved` or `published`

### Result sheets (teacher class/subject submissions)
- Teacher creates a sheet for (class + subject + session + term)
- Submits for approval
- School admin approves (merges into per-student results)

### PINs
- School admins request PINs, super admins approve, or admins generate directly
- Public route `POST /api/public/check-result` validates PIN + admission number + session + term

## Audit fixes implemented (important for future agents)

The following were fixed based on `AUDIT_REPORT.md`:

- **JWT secret safety**: `JWT_SECRET` is required in production (`server/middleware/auth.ts`).
- **Inactive users blocked from login**: `POST /api/auth/login` checks `user.isActive`.
- **User update hardening**: `PATCH /api/users/:id` now whitelists updates; prevents role/school escalation.
- **Notification IDOR fixed**: `PATCH /api/notifications/:id/read` verifies ownership.
- **Super admin list gating**: `GET /api/classes` and `GET /api/subjects` require `schoolId` query param for super_admin.
- **Teacher assignments scoping**: `GET /api/teacher-assignments/:teacherId` is now school-scoped.
- **Self-approval blocked (POST approve)**: `POST /api/results/:id/approve` now blocks approving your own uploads.
- **PIN usage semantics fixed**:
  - Enforces `usageCount < maxUsageCount` on successful checks
  - Increments `usageCount` and sets `isUsed` only when exhausted
  - `maxAttempts` now counts **failed** attempts only
- **Result sheet grading fixed**: uses school-specific `gradeRanges` when computing grades.
- **PIN generation endpoint validated**: caps `quantity` (1–1000).
- **Class/subject creation validated**: `POST /api/classes` / `POST /api/subjects` now use Zod insert schemas.
- **Server error handler**: avoids `throw` after responding; sets env deterministically.
- **DB env compatibility**: `server/db.ts` accepts `DATABASE_URL` or `DATABASE_URI`.
- **Client protected route**: validates token with `/api/auth/me` and adds a basic role redirect for `/schools`.

## Testing / verification checklist

This project does not include an automated test suite; verification is primarily via:

- Typecheck:

```powershell
npm run check
```

- Build:

```powershell
npm run build
```

- Manual API checks (suggested):
  - Login with active and inactive users
  - `PATCH /api/users/:id` cannot change role/school as school_admin
  - `PATCH /api/notifications/:id/read` cannot mark others’ notifications
  - `GET /api/classes`/`subjects` as super_admin requires `?schoolId=...`
  - Public `POST /api/public/check-result`:
    - blocks after `usageCount >= maxUsageCount`
    - blocks after N failed attempts (`maxAttempts`)
    - increments `usageCount` on success

### Note about this environment

In the current workspace environment, `node`/`npm` were not available in PATH, so a full `npm install`, `npm run check`, and `npm run build` could not be executed here. After installing Node.js locally, the commands above should run.

## Where to continue (for AI agents)

- Start with `AUDIT_REPORT.md` for context.
- Key files to review:
  - `server/routes.ts` (API logic)
  - `server/storage.ts` (DB access + multi-tenant scoping)
  - `shared/schema.ts` (DB schema + Zod)
  - `client/src/App.tsx` (routing + auth bootstrap)

