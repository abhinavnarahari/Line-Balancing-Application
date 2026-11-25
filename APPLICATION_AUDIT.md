# Application Audit & Fix Tracker — SewNex / QTech Line Balancing

Last updated: 2026-10-21 · Baseline commit: `9fc0e4c`

This file is the single source of truth for the audit. Update the **Status** column and the
**Progress log** as work proceeds.

---

## 1. Architecture overview

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 19, Vite 8, TypeScript 6, react-router 7, axios, Tailwind 4, xlsx 0.18.5 | SPA served by nginx (`frontend/nginx.conf`); `/api` proxied to backend |
| Backend | Spring Boot 3.5.3, Java 21, Spring Data JPA (Hibernate 6.6, `ddl-auto=validate`), Flyway, Lombok | 24 REST controllers, all under `/api/**`, responses wrapped in `ApiResponse` |
| Database | PostgreSQL 16 | Schema + sample data via Flyway `V1..V66` (`backend/src/main/resources/db/migration`) |
| SewNexa AI | Deterministic grounded assistant over the app database (see section 6); optional OpenAI-compatible LLM used only to route questions | LLM routing disabled when `LLM_API_KEY` is a placeholder |
| Deployment | Docker Compose on a DigitalOcean droplet (2 vCPU / 2 GB) | `postgres`, `backend` bound to 127.0.0.1; `frontend` public on 80/3000 |

**Request flow:** Browser → nginx (`frontend` container) → `/api/*` → Spring controller → service
(`@Transactional`) → JPA repository → Postgres. The axios interceptor in `frontend/src/lib/api.ts`
unwraps `ApiResponse.data`.

### Modules (backend package → responsibility)

| Module | Responsibility |
|---|---|
| `operator`, `operator/attachment` | Operator master data, document attachments (stored as `bytea`) |
| `operation`, `size`, `style`, `shift`, `machine`, `line` | Master data (operations + affinities, sizes, styles, shifts with breaks, machines, sewing lines) |
| `shiftassignment`, `attendance` | Operator ↔ shift assignment; daily attendance (manual + "biometric sync") |
| `skillmatrix` | Skill assessments, performance tests/logs, history |
| `order` | Production orders with size breakdown |
| `operationbulletin` | Operation bulletins (OB): operations sequence, SMV, revisions, status workflow |
| `capacity`, `linedesign`, `linebalance`, `engine` | Capacity planning, line design, balancing algorithms (precedence, multi-objective optimizer) |
| `lineplan`, `hourly`, `production` | Line plans/assignments, hourly production board, piece production logs |
| `allocation` | Multi-line operator allocation optimizer, pool, runs, overrides, audit |
| `notification` | Bottleneck / lateness alerts |
| `chatbot` | SewNexa AI: entity catalog + question analyzer, read-only skills per intent, conversation state (section 6) |
| `common` | CORS, global exception handler, entity audit log, demo-data refresher |

Frontend features mirror these modules under `frontend/src/features/*` with pages in `frontend/src/pages/*`.

### Baseline verification (before any fix)

| Check | Result |
|---|---|
| Backend `mvn test` | 19 tests, 0 failures (note: `PersistRunIntegrationTest` and `ChatbotServiceTest` need a live local Postgres and write to it) |
| Frontend `vite build` | Passes (but `vite build` does not type-check) |
| Frontend `tsc -p tsconfig.app.json --noEmit` | **32 errors** (23 unused symbols, 9 real type errors) |
| `oxlint` | **8 errors** (conditional hooks in `ManualOverrideModal.tsx`) + 107 warnings |
| `npm audit --omit=dev` | 5 high: `xlsx` (no npm fix), `vite`/launch-editor (dev server only) |
| Frontend tests | None exist |

---

## 2. Prioritised issue list

Severity: **C** Critical · **H** High · **M** Medium · **L** Low.
Approval column: ✋ = changes security model, production data or business rules — needs owner approval before implementing.

### P1 — Security, data corruption, application-breaking

| ID | Sev | Title | Files | Root cause / evidence | Impact | Proposed fix | Approval | Status |
|---|---|---|---|---|---|---|---|---|
| SEC-01 | C | No server-side authentication/authorization | `backend/pom.xml` (no spring-security), `frontend/src/features/auth/AuthContext.tsx:43-91`, `LoginPage.tsx:27` | Login is simulated in the browser; password never checked; role stored in localStorage; API has no auth | Anyone reaching the droplet can read/modify/delete all data with curl | Spring Security + users table + JWT/session; frontend sends token; role checks server-side. Interim: nginx basic auth | ✋ | **Fixed ✔** (round 2) |
| SEC-02 | C | Chatbot SQL tool can execute write/side-effect functions | `chatbot/agent/EnterpriseToolsService.java:24-60`, `ChatbotService.java:39` | Keyword blocklist only; `readOnly=true` ignored because it joins the caller's read-write transaction; DB user is superuser | Prompt injection → `setval`, `pg_read_file`, `pg_terminate_backend`, `pg_sleep`, writing functions | Run in `REQUIRES_NEW` read-only tx with `SET TRANSACTION READ ONLY` + `statement_timeout`; block system/admin functions & multi-statements; don't return raw DB errors | – | **Fixed ✔** |
| DB-01 | C | Seed migrations delete/overwrite data if re-applied | `V43, V59, V60, V62, V65`; `application.yml` flyway `baseline-on-migrate/out-of-order=true, validate-on-migrate=false` | Demo seeds run unconditional `DELETE`s; config allows re-baseline and out-of-order replay | Restore without `flyway_schema_history` or a new `V54–V56` → wipe of real orders/bulletins/plans/skills | Move demo seeds to a demo-only Flyway location for fresh installs; set `out-of-order=false`; never DELETE in versioned migrations | ✋ | **Fixed ✔** (round 2) |
| DB-02 | C | GET endpoints fabricate attendance | `attendance/service/AttendanceService.java:38-75`, `allocation/service/OperatorPoolService.java:53-55` | Viewing a date with no attendance persists a hard-coded PRESENT/ABSENT pattern | Fake attendance for any viewed or planned (future) date mixes with real data | Make GETs read-only; leave baseline only to demo refresher (`DEMO_DATA_DAILY_REFRESH`) | ✋ (changes demo behaviour) | **Fixed ✔** (round 2) |
| SEC-03 | H | CORS wildcard with credentials | `common/config/CorsConfig.java`, `docker-compose.yml` (`CORS_ALLOWED_ORIGINS:-*`) | `allowedOriginPattern("*")` + `allowCredentials(true)` reflects any origin | Any website can drive the API from a victim browser once auth exists | Disable credentials when wildcard is used | – | **Fixed ✔** |

### P2 — Major functional defects

| ID | Sev | Title | Files | Root cause / evidence | Impact | Proposed fix | Approval | Status |
|---|---|---|---|---|---|---|---|---|
| FUNC-01 | H | Creating a bulletin revision always fails (409) | `OperationBulletinService.java:141-150`, `V10:20` | Revision copies `bulletin_code` + `version`; unique `(bulletin_code, version)` | Revisions feature unusable | V67: unique key `(bulletin_code, version, revision_number)` | – | **Fixed ✔** |
| FUNC-02 | H | Editing a shift assignment → 405; status badges/actions never render | `features/shift-assignments/api.ts:10,30`, `AssignmentList.tsx`, `ShiftAssignmentController.java` | No `PUT /{id}` endpoint; frontend expects `Active` while backend sends `ACTIVE` | Assignment lifecycle management broken | Add `PUT /api/shift-assignments/{id}`; use backend enum casing in frontend | – | **Fixed ✔** |
| FUNC-03 | H | Skill Matrix Logs page always empty | `pages/workforce/SkillMatrixLogsPage.tsx:27-29` | Double unwrap (`res.data.data`) after interceptor already unwrapped | History never visible | Use interceptor result directly | – | **Fixed ✔** |
| FUNC-04 | H | Production Monitoring page loses an in-progress piece entry on window focus | `utils/masterDataEvents.ts:85-88`, `ProductionMonitoringPage.tsx:88,131,827` | Focus refresh sets `loading=true` → full-page spinner unmounts the open modal | Supervisor's typed entries lost | Background refresh without toggling the full-page loader | – | **Fixed ✔** |
| FUNC-05 | H | "Today" computed in UTC in the frontend (52 places) | e.g. `RecordPieceModal.tsx:45`, `AttendancePage.tsx:46`, dashboards | `new Date().toISOString().split("T")[0]` | 00:00–05:30 IST defaults to yesterday (attendance, piece logs, dashboards) | Shared `localToday()` helper | – | **Fixed ✔** |
| FUNC-06 | H | Released bulletins editable; any status transition allowed | `OperationBulletinService.java:89-137` | No status guard; `update()` sets status directly | SMV changes on live bulletins silently change targets | Edit only DRAFT; transition table | ✋ (business rule) | **Fixed ✔** (round 2) |
| FUNC-07 | H | Hourly board GET mutates/creates line plans; duplicate plans break `findByOrderId` | `HourlyProductionService.java:53-55,185-282`, `V16` | Read endpoint does find-or-create, changes shift, falls back to unrelated bulletin; no `UNIQUE(order_id)` | Silent plan changes; 500s after a duplicate | Read-only board; unique constraint after dedupe | ✋ (prod data) | **Fixed ✔** (round 2) |
| FUNC-08 | M | Optimizer ignores user-tuned weights | `OptimizationSolverStep.tsx:114`, `OptimizationRequestDTO.java` | DTO has no `weights` field | Sliders have no effect | Add weights to DTO + engine, or remove sliders | ✋ (algorithm behaviour) | **Fixed ✔** (round 2) |
| FUNC-09 | M | Lines page "Recent Activity" always empty | `LinesPage.tsx:394`, `lib/audit.ts:17-18`, `EntityAuditListener.java:36` | Frontend sends `Sewing_line`, backend stores `SewingLine` | No audit trail shown | Pass PascalCase entity name through unchanged | – | **Fixed ✔** |
| FUNC-10 | L | Seed line plan status `'RELEASED'` outside the `draft/active/completed` vocabulary | `V65:460-471` | Mixed casing/vocabulary | LINE-02 plan not detected as active | V67 normalises existing `RELEASED` plans to `active` | – | **Fixed ✔** |

### P3 — API / validation / integration

| ID | Sev | Title | Files | Root cause | Impact | Proposed fix | Approval | Status |
|---|---|---|---|---|---|---|---|---|
| API-01 | M | Client errors returned as 500; validation details dropped; internal messages leaked | `GlobalExceptionHandler.java`, `ShiftController.java:60` | Catch-all handler; `errors` map built but not returned | Users can't see which field failed; monitoring noise | Specific 4xx handlers; return field errors; generic message in ShiftController | – | **Fixed ✔** |
| API-02 | M | Missing `@Valid` on request bodies | `OperatorAllocationController`, `NotificationController`, `SkillMatrixController` | Annotation missing | Invalid input → NPE/500 | Add `@Valid` | – | **Fixed ✔** (narrowed: allocation/notification DTOs declare no constraints, so only the batch performance-log endpoint needed `@Valid`) |
| API-03 | M | Piece production logs accept negative / inconsistent quantities | `PieceProductionLogRequest`, `PieceProductionService.java:125-128` | No bounds or consistency checks | Negative output, good > completed corrupt efficiency | `@PositiveOrZero`, `good + reject ≤ completed` check | – | **Fixed ✔** |
| API-04 | M | Attachment upload/download hardening | `OperatorAttachmentService.java:84-88`, `OperatorAttachmentController.java:42-43` | No type/size checks; header built by concatenation; stored content-type trusted | Header injection, 500 on bad type, >1 MB upload → 500 | Safe `ContentDisposition`; fallback content type; multipart limits; 413 handler | – | **Fixed ✔** (download hardening; type allow-list left to owner) |
| SEC-04 | L | Actuator `metrics` exposed | `application.yml` | `include: health,info,metrics` | Possible info disclosure via proxy path tricks | Expose `health` only | – | **Fixed ✔** |
| BE-01 | M | Duplicate "late" notifications on every re-save | `AttendanceService.java:135-139` | Notifies on every upsert with LATE | Alert spam | Notify only on transition to LATE | – | Not a defect — `NotificationService.createLateAttendanceNotification` already dedupes per attendance record; documented by `LateNotificationDedupTest` |
| BE-02 | M | Chatbot holds DB connection during LLM HTTP calls | `ChatbotService.java:39` | Whole `processMessage` is `@Transactional` | 10 concurrent chats exhaust Hikari pool | Narrow transaction scope | – | **Fixed ✔** (round 2) |
| BE-03 | M | Bulk import non-atomic, no row validation | `OperatorsPage.tsx:88-99`, `ShiftsPage.tsx:115-121` | Rows created one by one | Partial imports | Validate first, then submit; backend batch endpoint | – | **Fixed ✔** (round 2) |

### P4 — Performance / reliability

| ID | Sev | Title | Root cause | Proposed fix | Status |
|---|---|---|---|---|---|
| PERF-01 | M | Allocation optimizer N+1 (~18k queries per run) | `performanceService.evaluate` per slot×operator | Bulk-load into maps | **Fixed ✔** (round 2) |
| PERF-02 | M | Chatbot retrieval `findAll()` inside loops; `lines.get(0)` crash when empty | `ChatDataRetrievalService.java:457,505,657,1642` | Aggregate queries; empty guard | **Fixed ✔** (round 2) |
| PERF-03 | M | Heavy polling on every page (10 s / 12 s / 8 s, all logs ever) | `TodayImmediateActionsNavButton`, `NotificationBell`, `LineBalancePage:703` | Date-filtered calls; pause when hidden | **Fixed ✔** (round 2) |
| PERF-04 | M | Single 2.1 MB JS bundle | No route-level code splitting | `React.lazy` per route; dynamic `import("xlsx")` | **Fixed ✔** (round 2) |
| REL-01 | M | No optimistic locking | No `@Version` | Add `@Version` + 409 mapping (requires frontend to send version) ✋ | **Fixed ✔** (round 2) |
| REL-02 | M | Silent load/save failures; no request timeout; save buttons not disabled | `lib/api.ts`, multiple forms | Timeout, error surfacing, saving state | **Fixed ✔** (round 2) |
| REL-03 | M | Operator pool picks oldest assignment; bounded overlapping assignments allowed | `OperatorPoolService.java:63-68`, `ShiftAssignmentService.java:53-58` | Use `findCurrentAssignment`; overlap validation | **Fixed ✔** (round 2) |
| REL-04 | M | Order delete allowed in production; cascades erase hourly history | `OrderService.delete`, V24/V26 cascades | Status guard + RESTRICT FKs (V72) | **Fixed ✔** (round 2) |
| DB-03 | L | Missing FK indexes (`piece_production_logs.order_id`, `line_plan_assignments.*`, `line_plans.line_id`) | V16/V24 | Index migration | **Fixed ✔** (round 2) |
| SEC-05 | M | `xlsx` 0.18.5 vulnerable (prototype pollution, ReDoS) | npm package unmaintained | Switch to SheetJS CDN build 0.20.3 ✋ (dependency source change) | **Fixed ✔** (round 2) |

### P5/P6 — Code quality, tests, UX

| ID | Sev | Title | Proposed fix | Status |
|---|---|---|---|---|
| CQ-01 | M | 32 TypeScript errors; build doesn't type-check | Fix errors; add `tsc` to build | **Fixed ✔** |
| CQ-03 | M | Conditional hooks in `ManualOverrideModal` (lint errors; latent crash if mounted with null assignment) | Guard in wrapper component | **Fixed ✔** |
| OPT-01 | M | Global pool optimizer ignores `plannedEfficiency` and the "+" in `3_PLUS`/`4_PLUS` skill requirements (`globalPoolOptimizer.ts`) | Decide intended algorithm behaviour, then implement + test | Resolved (round 2): '+' ratings already worked (not a defect); unused plannedEfficiency parameter removed |
| TEST-02 | L | `PersistRunIntegrationTest` commits an allocation run into the local dev DB on every `mvn test` | Make it `@Transactional` or use a disposable DB | **Fixed ✔** (round 2) |
| TEST-01 | M | Integration tests need live DB and write to it; no frontend tests; no tests for order/bulletin/attendance/production | Testcontainers or H2 profile; add service tests | **Fixed ✔** (round 2) |
| UX-01 | L | Modal lacks `role="dialog"`, Esc, focus trap; icon-only buttons without labels | A11y pass on shared `Modal` | **Fixed ✔** (round 2) |
| UX-02 | L | Logout leaves app data in localStorage | Clear app key prefix | **Fixed ✔** (round 2) |
| CQ-02 | L | `prod` profile set but no `application-prod.yml`; dead `pages/Dashboard` | Cleanup | **Fixed ✔** (round 2) |

---

## 3. Fix log (problem → change → verification)

| ID | Files changed | Change | Verification (actual result) |
|---|---|---|---|
| SEC-02 | `chatbot/agent/EnterpriseToolsService.java` | LLM SQL now runs via `queryInReadOnlyTransaction`: new `REQUIRES_NEW` transaction, `SET TRANSACTION READ ONLY`, `statement_timeout 5s`, always rolled back. Rejects multi-statements/comments, admin/system functions (`pg_*`, `lo_*`, `dblink`, `set_config`, `setval`, `nextval`, `query_to_xml`…), sensitive catalogs, quoted/Unicode-escaped identifier tricks. Row cap enforced by wrapping (`SELECT * FROM (…) LIMIT 50`). Error text trimmed to first line of root cause. | New `EnterpriseToolsServiceSqlSafetyTest` (4 tests) incl. proof that Postgres rejects `nextval` inside the read-only tx and the sequence is unchanged; `ChatbotServiceTest` 6/6 still pass |
| SEC-03 | `common/config/CorsConfig.java` | Wildcard origin ⇒ `allowCredentials(false)`; explicit origins keep credentials | `CorsConfigTest`: preflight from foreign origin has `Allow-Origin: *` and no `Allow-Credentials` |
| SEC-04 | `application.yml` | Actuator exposes only `health` | `ActuatorExposureTest`: liveness 200, metrics/info 404 |
| API-01 | `common/exception/GlobalExceptionHandler.java`, `common/response/ApiResponse.java`, `shift/controller/ShiftController.java` | 404/405/400/413/415 for Spring MVC errors instead of 500; malformed JSON / type mismatch → 400; validation returns per-field map in `data` and names fields in `message`; method-validation handler; ShiftController no longer leaks exception text/class | `GlobalExceptionHandlerTest` (6 tests); live: oversized upload → 413 `Maximum upload size exceeded`, missing param → 400 naming the parameter |
| API-02 | `skillmatrix/controller/SkillMatrixController.java` | `@Validated` + `List<@Valid PerformanceLogRequest>` on batch endpoint (both frontend callers already send all required fields) | Test: invalid batch item → 400 with field message |
| FUNC-01 | `V67__allow_bulletin_revisions_same_code_version.sql`, `OperationBulletinRepository`, `OperationBulletinService.update` | Unique key now `(bulletin_code, version, revision_number)`; update duplicate-check includes revision number | `BulletinRevisionTest`: two consecutive revisions flushed to DB, revision editable; V67 applied cleanly to local DB |
| FUNC-02 | `ShiftAssignmentController/Service` (new `PUT /api/shift-assignments/{id}`), `features/shift-assignments/api.ts`, `AssignmentList.tsx` | Update endpoint with same rules as create; frontend uses backend enum casing `ACTIVE/SCHEDULED/COMPLETED` | `ShiftAssignmentUpdateTest`; live PUT returns 400 on empty body (was 405); tsc clean |
| FUNC-03 | `pages/workforce/SkillMatrixLogsPage.tsx` | Use interceptor-unwrapped array | Live API returns `{data:[…]}` with matching fields; route renders without errors |
| FUNC-04 | `ProductionMonitoringPage.tsx`, `production-logs/RecordPieceModal.tsx` | Background refreshes don't toggle full-page spinner; modal form resets only on open/target change, not on list re-fetch (second root cause found during verification) | Browser test (Edge/Playwright): open modal, type 77, fire `focus`, value still 77 — failed before the modal fix, passes 5/5 after |
| FUNC-05 | new `utils/date.ts` + 33 files | `toLocalDateString()` replaces UTC `toISOString()` dates (42 direct + 5 variants). Date-stepping handlers left as-is (correct for IST) | Under `TZ=Asia/Kolkata` at 01:00 IST: old → 2026-10-20, new → 2026-10-21 |
| FUNC-09 | `lib/audit.ts` | `SEWING_LINE` → `SewingLine` (PascalCase) mapping | Live: every mapped entity name returns audit rows (SewingLine: 10) |
| FUNC-10 | `V68__normalize_line_plan_status.sql` | `RELEASED` line plans → `active` | Dry-run in rolled-back tx (1 row), then applied by Flyway in test run |
| API-03 | `PieceProductionLogRequest`, `PieceProductionService` | `@PositiveOrZero` on quantities; good + reject must equal completed (same rule as UI) on create and update | `PieceProductionValidationTest` (3 tests) |
| API-04 | `OperatorAttachmentController.java` | `ContentDisposition` builder (RFC 5987 encoding), safe media-type parse, active types served as octet-stream, `nosniff` | `AttachmentDownloadTest` (3 tests): HTML upload served as octet-stream with safe header; malformed type still downloads; PDF keeps type |
| CQ-01 | 13 frontend files, `package.json` | 0 tsc errors; `build` now runs `tsc` first (also in Docker build). Real bugs fixed along the way: Plant dashboard showed fake machine type / certification date (fields don't exist in API); crash risks on `primarySkill`/`totalQuantity` undefined; dead `CANCELLED` comparison | `tsc` 0 errors; `npm run build` passes |
| CQ-03 | `ManualOverrideModal.tsx` | Null guard moved to wrapper component | `oxlint` 0 errors (was 8); tsc clean (not exercised in browser — needs a full optimisation run) |
| BE-01 | — (change reverted) | Investigation showed existing dedupe; speculative change removed | `LateNotificationDedupTest` passes against original code |

## 4. Final verification (2026-10-21)

| Check | Result |
|---|---|
| Backend `mvn test` | **40 tests, 0 failures** (19 original + 21 new) |
| Frontend `tsc` | **0 errors** (was 32) |
| Frontend `npm run build` | Passes (now includes type-check) |
| `oxlint` | **0 errors** (was 8), 105 warnings (was 107) |
| Live API smoke (local backend, 27 GET endpoints) | All 200 except 2 expected 4xx with clear messages (missing required param; non-existent order id) |
| Browser smoke (Edge, 28 routes) | 0 uncaught JS errors, 0 API 5xx |
| FUNC-04 browser check | Passed 5/5 runs; one earlier run timed out waiting for the page right after a backend restart (page load, not the fix) |
| Not verified | Docker image build on droplet; real authentication flows (none exist); allocation override modal in browser |

## 5. Round 2 — remaining issues (2026-10-21)

Owner instruction: "complete all problems". Decisions taken (senior-engineer judgement, documented for review):

| ID | Decision & change | Verification (actual result) |
|---|---|---|
| SEC-01 | Spring Security, server-side session in HttpOnly `SEWNEXA_SESSION` cookie, SPA CSRF (`XSRF-TOKEN`), BCrypt(12), `app_users` table (V69), roles SYSTEM_ADMIN / INDUSTRIAL_ENGINEER / PRODUCTION_MANAGER / LINE_SUPERVISOR enforced per endpoint, login throttling (5 failures → 15 min), session revocation on disable/role change/password reset, last-admin guard, bootstrap admin from `APP_ADMIN_PASSWORD`, admin Users page, change-password dialog; demo personas, SSO stubs and role switcher removed; chat conversations bound to the signed-in user; per-controller `@CrossOrigin("*")` removed | `SecurityIntegrationTest` (10); browser: 12 auth checks, 28 routes as admin + 9 as supervisor with no 401/403/5xx |
| DB-02 | GET attendance is read-only; operator pool projects availability in memory for today/future dates | `AttendanceReadOnlyTest` (3) |
| DB-01 | Flyway strict mode (no baseline/out-of-order, validate on); compose no longer overrides it; `FLYWAY_REPAIR_ON_START` one-off switch; migration rules README. Local dev DB history repaired (backup table `flyway_schema_history_backup_20261021`) | full suite boots with validation on |
| FUNC-06 | Bulletin status workflow + edit lock (DRAFT/UNDER_REVIEW editable); "Create revision" UI for locked bulletins; delete guard | `BulletinWorkflowTest` (3); browser revision flow |
| FUNC-07 | Hourly board GET read-only; explicit `POST /hourly-production/board/init`; no unrelated-bulletin fallback; unique plan per order (V70, guarded) | `HourlyBoardReadOnlyTest` (3) |
| DB-03 | Missing FK indexes (V71) | indexes present after migration |
| REL-04 | Orders deletable only while PLANNED without production; production-history FKs RESTRICT (V72); clear message on operation delete | `OrderDeletionGuardTest` (3) |
| SEC-05 | SheetJS 0.20.3 from vendor CDN; ArrayBuffer parsing; 10 MB limit; `npm audit fix` (vite 8.3.5) | `npm audit`: 0 vulnerabilities |
| FUNC-08 | Optimizer applies UI weights (50 = unchanged); validated 0–100 | `SolverWeightsTest` (3) |
| BE-02 | Chat turn = two short transactions around the LLM call | `ChatbotNoOuterTransactionTest` |
| PERF-01 | Optimizer bulk-loads performance data once per run | 900 pairs identical; 0.5 s vs 11.9 s |
| PERF-02 | Chat retrieval uses aggregates / per-line queries; friendly answer when no lines | `ChatRetrievalRobustnessTest` (2) |
| PERF-03 | `usePolling`: pauses when tab hidden, ignores stale responses, gentler intervals; order-scoped piece logs (also fixes double counting of order-less logs) | routes load; no regressions |
| PERF-04 | Route-level code splitting | initial JS ≈0.55 MB (was 2.1 MB); 76 chunks |
| REL-01 | Optimistic locking (`row_version`, V73) for bulletins and orders; 409 on stale edits | `OptimisticLockingTest` (2); browser rv 1→2 and stale → 409 |
| REL-02 | Request timeout, readable errors, global error toaster, `useSubmitGuard` on 5 forms, 33 silent load failures now reported | browser: duplicate line code shown in form |
| REL-03 | Assignment chosen by effective dates (most recent wins); overlapping periods rejected; legacy overlaps no longer throw | `ShiftAssignmentOverlapTest` (2) |
| BE-03 | Validated imports with row numbers; operator import atomic via `POST /operators/batch`; Excel dates/times parsed | `OperatorBatchImportTest` (3); 16 unit checks |
| UX-01 | Accessible shared dialog (role, labels, focus trap, Escape, focus restore) | 6 keyboard checks |
| UX-02 | Logout clears per-user browser data | browser check |
| CQ-02 | Dead pages removed (in git history); real `application-prod.yml` | build + prod-profile boot |
| TEST-01/02 | Playwright `unit` + `e2e` suites; CI workflow (`.github/workflows/ci.yml`); persist test rolls back | 16 unit + 10 e2e pass |

### Final verification

| Check | Result |
|---|---|
| Backend `mvn test` | **76 tests, 0 failures** |
| Frontend type-check + build | 0 errors; build passes |
| `oxlint` | 0 errors |
| `npm audit` | 0 vulnerabilities |
| Frontend unit / e2e | 16 / 10 passed (e2e run against local backend + Vite in Edge) |
| Not verified | Docker image build on the droplet; CI workflow on GitHub (not pushed) |

### Notes for the owner
- **Deploy**: add `APP_ADMIN_EMAIL` / `APP_ADMIN_PASSWORD` to the droplet `.env` before `docker compose up -d --build` (compose refuses to start without the password). See DIGITALOCEAN_DEPLOYMENT_GUIDE.md.
- Existing fabricated attendance rows (remarks "Shift on-time reporting" / "Approved medical leave") were **not deleted**; remove them if they are not wanted.
- Local dev DB contains 7 allocation runs committed by earlier test runs; the test no longer adds more.
- `DEMO_DATA_DAILY_REFRESH` is still `true` in compose for the demo; set it to `false` before entering real factory data.

## 6. SewNexa AI redesign (2026-10-28)

**Problem.** The assistant gave wrong or invented answers. The old engine (`chatbot/agent`, `intent`, `retrieval`, `llm`, ~1,100-line keyword matcher) passed whole sentences as search terms, defaulted silently when nothing matched, let an LLM write free SQL, and produced fabricated text. Baseline on 12 representative questions: **about 1/12 correct**.

**Design: answer only from application data.**

| Layer | What it does | Code (`backend/.../chatbot/assistant/`) |
|---|---|---|
| Entity catalog | Aliases for every operator, operation, style, buyer, line, order, bulletin (live revision), shift, machine type, loaded from the DB and refreshed every 30 s; typo-tolerant matching and code variants (`op9` → `OP-009`) | `nlu/EntityCatalog.java`, `nlu/Text.java` |
| Question analyzer | Weighted intent cues + entity evidence → one of 25 intents with a transparent score; extracts numbers (operators, %, pcs/hour), dates, roles, statuses; rejects off-topic questions | `nlu/QuestionAnalyzer.java`, `nlu/Intent.java` |
| Skills | One read-only query path per intent (workforce, master data, engineering calculations, orders/production, how-to). Formulas match the app: pitch = SMV×60÷N, output = 3600÷pitch, required operators = SMV×T÷(60×e), line balance efficiency = SMV÷(bottleneck×N); whole-operator allocation to the bottleneck. Assumed efficiency (80%) is always stated | `skills/*.java` |
| Orchestrator | Follow-ups reuse the previous intent and entities (stored per message, `V74` adds `chat_messages.assistant_state`); page context fills a missing line/order/style; asks which one when a name is ambiguous; "did you mean" when not found; every answer ends with its data source and time | `GroundedAssistant.java`, `ConversationState.java` |
| Optional LLM | Only picks an intent from the fixed list when the rules can't; its entity guesses are re-checked against the catalog. It never writes the answer or SQL | `LlmIntentRouter.java` |
| Starter questions | `GET /api/chatbot/suggestions` builds prompts from real records, so every suggestion is answerable; UI loads them | `HelpSkill.starterQuestions()`, `SuggestedQuestions.tsx` |

**Removed:** the old `agent`, `intent`, `retrieval`, `llm` packages and their tests (`EnterpriseToolsServiceSqlSafetyTest`, `ChatbotServiceTest`, `ChatRetrievalRobustnessTest`). SEC-02 (LLM free SQL) no longer applies: no SQL is generated. This is why the backend test count went from 76 to 69.

**Verification.**

| Check | Result |
|---|---|
| Golden set: 40 questions, expected values computed from the DB at test time (`SewNexaAiEvaluationTest`) | **40/40** |
| Held-out paraphrases, different wording (`SewNexaAiHeldOutTest`) | **37/37** |
| Every built-in UI prompt and starter question gets a real answer | **31/31** |
| Follow-up context; prompt injection cannot change data | pass |
| Backend `mvn test` | **69 tests, 0 failures** |
| Frontend type-check, `oxlint`, build, unit | 0 errors; build passes; 16/16 |
| Browser (`tests/e2e/chat.spec.ts`, Edge): count matches API, source shown, off-topic refused | pass; tables and in-answer links checked by screenshot |

**Limits.** Questions outside the 25 intents get "I can only help with SewNexa…" or a clarification, not a guess. New kinds of question need a new cue and skill plus golden cases.

## 7. Planned Lines & Balancing review (2026-10-28)

Checked in the browser (local sample data) and by code review of `frontend/src/pages/line-balance/LineBalancePage.tsx`.

| Problem | Fix | Verified |
|---|---|---|
| Overdue order shown as "1d left" and the whole open quantity demanded in one day (9,200 pcs/day, 2.7 s takt, "120 ops deficit") | Red "Nd overdue" badge and banner; targets use the line's planned pace (design target/hr × net shift hours, else line daily capacity) and ask for a new completion date | PO-2026-002: 6d overdue, 1,200 pcs/day, 21 s takt |
| Another line's design applied (LINE-01 showed DES-LINE02-POLO); old design kept after switching orders, and saving overwrote it | Design must match order and line (design without a line fits any); cleared otherwise; `?lineDesignId` only sets the selections once | LINE-01 shows its own design or none |
| Save wrote `stationAllocations` as an assignment list; reload read it as counts → `Array(NaN)` crash | Saves the "station → operator count" map; reader also converts old lists; `workstationsJson` no longer overwritten | `tests/unit/line-allocations.spec.ts` |
| Slow plan response for a previous order could replace the current one | Stale responses ignored | code |
| Unsaved edits lost on any master-data refresh (e.g. attendance from another tab) | Rebuild only when order/bulletin/line/design changes or nothing was edited | code |
| Previous style's bulletin kept for an order without one | Bulletin cleared | code |
| Today's available time = share of 24 h left × shift time (overstated operators before the shift) | Uses the shift time actually left today; 0 after the shift or on Sunday (6-day week) | 23,000 pcs ÷ 15 working days = 1,534/day |
| Takt jumped to thousands of seconds once the quantity was complete | Falls back to the base takt instead of dividing by 1 | code |
| Quick fix reported success without changing anything; auto-assign used absent operators | Fills empty slots, skips ABSENT/ON_LEAVE, reports what changed and what is still unfilled | code |

**Open — need a business decision:** skill multiplier and planned efficiency are both applied (a rated-3 operator can turn a station red while the line meets target); one plan per order (saving on line B replaces line A's plan); demo refresh does not move sample order dates; backend plan save does not reject unknown/inactive operators and has no optimistic locking.
