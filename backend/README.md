# QTech Swing Line Balancing — Backend

REST API backend for the **QTech Swing Line Balancing** garment manufacturing application.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 3.3.x |
| Build | Maven |
| Database | PostgreSQL 15+ |
| Migrations | Flyway |
| Validation | Jakarta Validation |

---

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.9+
- PostgreSQL 15+

### 1. Create the PostgreSQL Database

```sql
CREATE DATABASE qtech_linebalancing;
```

### 2. Configure Connection

Edit `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/qtech_linebalancing
    username: postgres
    password: your_password
```

### 3. Run the Application

```bash
mvn spring-boot:run
```

Flyway will automatically run all migrations (V1–V14) and seed the database on first startup.

---

## API Base URL

```
http://localhost:8080/api
```

---

## Endpoints

### Shifts
```
GET    /api/shifts                     → List all shifts (filter: ?active=true/false)
GET    /api/shifts/{id}                → Get shift by ID
POST   /api/shifts                     → Create shift
PUT    /api/shifts/{id}                → Update shift
PATCH  /api/shifts/{id}/toggle-status  → Toggle active/inactive
```

### Operators
```
GET    /api/operators                     → List operators (filter: ?search=&active=)
GET    /api/operators/{id}                → Get operator
POST   /api/operators                     → Register new operator
PUT    /api/operators/{id}                → Update operator
PATCH  /api/operators/{id}/toggle-status  → Toggle active/inactive
```

### Operations
```
GET    /api/operations                     → List operations (?active=)
GET    /api/operations/{id}                → Get operation
POST   /api/operations                     → Create operation
PUT    /api/operations/{id}                → Update operation
PATCH  /api/operations/{id}/toggle-status  → Toggle active
```

### Sizes
```
GET    /api/sizes                     → List sizes (?active=)
POST   /api/sizes                     → Create size
PUT    /api/sizes/{id}                → Update size
PATCH  /api/sizes/{id}/toggle-status  → Toggle active
```

### Styles
```
GET    /api/styles                     → List styles (?active=)
POST   /api/styles                     → Create style
PUT    /api/styles/{id}                → Update style
PATCH  /api/styles/{id}/toggle-status  → Toggle active
```

### Shift Assignments
```
GET    /api/shift-assignments              → All assignments (?operatorId=)
POST   /api/shift-assignments             → Assign operator to shift
PATCH  /api/shift-assignments/{id}/end    → End assignment (?endDate=YYYY-MM-DD)
DELETE /api/shift-assignments/{id}        → Delete assignment
```

### Skill Matrix
```
GET    /api/skill-matrix                  → Current matrix (?operatorId=)
GET    /api/skill-matrix/history          → History (?operatorId=&operationId=)
POST   /api/skill-matrix                  → Add new assessment (auto-bumps revision)
```

### Attendance
```
GET    /api/attendance                    → Get attendance (?date=YYYY-MM-DD&shiftId=)
GET    /api/attendance/operator/{id}      → Operator attendance history
POST   /api/attendance                    → Mark/update attendance (upsert)
```

### Orders
```
GET    /api/orders                        → All orders
GET    /api/orders/{id}                   → Order detail
POST   /api/orders                        → Create order
PATCH  /api/orders/{id}/status            → Update status (?status=PLANNED|IN_PRODUCTION|...)
```

### Operation Bulletins
```
GET    /api/operation-bulletins           → All bulletins
GET    /api/operation-bulletins/{id}      → Bulletin detail
POST   /api/operation-bulletins           → Create bulletin
PUT    /api/operation-bulletins/{id}      → Update bulletin
PATCH  /api/operation-bulletins/{id}/status → Publish/archive (?status=DRAFT|PUBLISHED|ARCHIVED)
```

---

## Database Schema

13 tables across 3 schema areas:

**Master Data:**
- `shifts` — Production shifts (A, B, C, General)
- `operators` — Sewing/swing operators
- `operations` — 18 standard sewing operations
- `sizes` — Garment sizes (XS–XXL)
- `styles` — Garment styles

**Workforce:**
- `shift_assignments` — Temporal shift assignment history
- `skill_assessments` — Swing Skill Matrix with full revision history
- `attendance_records` — Daily attendance

**Production:**
- `orders` — Order headers
- `order_size_lines` — Size-wise quantity breakdown
- `operation_bulletins` — Operation sequence + SMV
- `bulletin_lines` — Individual operation lines in a bulletin
- `bulletin_styles` — Many-to-many: bulletin ↔ style

---

## Key Business Rules Implemented

1. **Inactive operators** cannot be assigned to shifts (enforced in `ShiftAssignmentService`)
2. **No overlapping open-ended shift assignments** per operator (enforced in `ShiftAssignmentService`)
3. **Skill matrix revision history is never deleted** — new assessments create new revisions, old ones get `is_current=false`
4. **Order total quantity** = SUM of all size line quantities (auto-calculated in `OrderService`)
5. **Bulletin totalSMV** = SUM of all line SMV values (auto-calculated in `OperationBulletinService`)
6. **Delivery date must be ≥ order date** (validated in `OrderService`)
7. **Unique constraints** on all business codes: shift_code, employee_id, operation_code, size code, style_no, bulletin_code+version

---

## Seeded Data (Flyway V11–V14)

| Entity | Count |
|--------|-------|
| Shifts | 4 (A, B, C, General) |
| Operations | 18 (complete sewing operation set) |
| Sizes | 6 (XS, S, M, L, XL, XXL) |
| Operators | 50 (47 active, 3 inactive) |
