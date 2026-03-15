# Codebase Audit Report — Completeschoolresult

This document itemizes **errors**, **gating/authorization issues**, **routing issues**, **security issues**, and **wrong logic** with suggested corrections.

---

## 1. Security issues

### 1.1 JWT secret default in production (Critical)
**Where:** `server/middleware/auth.ts`  
**Issue:** `JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"` — if `JWT_SECRET` is unset in production, tokens can be forged.  
**Fix:** In production, fail fast if `JWT_SECRET` is missing:
```ts
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production");
}
// then use JWT_SECRET || "dev-only-fallback" only when NODE_ENV !== "production"
```

### 1.2 Login does not check `user.isActive`
**Where:** `server/routes.ts` — `POST /api/auth/login`  
**Issue:** Inactive users (e.g. from public school registration) can still log in.  
**Fix:** After validating password, add:
```ts
if (!user.isActive) {
  return res.status(403).json({ message: "Account is pending approval" });
}
```

### 1.3 PATCH /api/users/:id — privilege escalation via body
**Where:** `server/routes.ts` — `app.patch("/api/users/:id", ...)`  
**Issue:** `storage.updateUser(req.params.id, req.body)` forwards the full body. A school_admin could send `{ role: "super_admin" }` or `{ schoolId: "other-school" }` and escalate privileges if the client sends it.  
**Fix:** Whitelist allowed fields and block sensitive ones:
```ts
const allowed = ['firstName', 'lastName', 'phoneNumber', 'isActive'] as const;
const updates: Record<string, unknown> = {};
for (const key of allowed) {
  if (req.body[key] !== undefined) updates[key] = req.body[key];
}
// Optionally: prevent school_admin from setting role or schoolId; only super_admin can.
if (req.user!.role === "school_admin") {
  delete updates.role;
  delete updates.schoolId;
}
const updated = await storage.updateUser(req.params.id, updates);
```

### 1.4 Notification read — IDOR
**Where:** `server/routes.ts` — `PATCH /api/notifications/:id/read` and `server/storage.ts` — `markNotificationRead(id)`  
**Issue:** Any authenticated user can mark any notification as read by ID; there is no check that the notification belongs to `req.user.id`.  
**Fix:** In the route, after fetching the notification, verify ownership:
```ts
const notification = await storage.getNotification(req.params.id); // add getNotification if needed
if (!notification || notification.userId !== req.user!.id) {
  return res.status(404).json({ message: "Notification not found" });
}
await storage.markNotificationRead(req.params.id);
```
Or implement `markNotificationRead(id: string, userId: string)` and update only when `notification.userId === userId`.

### 1.5 Public register-school — missing `subdomain` / `createdBy`
**Where:** `server/routes.ts` — `POST /api/public/register-school`  
**Issue:** `storage.createSchool({ name, code, email, ... })` does not set `subdomain` or `createdBy`. Schema has `subdomain` optional; if other code assumes subdomain exists, it can break.  
**Fix:** Either add subdomain to the public registration schema (e.g. optional or derived from code) and set it, or explicitly set `subdomain: null` and `createdBy: null` so the schema/DB contract is clear.

### 1.6 PUT /api/schools/:id — unvalidated body
**Where:** `server/routes.ts` — super_admin `PUT /api/schools/:id`  
**Issue:** `storage.updateSchool(req.params.id, req.body)` allows any field to be overwritten (e.g. `createdBy`). Prefer validating/whitelisting body for super_admin school updates.

---

## 2. Gating / authorization issues

### 2.1 GET /api/classes and GET /api/subjects — super_admin without schoolId
**Where:** `server/routes.ts`  
**Issue:** For super_admin, `schoolId = req.query.schoolId as string`; when `schoolId` is omitted it is `undefined`. Then `storage.listClasses(undefined)` / `listSubjects(undefined)` is called. Storage uses `eq(classes.schoolId, schoolId)`, which with `undefined` can match `school_id IS NULL` or behave inconsistently.  
**Fix:** Require `schoolId` for list when super_admin, or support “list all” explicitly in storage:
```ts
if (req.user!.role === "super_admin") {
  if (!req.query.schoolId) {
    return res.status(400).json({ message: "School ID required for super admin" });
  }
  schoolId = req.query.schoolId as string;
}
// Ensure schoolId is defined before calling listClasses(schoolId) / listSubjects(schoolId)
```

### 2.2 GET /api/teacher-assignments/:teacherId — no school scoping
**Where:** `server/routes.ts`  
**Issue:** Any authenticated user can call this with any `teacherId`. A teacher from school A could read assignments of a teacher in school B.  
**Fix:** Resolve the teacher’s school (e.g. via user record) and enforce:
- Either restrict this route to `authorize("school_admin")` and ensure `teacherId` is in the same school as `req.user.schoolId`, or  
- If teachers can call it, ensure the requested teacher belongs to `req.user.schoolId`.

### 2.3 POST /api/results/:id/approve — self-approval allowed
**Where:** `server/routes.ts` — POST version of approve (around line 2284)  
**Issue:** The PATCH handler blocks “approve your own results” (`existing.uploadedBy === req.user!.id`). The POST handler does not; school_admin can approve their own uploads.  
**Fix:** Add the same check to the POST approve handler:
```ts
if (result.uploadedBy === req.user!.id) {
  return res.status(403).json({ message: "Cannot approve your own results" });
}
```

### 2.4 Duplicate result workflow (PATCH vs POST)
**Where:** `server/routes.ts`  
**Issue:** Result lifecycle actions exist twice: PATCH and POST for submit/approve/reject/comment (e.g. PATCH `.../submit` vs POST `.../submit`). They differ slightly (e.g. PATCH submit is teacher-only; POST submit allows school_admin too). This is confusing and can lead to inconsistent policy.  
**Fix:** Pick one verb (e.g. PATCH for state transitions) and one set of role rules; remove the duplicate routes or document and align behavior.

---

## 3. Routing / app configuration issues

### 3.1 Global error handler never used by route handlers
**Where:** `server/index.ts`  
**Issue:** The global error handler is registered after `registerRoutes(app)`. Route handlers use try/catch and send `res.status(...).json(...)` and never call `next(err)`, so the global handler only runs for errors that escape as thrown exceptions.  
**Fix:** Either pass errors to Express with `next(err)` in catch blocks so the global handler can format them, or remove the global handler and rely on per-route handling. If keeping it, avoid `throw err` after `res.status(...).json(...)` to prevent double response or unhandled rejection.

### 3.2 Vite/static never runs if env !== "development"
**Where:** `server/index.ts`  
**Issue:** `if (app.get("env") === "development")` — `app.set("env", ...)` is commented out, so `app.get("env")` is Express’s default (e.g. "development" only when NODE_ENV is not "production"). So in production, `serveStatic(app)` runs; in development it depends on default.  
**Fix:** Set env explicitly so behavior is predictable, e.g.:
```ts
app.set("env", process.env.NODE_ENV || "development");
```
and uncomment the line if you want Vite only in development.

### 3.3 Client protected routes — no role-based route restriction
**Where:** `client/src/App.tsx`  
**Issue:** `ProtectedRoute` only checks presence of `user` and `token` in localStorage. It does not validate the token with `/api/auth/me` on load, and there is no role-based restriction (e.g. /schools only for super_admin). A tampered localStorage could show UI for routes the API would reject with 403.  
**Fix:** Optionally call `/api/auth/me` on app load and redirect to login on 401; optionally add role-based route wrappers that redirect (e.g. school_admin/teacher away from /schools) so UX matches API policy.

---

## 4. Wrong logic / bugs

### 4.1 PIN usage limit — maxAttempts vs maxUsageCount/usageCount
**Where:** `server/routes.ts` — `POST /api/public/check-result` and schema `shared/schema.ts`  
**Issue:** The schema has both `maxAttempts` (default 3) and `maxUsageCount`/`usageCount`. The check-result handler uses `pinRecord.maxAttempts` and the length of `attempts` array to block (“maximum usage limit”). It never increments `usageCount` and never checks `usageCount < maxUsageCount`. So multi-use PINs (maxUsageCount > 1) are not enforced; the UI shows “Usage: X / Y” but the backend does not update or respect `usageCount`.  
**Fix:** Decide semantics:
- **Option A:** “maxUsageCount” = number of successful checks allowed. On successful result return, increment `usageCount` (and optionally set `isUsed = true` only when `usageCount >= maxUsageCount`). Before allowing a check, require `pinRecord.usageCount < pinRecord.maxUsageCount`. Use `maxAttempts` only for limiting failed attempts (e.g. lock after N failures).
- **Option B:** Use only `attempts.length` and `maxAttempts` for “total attempts” (success + failure) and remove or repurpose `usageCount`/`maxUsageCount` in the check-result flow.

Then implement one consistently in check-result and PIN creation/approval.

### 4.2 Result-sheet grades use default ranges instead of school’s
**Where:** `server/routes.ts` — result-sheet create/update (e.g. lines 505–517, 549–562, 804–923)  
**Issue:** `getSchoolGradeRanges(req.user!.schoolId!)` is used for single result creation, but result-sheet entries use `calculateGrade(total)` and `getGradeRemarkFromTotal(total)` with no second argument, so they always use `DEFAULT_GRADE_RANGES`. Schools with custom grade ranges get wrong grades on result sheets.  
**Fix:** Fetch school grade ranges once per request and pass them into the helpers when building result-sheet entries:
```ts
const gradeRanges = await getSchoolGradeRanges(req.user!.schoolId!);
// ...
const grade = calculateGrade(total, gradeRanges);
const remark = getGradeRemarkFromTotal(total, gradeRanges);
```
Apply in all three places where result-sheet entries are created/updated (create sheet, update entries, POST create with entries).

### 4.3 Pins POST — quantity not validated
**Where:** `server/routes.ts` — `POST /api/pins`  
**Issue:** `for (let i = 0; i < quantity; i++)` — if `quantity` is missing, NaN, or very large, the loop can run 0 or millions of times (DoS / resource exhaustion).  
**Fix:** Validate and cap quantity:
```ts
const quantity = Math.min(1000, Math.max(1, parseInt(req.body.quantity) || 0));
if (quantity <= 0) {
  return res.status(400).json({ message: "Valid quantity (1–1000) is required" });
}
```

### 4.4 Public check-result — PIN update overwrites usage tracking
**Where:** `server/routes.ts` — after successful result fetch, `storage.updatePin(pinRecord.id, { isUsed: true, attempts: [...], usedBy: {...} })`  
**Issue:** Setting `isUsed: true` after first successful use prevents any further use, even when `maxUsageCount` > 1. If you adopt Option A in 4.1, you should not set `isUsed: true` until `usageCount >= maxUsageCount`, and should increment `usageCount` instead of (or in addition to) appending to `attempts`.

### 4.5 createClass / createSubject — req.body spread
**Where:** `server/routes.ts` — `POST /api/classes`, `POST /api/subjects`  
**Issue:** `storage.createClass({ ...req.body, schoolId, createdBy })` and similar for subjects. Required fields (e.g. `level`, `grade`, `academicYear` for classes) are not validated; missing or invalid values can cause DB errors or 500s.  
**Fix:** Validate with Zod (e.g. `insertClassSchema`/`insertSubjectSchema`) and pass only validated + server-set fields (e.g. `schoolId`, `createdBy`) into storage.

### 4.6 ZodError response shape
**Where:** `server/routes.ts` — `POST /api/public/register-school` catch block  
**Issue:** `return res.status(400).json({ message: error.errors[0]?.message || "Validation failed" })` — Zod’s `error.errors[0].message` is the default message; for nested paths the first error might not be the clearest.  
**Fix:** Optionally use `error.flatten()` or `error.format()` to return structured validation errors so the client can show field-level messages.

---

## 5. Summary table

| # | Category   | Severity  | Summary |
|---|------------|-----------|---------|
| 1.1 | Security   | Critical  | JWT_SECRET default in production |
| 1.2 | Security   | High      | Login does not check isActive |
| 1.3 | Security   | High      | PATCH users/:id allows privilege escalation via body |
| 1.4 | Security   | Medium    | Mark notification read — IDOR |
| 1.5 | Security   | Low       | Public register-school missing subdomain/createdBy |
| 1.6 | Security   | Low       | PUT schools/:id unvalidated body |
| 2.1 | Gating     | High      | GET classes/subjects with undefined schoolId for super_admin |
| 2.2 | Gating     | Medium    | GET teacher-assignments/:teacherId not scoped to school |
| 2.3 | Gating     | Medium    | POST result approve allows self-approval |
| 2.4 | Gating     | Low       | Duplicate PATCH/POST result workflow |
| 3.1 | Routing    | Low       | Global error handler not used by routes |
| 3.2 | Routing    | Low       | app env not set — Vite/static logic depends on default |
| 3.3 | Client     | Low       | No token re-validation or role-based route guard |
| 4.1 | Logic      | High      | PIN maxUsageCount/usageCount not used in check-result |
| 4.2 | Logic      | High      | Result-sheet grades ignore school grade ranges |
| 4.3 | Logic      | Medium    | PIN quantity not validated/capped |
| 4.4 | Logic      | Medium    | check-result sets isUsed=true ignoring maxUsageCount |
| 4.5 | Logic      | Medium    | createClass/createSubject body not validated |
| 4.6 | Logic      | Low       | ZodError response could be more informative |

---

## 6. Suggested order of fixes

1. **Immediate:** 1.1 (JWT_SECRET), 1.2 (isActive on login), 1.3 (PATCH users whitelist), 2.1 (classes/subjects schoolId), 4.1/4.4 (PIN usage semantics), 4.2 (result-sheet grade ranges).  
2. **Next:** 1.4 (notification IDOR), 2.2 (teacher-assignments), 2.3 (POST approve self-approval), 4.3 (PIN quantity), 4.5 (class/subject validation).  
3. **Then:** 2.4 (deduplicate result workflow), 3.1–3.3 (error handler, env, client auth), 1.5–1.6, 4.6.

If you want, I can implement specific fixes (e.g. 1.1, 1.2, 4.2, 2.1) directly in the repo.
