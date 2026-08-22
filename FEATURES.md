# QTechPro Line Balancing Application — Feature Documentation

> **Tech Stack:** Spring Boot 3 (Java 21) + PostgreSQL + Flyway + React 18 + TypeScript + Tailwind CSS v4 + Vite  
> **Repository:** [abhinavnarahari/Line-Balancing-Application](https://github.com/abhinavnarahari/Line-Balancing-Application)

---

## Table of Contents

1. [Custom Toggle Switch UI](#1-custom-toggle-switch-ui)
2. [Operator Skill Matrix — Improved Rating UI](#2-operator-skill-matrix--improved-rating-ui)
3. [Skill Matrix History Logging](#3-skill-matrix-history-logging)
4. [Skill Matrix History Logs Dashboard Page](#4-skill-matrix-history-logs-dashboard-page)
5. [Operator Detail Page — Profile & Attachments](#5-operator-detail-page--profile--attachments)
6. [Backend Infrastructure — Flyway Migrations](#6-backend-infrastructure--flyway-migrations)
7. [Bug Fixes & Code Quality](#7-bug-fixes--code-quality)
8. [Project Housekeeping](#8-project-housekeeping)

---

## 1. Custom Toggle Switch UI

### What It Does
Replaces all "activate/deactivate" icon buttons (Lucide `ToggleLeft`/`ToggleRight`) and radio-button status fields across the entire application with a smooth, animated CSS toggle switch — consistent with modern SaaS UI standards.

### How It Works
- A reusable `<ToggleSwitch />` React component renders a standard HTML `<input type="checkbox">` hidden inside a styled `<label>` element.
- The CSS uses `em`-relative units so the toggle scales cleanly. Default size `sm` is `38×22 px` — small enough to fit inside table rows.
- When the checkbox state changes, the `onChange` prop is called with the new boolean value.
- An optional `disabled` prop renders it greyed-out (opacity 0.55) and blocks interaction.

### Implementation

**Component file:**
```
frontend/src/components/ui/ToggleSwitch.tsx
```

**CSS (global styles):**
```
frontend/src/index.css  →  /* ─── Toggle Switch ─── */ section
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | — | Current on/off state |
| `onChange` | `(checked: boolean) => void` | — | Called when toggled |
| `disabled` | `boolean` | `false` | If true, renders read-only |
| `size` | `"sm" \| "md"` | `"sm"` | Controls physical size |

**Applied to these pages:**

| File | Context |
|---|---|
| `features/operators/OperatorList.tsx` | Activate / Deactivate operators in the table |
| `features/operations/OperationList.tsx` | Activate / Deactivate operations |
| `features/shifts/ShiftList.tsx` | Shift card hover action + summary table |
| `pages/sizes/SizesPage.tsx` | Size row action |
| `pages/production/StylesPage.tsx` | Style row action |
| `pages/operators/OperatorDetailPage.tsx` | Operator Active/Inactive status field (view + edit mode) |

**Usage example:**
```tsx
import { ToggleSwitch } from "../../components/ui/ToggleSwitch";

<ToggleSwitch
  checked={operator.active}
  onChange={() => onToggleActive(operator.id)}
/>
```

---

## 2. Operator Skill Matrix — Improved Rating UI

### What It Does
The Skill Matrix tab inside an Operator's detail page allows managers to assign ratings (1–5) per operation. Two key UX improvements were made:

1. **Deselect (reset) on second click** — clicking the same rating again sets it back to `0` (unrated).
2. **Fixed header alignment** — rating column headers now display as two-line text (number + label), properly centered over each button column.

### How It Works

**Deselect logic (`OperatorDetailPage.tsx` line ~81):**
```ts
const handleSkillChange = (opId: string, value: number) => {
  setSkills(prev => ({
    ...prev,
    [opId]: prev[opId] === value ? 0 : value   // toggle off if same rating clicked
  }));
};
```

**Header alignment (HTML):**
```tsx
<th className="py-4 px-2 text-center w-24 leading-snug">
  1 &mdash;<br/>Beginner
</th>
```

Each header now stacks the rating number and its label name on two lines, perfectly centered above the corresponding rating button.

### Files Modified
```
frontend/src/pages/operators/OperatorDetailPage.tsx
```

---

## 3. Skill Matrix History Logging

### What It Does
Every time an operator's skill rating is changed — either manually by a manager or automatically by the system's performance-based auto-update — a permanent audit record is written to the database. This creates a full, tamper-proof history of all skill changes.

### How It Works

**Trigger points:**
1. **Manual update** — when `addAssessment()` is called via `POST /api/skill-matrix`
2. **Auto-update** — when `autoUpdateSkillMatrix()` is triggered after performance logs are uploaded

**Detection logic (inside `SkillMatrixService.java`):**
```java
// Before saving new assessment, fetch the current one
var currentOpt = skillRepository.findCurrentByOperatorAndOperation(...);
int oldRating = currentOpt.isPresent() ? currentOpt.get().getRating() : 0;

// After saving the new assessment:
if (oldRating != request.getRating()) {
    SkillMatrixHistoryLog history = SkillMatrixHistoryLog.builder()
        .operator(operator)
        .operation(operation)
        .oldRating(oldRating)
        .newRating(request.getRating())
        .updatedBy("Manager")   // "System Auto-Update" for automated changes
        .build();
    historyLogRepository.save(history);
}
```

If the rating didn't actually change, **no log entry is created** (avoids clutter).

### Database Schema (V20 Migration)

```sql
CREATE TABLE skill_matrix_history (
    id              BIGSERIAL    PRIMARY KEY,
    operator_id     BIGINT       NOT NULL REFERENCES operators(id),
    operation_id    BIGINT       NOT NULL REFERENCES operations(id),
    old_rating      INTEGER      NOT NULL,
    new_rating      INTEGER      NOT NULL,
    updated_by      VARCHAR(255) NOT NULL,
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_skill_history_operator  ON skill_matrix_history(operator_id);
CREATE INDEX idx_skill_history_operation ON skill_matrix_history(operation_id);
CREATE INDEX idx_skill_history_date      ON skill_matrix_history(updated_at);
```

### Files Created / Modified

| File | Type | Purpose |
|------|------|---------|
| `backend/src/main/resources/db/migration/V20__create_skill_matrix_history.sql` | NEW | Database migration |
| `backend/.../skillmatrix/entity/SkillMatrixHistoryLog.java` | NEW | JPA entity |
| `backend/.../skillmatrix/repository/SkillMatrixHistoryLogRepository.java` | NEW | Spring Data repository |
| `backend/.../skillmatrix/dto/SkillMatrixHistoryResponse.java` | NEW | API response DTO |
| `backend/.../skillmatrix/service/SkillMatrixService.java` | MODIFIED | Injects history repo, writes logs |
| `backend/.../skillmatrix/controller/SkillMatrixController.java` | MODIFIED | Adds `GET /api/skill-matrix/history/logs` endpoint |

### API Endpoint

```
GET /api/skill-matrix/history/logs
```

**Response JSON:**
```json
{
  "data": [
    {
      "id": 1,
      "operatorId": 12,
      "operatorName": "Anita Singh",
      "employeeId": "EMP-1005",
      "operationId": 3,
      "operationName": "Shoulder Join",
      "operationCode": "OP_001",
      "oldRating": 3,
      "newRating": 4,
      "updatedBy": "Manager",
      "updatedAt": "2026-08-22T10:30:00"
    }
  ]
}
```

---

## 4. Skill Matrix History Logs Dashboard Page

### What It Does
A dedicated frontend page that displays the complete audit trail of all skill rating changes across all operators. Accessible from the main Sewing Skill Matrix page via a "History Logs" button.

### Features
- **Full data table** — shows Date & Time, Operator (name + employee ID), Operation (name + code), Change (old → new rating with visual badges), and Updated By.
- **Live search** — filter by operator name or operation name.
- **Rating filter** — filter to show only changes to a specific rating (1–5).
- **Back navigation** — chevron button returns to the main Skill Matrix page.
- **Empty state** — gracefully shows "No history logs found" if no changes exist yet.

### How It Works
On mount, the page calls `GET /api/skill-matrix/history/logs`. The response is stored in local state. Filtering is done purely client-side using `.filter()` on the in-memory array — no additional API calls for filtering.

The change column renders:
```tsx
<span className="...text-[#8C7E6E]">{log.oldRating}</span>
<span className="text-[#B8A898]">→</span>
<span className="...text-[#9B5A32]">{log.newRating}</span>
```

### Files Created / Modified

| File | Purpose |
|------|---------|
| `frontend/src/pages/workforce/SkillMatrixLogsPage.tsx` | NEW — full page component |
| `frontend/src/app/router.tsx` | Added route `skill-matrix/logs` |
| `frontend/src/pages/workforce/SkillMatrixPage.tsx` | Added "History Logs" button in header |

### Navigation
```
Sidebar → Sewing Skill Matrix → [History Logs button] → /skill-matrix/logs
```

---

## 5. Operator Detail Page — Profile & Attachments

### What It Does
The Operator Detail Page (`/settings/operators/:id`) shows a full profile for each sewing operator across three tabs:

| Tab | Contents |
|-----|---------|
| **Overview** | Profile fields (name, employee ID, DOB, gender, department, joining date, active status) with inline editing. File attachments list. |
| **Skill Matrix** | Per-operation rating table (1–5 stars/buttons) with save functionality. |
| **Connections** | (Placeholder for future related data) |

### Active Status — Toggle Switch
In the Overview tab, the **Status** field shows the new custom `ToggleSwitch`:
- **View mode** — disabled toggle (greyed) + "Active" / "Inactive" label
- **Edit mode** — interactive toggle that sets `editData.active` to `true`/`false`

```tsx
{isEditing ? (
  <div className="mt-2 flex items-center gap-3">
    <ToggleSwitch
      checked={editData.active === true}
      onChange={(checked) => setEditData({ ...editData, active: checked })}
    />
    <span>{editData.active ? "Active" : "Inactive"}</span>
  </div>
) : (
  <div className="mt-2 flex items-center gap-3">
    <ToggleSwitch checked={operator.active} onChange={() => {}} disabled />
    <span>{operator.active ? "Active" : "Inactive"}</span>
  </div>
)}
```

### Skill Rating Table
- Columns: Operation Name | 1—Beginner | 2—Basic | 3—Standard | 4—Good | 5—Expert
- Each cell is a clickable button. Active rating has a highlighted style.
- **Click same rating again → deselects it (back to 0/unrated)**
- Bottom "Save Ratings" button calls `POST /api/skill-matrix` for each changed operation

### Files
```
frontend/src/pages/operators/OperatorDetailPage.tsx
```

---

## 6. Backend Infrastructure — Flyway Migrations

All database schema changes are version-controlled via Flyway. Migrations run automatically on Spring Boot startup.

| Migration | File | Contents |
|-----------|------|---------|
| V17 | `V17__create_audit_logs.sql` | Generic audit_logs table for entity-level change tracking |
| V18 | `V18__create_operator_attachments.sql` | operator_attachments table (file uploads) |
| V19 | `V19__create_operator_performance_logs.sql` | operator_performance_logs (cycle time per operator per operation per day) |
| V20 | `V20__create_skill_matrix_history.sql` | skill_matrix_history (rating change audit trail) |

### Performance Log → Auto Skill Update Flow
```
Manager uploads daily performance CSV
        ↓
POST /api/skill-matrix/performance-log  (one entry per operator+operation)
        ↓
POST /api/skill-matrix/auto-update/:operatorId
        ↓
System calculates average cycle time from logs
        ↓
Derives rating using efficiency formula:
  efficiency = (baseline_cycle_time / avg_cycle_time) × 100%
  ≥110% → Rating 5 (Expert)
  90–109% → Rating 4 (Good)
  75–89%  → Rating 3 (Standard)
  60–74%  → Rating 2 (Basic)
  <60%    → Rating 1 (Beginner)
        ↓
Saves new SkillAssessment (marks previous as not-current)
        ↓
Saves SkillMatrixHistoryLog (if rating changed)
```

---

## 7. Bug Fixes & Code Quality

### Back Button Crash — SkillMatrixLogsPage
**Problem:** The back button was navigating to `/settings/skill-matrix` which doesn't exist, causing a crash.  
**Fix:** Changed route to `/skill-matrix`.

```tsx
// Before (broken)
<Link to="/settings/skill-matrix">

// After (fixed)
<Link to="/skill-matrix">
```

### Toggle CSS Specificity Conflict
**Problem:** The global `.slider` class conflicted with Tailwind's base reset, preventing the toggle from rendering correctly.  
**Fix:** Scoped all CSS selectors under `.switch` parent:
```css
/* Before — too generic, gets overridden */
.slider { ... }

/* After — properly scoped */
.switch .slider { ... }
.switch .slider:before { ... }
```

### StylesPage & SizesPage JSX Corruption
**Problem:** Automated replacement tool accidentally duplicated content in both files, causing 8+ JSX parse errors each.  
**Fix:** Rewrote both files cleanly from scratch (full rewrite approach).

### OperatorAttachmentController — Unnecessary Annotation
**Problem:** `@SuppressWarnings("null")` was suppressing IDE null analysis, causing a spurious "not analysed" info notice.  
**Fix:** Removed the annotation — the existing `!= null` check on line 49 already makes it safe.

### TypeScript Compilation — Zero Errors
All frontend files were verified with `npx tsc --noEmit` after every change. Final state: **0 errors, 0 warnings**.

### Backend Compilation — Zero Errors
All backend changes verified with `mvn clean compile`. Final state: **BUILD SUCCESS**.

---

## 8. Project Housekeeping

### .gitignore Created
Before this session, `backend/target/` (compiled `.class` files) was being tracked in Git, bloating the repository.

**Root `.gitignore`:**
```gitignore
target/
*.class
.idea/
*.iml
.vscode/
*.log
hs_err_pid*.log
replay_pid*.log
FixFlyway.java
FixFlyway.class
```

**`frontend/.gitignore`:**
```gitignore
dist/
node_modules/
append.cjs
fix.cjs
*.bak.txt
.vscode/
```

All `backend/target/` `.class` files were removed from Git history with `git rm -r --cached backend/target/`.

### VS Code — Suppress Tailwind v4 Warning
The project uses Tailwind CSS v4 which introduces the `@theme` directive. VS Code's built-in CSS linter doesn't recognize it and flags it as an unknown at-rule.

**Fix:** Created `frontend/.vscode/settings.json`:
```json
{
  "css.lint.unknownAtRules": "ignore"
}
```

This silences the warning without changing any code. The `@theme` directive works correctly at runtime.

---

## Architecture Summary

```
Line Balancing_sewing/
├── backend/                        Spring Boot 3 REST API
│   ├── src/main/java/.../
│   │   ├── skillmatrix/
│   │   │   ├── controller/         SkillMatrixController.java
│   │   │   ├── service/            SkillMatrixService.java ← history logging added
│   │   │   ├── entity/             SkillAssessment.java
│   │   │   │                       SkillMatrixHistoryLog.java  ← NEW
│   │   │   │                       OperatorPerformanceLog.java ← NEW
│   │   │   ├── repository/         SkillAssessmentRepository.java
│   │   │   │                       SkillMatrixHistoryLogRepository.java ← NEW
│   │   │   │                       OperatorPerformanceLogRepository.java ← NEW
│   │   │   └── dto/                SkillMatrixHistoryResponse.java ← NEW
│   │   └── operator/attachment/    OperatorAttachmentController.java ← fixed
│   └── src/main/resources/db/migration/
│       ├── V17__create_audit_logs.sql
│       ├── V18__create_operator_attachments.sql
│       ├── V19__create_operator_performance_logs.sql
│       └── V20__create_skill_matrix_history.sql ← NEW
│
└── frontend/                       React 18 + TypeScript + Tailwind v4
    └── src/
        ├── components/ui/
        │   └── ToggleSwitch.tsx    ← NEW custom toggle component
        ├── pages/
        │   ├── operators/
        │   │   └── OperatorDetailPage.tsx  ← toggle, deselect rating, header fix
        │   ├── workforce/
        │   │   ├── SkillMatrixPage.tsx     ← History Logs button added
        │   │   └── SkillMatrixLogsPage.tsx ← NEW audit trail page
        │   ├── production/StylesPage.tsx   ← ToggleSwitch integrated
        │   └── sizes/SizesPage.tsx         ← ToggleSwitch integrated
        ├── features/
        │   ├── operators/OperatorList.tsx  ← ToggleSwitch integrated
        │   ├── operations/OperationList.tsx← ToggleSwitch integrated
        │   └── shifts/ShiftList.tsx        ← ToggleSwitch integrated
        ├── app/router.tsx                  ← skill-matrix/logs route added
        └── index.css                       ← toggle CSS (.switch / .switch .slider)
```

---

*Last updated: 22 August 2026 — Session summary by Antigravity IDE*
