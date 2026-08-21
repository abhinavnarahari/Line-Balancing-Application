# QTech Swing Line Balancing — AI Agent Project Setup

## 1. Project Overview

Build a new application from scratch for **Swing/Sewing Line Balancing** in the garment manufacturing domain.

The application will provide the master data and operational foundation required to eventually calculate takt time, cycle time, operator requirements, operator placement, line balancing, and production monitoring.

### Product name

**QTech Swing Line Balancing**

Use the terminology **Swing Line**, **Sewing Operator**, and **Swing Skill Matrix** consistently in the UI and domain model.

### Primary objective

The system must answer:

> For a given style/order and production target, what operations are required, how many qualified operators are required at each operation, which operators should be assigned, and whether the line can achieve the target within the available time?

The first release must focus on reliable master data and assignment foundations. Do not build the complete optimization/line-balancing engine before the underlying masters are stable.

---

# 2. Technology Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- API client using REST
- Component-based architecture
- Responsive desktop-first UI suitable for factory/production users

## Backend

- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- Bean Validation
- REST APIs
- Layered architecture:
  - Controller
  - Service
  - Repository
  - Entity
  - DTO
  - Mapper where appropriate
  - Exception handling

## Database

- PostgreSQL
- Use migrations (Flyway preferred)
- Relational normalized schema
- Foreign keys and indexes
- Audit fields on transactional/master records where appropriate

## Development principles

- Type-safe frontend
- RESTful backend
- No business logic in React components
- No direct database access from frontend
- Business rules belong in backend services
- Avoid hard-coded factory data
- Configuration should be database-driven wherever practical
- Design for future ERP/SAP integration
- Keep the architecture modular so future line-balancing calculations can be added without restructuring the application

---

# 3. Source Requirement Analysis

The supplied Excel workbook `Line balancing.xlsx` contains two sheets.

## Sheet 1 — Initial requirement list

The workbook identifies these modules:

1. Shift — A, B, C, General
2. Shift Assignment
3. Sewing Operator List
4. Sewing Skill Matrix
5. Daily Operator Attendance
6. Style List
7. Order Details
8. Operation Bulletin

CRUD is explicitly required for:
- Sewing Operator List
- Daily Operator Attendance
- Style List
- Operation Bulletin

The discussion additionally establishes CRUD/configuration requirements for the other master modules.

## Sheet 2 — Initial operations

Load these operations into the Operation Master as seed/reference data:

1. Shoulder Join
2. Neck Rib Attach
3. Neck Top Stitch
4. Sleeve Attach Left
5. Sleeve Attach Right
6. Side Seam Close
7. Bottom Hem
8. Sleeve Hem
9. Label Attach
10. Trim Check
11. Thread Trimming
12. Initial Inspection
13. Spot Cleaning
14. Final Measurement
15. Final Inspection
16. Folding
17. Poly Bag Packing
18. Carton Packing

Treat these as seed data, not hard-coded frontend constants.

---

# 4. Important Domain Terminology

Use these definitions throughout the application.

### Available Time

The production time available for completing the target quantity.

### Takt Time

Required production pace.

`Takt Time = Available Production Time / Required Quantity`

Example:

- Available time = 60 minutes = 3,600 seconds
- Required quantity = 100 garments

Takt Time:

`3,600 / 100 = 36 seconds per garment`

### Cycle Time

Actual/standard time required to complete one unit of an operation.

### Required Operators

Basic calculation:

`Required Operators = CEILING(Cycle Time / Takt Time)`

Example:

- Cycle Time = 60 seconds
- Takt Time = 36 seconds

`60 / 36 = 1.67`

Required operators = 2.

### Capacity

Adding operators increases operation capacity; it does not automatically reduce an individual operator's cycle time.

### Line Balancing

Determine operator allocation across sewing operations so the line can meet the production target while considering:
- takt time
- cycle time
- skill
- operator availability
- shift
- attendance
- operation sequence
- bottlenecks

---

# 5. Phase 1 Scope

Implement these modules first, in this order:

1. Shift Master
2. Shift Assignment
3. Sewing Operator Master
4. Operation Master
5. Swing Skill Matrix
6. Daily Operator Attendance
7. Style Master
8. Size Master
9. Order Details
10. Operation Bulletin

The actual Line Balancing engine, operator placement optimization, and monitoring dashboard should be Phase 2 after the above foundations are validated.

---

# 6. Module: Shift Master

Create configurable shifts.

Initial seed shifts:

| Code | Name | Start | End |
|---|---|---:|---:|
| A | A Shift | 07:00 | 14:00 |
| B | B Shift | 14:00 | 23:00 |
| C | C Shift | 23:00 | 07:00 |
| GENERAL | General Shift | Configurable | Configurable |

Do not hard-code timings in the frontend.

### Features

- Create
- Read/List
- Update
- Activate/Deactivate
- View details
- Search/filter

### Fields

- id
- shiftCode
- shiftName
- startTime
- endTime
- active
- createdAt
- updatedAt

Overnight shifts must be supported.

---

# 7. Module: Shift Assignment

An operator's shift can change over time.

Do not permanently store only one shift against the operator.

Example:

| Operator | Shift | Effective From | Effective To |
|---|---|---|---|
| EMP001 | A | 2026-08-01 | 2026-08-15 |
| EMP001 | GENERAL | 2026-08-16 | null |

### Features

- Assign operator to shift
- Update assignment
- View current assignment
- View assignment history
- End an assignment
- Prevent overlapping active assignments for the same operator

### Fields

- id
- operatorId
- shiftId
- effectiveFrom
- effectiveTo
- status
- createdAt
- updatedAt

---

# 8. Module: Sewing Operator Master

Maintain all sewing operators.

Create approximately 50 dummy operators for development/testing.

### Minimum fields

- Employee ID
- Employee Name
- Age
- Gender
- Department
- Active/Inactive status
- Joining Date

Current shift should be obtained through Shift Assignment rather than duplicated as the source of truth.

### CRUD

- Create
- List/read
- View details
- Update
- Deactivate/reactivate
- Search
- Filter

### Validation

- Employee ID unique
- Name required
- Age valid
- Gender configurable/validated
- Do not allow duplicate active employee records

---

# 9. Module: Operation Master

Create an operation master containing the 18 operations from the supplied Excel file.

### Required fields

- Operation Code
- Operation Name
- Description
- Active
- Sequence/Default Sequence if needed
- Created At
- Updated At

### Seed operations

Use the exact names supplied in the Excel:

- Shoulder Join
- Neck Rib Attach
- Neck Top Stitch
- Sleeve Attach Left
- Sleeve Attach Right
- Side Seam Close
- Bottom Hem
- Sleeve Hem
- Label Attach
- Trim Check
- Thread Trimming
- Initial Inspection
- Spot Cleaning
- Final Measurement
- Final Inspection
- Folding
- Poly Bag Packing
- Carton Packing

Do not create these as frontend constants.

---

# 10. Module: Swing Skill Matrix

This is a core module.

It maps:

`Operator + Operation + Skill Rating + Performance/Time`

Example:

| Operator | Operation | Skill Rating | Cycle Time |
|---|---|---:|---:|
| EMP001 | Shoulder Join | 3 | 40 sec |
| EMP001 | Sleeve Attach Left | 2 | 55 sec |
| EMP002 | Shoulder Join | 5 | 25 sec |

### Skill rating

Initial conceptual scale:

| Rating | Meaning |
|---:|---|
| 1 | Beginner / Slow |
| 2 | Basic |
| 3 | Standard |
| 4 | Good |
| 5 | Expert / Fast |

The rating methodology must remain configurable/finalizable with the business team.

### Critical requirement: revision history

Skill matrices must NOT simply overwrite previous values.

An operator's skill changes over time.

Example:

| Operator | Operation | Rating | Cycle Time | Revision | Effective Date |
|---|---|---:|---:|---:|---|
| EMP001 | Shoulder Join | 3 | 40 sec | Rev 1 | 2026-01-01 |
| EMP001 | Shoulder Join | 4 | 32 sec | Rev 2 | 2027-01-01 |

The database must retain historical revisions.

### Requirements

- Create skill assessment
- Update/create a new revision
- View current skill
- View skill history
- Filter by operator
- Filter by operation
- Filter by skill rating
- Effective date
- Cycle/standard time
- Notes/comments
- Active/current revision indicator

Prevent multiple overlapping current revisions for the same operator + operation.

---

# 11. Module: Daily Operator Attendance

Track daily operator presence.

The system must eventually use attendance to validate whether assigned operators are available.

### Example

Shift starts at 09:00.

Configured attendance buffer = 5 minutes.

At 09:05 the system checks whether the assigned operator has punched/reported.

If not:

`Operator Abhinav has not reported for the assigned Shoulder Join operation. Replacement required.`

### Phase 1 requirements

- Attendance date
- Operator
- Shift
- Check-in time
- Check-out time
- Attendance status
- Source/reference if integrated later
- Remarks

### Status examples

- PRESENT
- ABSENT
- LATE
- HALF_DAY
- ON_LEAVE
- NOT_REPORTED

Do not implement real-time notification infrastructure unless required for the current sprint; build the data model and service layer so alerts can be added cleanly.

---

# 12. Module: Style Master / Style List

Maintain the styles manufactured by the factory.

### Suggested fields

- Style Number
- Buyer
- Style Description
- Season
- Product/Item
- Status
- Created At
- Updated At

### CRUD

- Create
- Read/List
- Update
- Deactivate
- Search/filter
- View details

---

# 13. Module: Size Master

Sizes must be configurable.

Do not hard-code S/M/L/XL into the order UI.

Initial seed/example sizes:

- XS
- S
- M
- L
- XL
- XXL

### Features

- Create
- Read
- Update
- Activate/Deactivate
- Ordering/sequence

---

# 14. Module: Order Details

Order Details captures the actual production order.

Required business information:

- Buyer
- Style Number
- Color
- Size-wise quantities
- Total quantity

Example:

| Size | Quantity |
|---|---:|
| S | 100 |
| M | 200 |
| L | 200 |
| XL | 100 |
| Total | 600 |

Total must be calculated automatically:

`Total = Sum of all size quantities`

Do not allow manual inconsistency between size quantities and total.

### Suggested fields

Order header:
- Order Number
- Buyer
- Style
- Color
- Order Date
- Required/Delivery Date
- Status

Order size lines:
- Size
- Quantity

Calculated:
- Total Quantity

---

# 15. Module: Operation Bulletin

Operation Bulletin defines the operation sequence for a style.

### Critical requirement

**One Operation Bulletin can be attached to multiple styles.**

Do not duplicate the same bulletin unnecessarily for every style.

Recommended conceptual model:

`Operation Bulletin`
→ contains operation lines

`Style`
→ can reference an Operation Bulletin

Potentially:

`Operation Bulletin A → Style 001, Style 002, Style 003`

### Bulletin table fields

- Bulletin Code
- Bulletin Name
- Description
- Version
- Status
- Effective From
- Effective To
- SAP Reference / SAP Operation Value where applicable

### Operation line fields

- Sequence
- Operation
- Operation Code
- Skill Required
- Standard Value / Standard Time
- Cycle Time
- Machine
- Machine Type
- Operator Requirement (future calculation)
- Notes

### CRUD

- Create bulletin
- Read/list
- View details
- Update
- Delete/deactivate
- Add operation
- Edit operation
- Remove operation
- Reorder operations
- Attach to multiple styles

The UI should behave like an editable table/grid.

---

# 16. Standard Value / Observer Time / Allowance

The discussion introduced industrial engineering concepts including:

- Standard Value
- Standard Allowance
- Assembly
- Basic Training
- Observer Time
- Cycle Time
- Performance/Speed Rating

The intended conceptual flow is:

`Observed Time`
→ `Performance/Speed Rating`
→ `Normal/Adjusted Time`
→ `Allowance`
→ `Standard Time / Standard Value`

However, the exact organizational formula is NOT yet finalized.

Therefore:

### Do not hard-code a final formula now.

Build fields and calculation services so the formula can be configured once the business team confirms the standard.

---

# 17. Future Line Balancing Engine

This is not the first implementation target, but the architecture must support it.

Inputs:

- Order quantity
- Required date
- Available production time
- Shift
- Takt time
- Operation Bulletin
- Operation sequence
- Standard/Cycle Time
- Operator skill matrix
- Operator availability
- Attendance
- Machine availability
- Operator count

Calculations:

`Takt Time = Available Time / Required Quantity`

`Required Operators = CEILING(Cycle Time / Takt Time)`

Expected capacity:

`Capacity per Operator = Available Time / Cycle Time`

`Total Capacity = Capacity per Operator × Assigned Operators`

Future outputs:

- Required operators per operation
- Assigned operators
- Excess capacity
- Capacity shortage
- Bottleneck operations
- Line efficiency
- Target achievement forecast
- Operator replacement recommendations

---

# 18. Future Operator Placement

The system should eventually recommend operators for each operation.

Example:

Operation:

`Shoulder Join`

Requirement:

`2 operators`

Available qualified operators:

- EMP001 — Rating 5
- EMP007 — Rating 4
- EMP013 — Rating 3

The system can recommend the best available combination based on:
- Skill
- Cycle time
- Shift
- Attendance
- Current assignment
- Production requirement

Do not implement sophisticated optimization unless business rules are confirmed.

---

# 19. Future Monitoring

A future dashboard should show:

- Planned target
- Hourly target
- Actual output
- Takt time
- Cycle time
- Required operators
- Present operators
- Absent operators
- Bottleneck operations
- Line efficiency
- Target vs actual
- Remaining quantity
- Remaining available time

---

# 20. UX Requirements

The application is intended for production/factory users.

Prioritize:

- Clear terminology
- Minimal clicks
- Search and filters
- Fast data entry
- Table/grid-based master screens
- Clear status badges
- Confirmation before destructive actions
- Validation messages that explain what needs to be corrected
- Responsive layout
- Avoid unnecessary animations
- Avoid overly complex dashboards
- Avoid excessive colors
- Keep important production information visible immediately

### Navigation suggestion

Dashboard

- Masters
  - Shifts
  - Operators
  - Operations
  - Sizes
  - Styles
- Workforce
  - Shift Assignment
  - Daily Attendance
  - Swing Skill Matrix
- Production
  - Orders
  - Operation Bulletins
- Line Balancing
  - Planned Lines
  - Operator Placement
  - Monitoring
- Administration
  - Users/Roles
  - Configuration
  - Audit Logs

Line Balancing, Operator Placement and Monitoring can initially be placeholders if not in Phase 1.

---

# 21. Backend Architecture

Use a clean modular Spring Boot structure.

Suggested package structure:

```text
com.qtech.swinglinebalancing

├── common
│   ├── exception
│   ├── response
│   ├── audit
│   └── config
│
├── shift
│   ├── controller
│   ├── service
│   ├── repository
│   ├── entity
│   └── dto
│
├── operator
├── operation
├── skillmatrix
├── attendance
├── style
├── size
├── order
├── operationbulletin
└── linebalancing
```

Keep modules separated by business domain.

---

# 22. Database Design Principles

Use PostgreSQL.

Every major entity should have:

- UUID or consistent numeric ID strategy
- Business code where appropriate
- created_at
- updated_at
- created_by where appropriate
- updated_by where appropriate
- active/status

Use foreign keys.

Create indexes for frequently queried fields.

Important uniqueness examples:

- employee_id unique
- shift_code unique
- operation_code unique
- style_number should have appropriate business uniqueness
- size code unique
- bulletin code + version unique
- current operator/operation skill revision uniqueness

---

# 23. API Principles

Use REST APIs.

Examples:

```text
GET    /api/shifts
POST   /api/shifts
GET    /api/shifts/{id}
PUT    /api/shifts/{id}
PATCH  /api/shifts/{id}/status

GET    /api/operators
POST   /api/operators
GET    /api/operators/{id}
PUT    /api/operators/{id}

GET    /api/operations
POST   /api/operations

GET    /api/skill-matrix
POST   /api/skill-matrix
GET    /api/skill-matrix/{id}/history

GET    /api/attendance
POST   /api/attendance

GET    /api/styles
POST   /api/styles

GET    /api/sizes
POST   /api/sizes

GET    /api/orders
POST   /api/orders

GET    /api/operation-bulletins
POST   /api/operation-bulletins
PUT    /api/operation-bulletins/{id}
```

Use DTOs rather than exposing JPA entities directly.

---

# 24. Frontend Architecture

Suggested structure:

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── store/
├── components/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   └── common/
├── features/
│   ├── shifts/
│   ├── operators/
│   ├── operations/
│   ├── skill-matrix/
│   ├── attendance/
│   ├── styles/
│   ├── sizes/
│   ├── orders/
│   └── operation-bulletins/
├── services/
│   └── api/
├── types/
├── utils/
└── pages/
```

Each feature should own:
- API functions
- types
- components
- pages
- validation
- state where needed

---

# 25. Seed Data

For development:

### Shifts
Seed A, B, C and General.

### Operations
Seed all 18 operations from `Line balancing.xlsx`.

### Sizes
Seed XS, S, M, L, XL, XXL.

### Operators
Create approximately 50 dummy sewing operators.

### Skill Matrix
Create realistic dummy skill assignments for the 50 operators across the 18 operations.

Do not make every operator skilled at every operation with the same rating. Generate realistic variation.

---

# 26. Important Business Rules

1. Inactive operators cannot receive new assignments.
2. An operator cannot have overlapping shift assignments.
3. An operator cannot be assigned to an operation they are not qualified for unless an explicit override feature is later approved.
4. Skill matrix history must never be silently overwritten.
5. Only one current skill revision should exist per operator + operation.
6. Operation Bulletin must reference valid Operation Master records.
7. One bulletin can be linked to multiple styles.
8. Order total must equal the sum of size quantities.
9. Size values must come from Size Master.
10. Shift times must be configurable.
11. Overnight shifts must be supported.
12. Do not hard-code business formulas that have not been finalized.
13. Deletion should preferably be soft-delete/deactivation for master data to preserve historical references.

---

# 27. Security and Roles

Prepare the architecture for RBAC.

Potential future roles:

- Admin
- IE/Industrial Engineer
- Production Manager
- Line Supervisor
- HR/Attendance User
- Viewer

Phase 1 can implement basic authentication if required, but role-specific authorization should be designed cleanly for future expansion.

---

# 28. Auditability

This is a production application.

Changes to critical data should be traceable, especially:

- Operator records
- Shift assignments
- Skill matrix revisions
- Operation Bulletin revisions
- Order changes
- Style changes

Do not physically delete historical transactional records.

---

# 29. Development Rules for the AI Agent

### Critical

**Do not modify unrelated systems or repositories.**

This is a **new application from scratch**.

### The AI agent must:

1. First inspect the repository/workspace.
2. Create a clean project structure.
3. Confirm frontend/backend/database separation.
4. Create PostgreSQL configuration through environment variables.
5. Set up Flyway migrations.
6. Build backend module-by-module.
7. Build frontend module-by-module.
8. Add seed data.
9. Test APIs before connecting every frontend screen.
10. Keep business logic in Spring Boot.
11. Keep React focused on UI/state/API consumption.
12. Write validation and error handling.
13. Avoid hard-coded master data.
14. Add README documentation.
15. Maintain an implementation checklist.
16. Do not implement future modules prematurely.
17. Do not invent unresolved business formulas.
18. Flag ambiguities instead of silently making business assumptions.

---

# 30. Recommended Build Sequence

## Sprint 0 — Foundation

- Repository setup
- React + TypeScript
- Spring Boot
- PostgreSQL
- Flyway
- Environment configuration
- CORS
- REST response/error structure
- Basic application shell

## Sprint 1 — Factory Masters

- Shift Master
- Operation Master
- Size Master
- Operator Master

## Sprint 2 — Workforce

- Shift Assignment
- Daily Attendance
- Swing Skill Matrix
- Skill Matrix revision history

## Sprint 3 — Production Masters

- Style Master
- Order Details
- Size-wise quantities
- Operation Bulletin
- Bulletin-to-style relationship

## Sprint 4 — Validation

- End-to-end CRUD testing
- API testing
- UI validation
- Database constraints
- Seed data verification
- User acceptance preparation

## Sprint 5 — Line Balancing Engine

Only after business rules are confirmed:

- Available time
- Takt time
- Cycle time
- Required operators
- Capacity
- Operator placement
- Bottleneck detection

---

# 31. Definition of Done for Phase 1

Phase 1 is complete when a user can:

1. Create/manage shifts.
2. Assign operators to shifts.
3. Create/manage sewing operators.
4. View approximately 50 test operators.
5. Create/manage operations.
6. See the 18 supplied operations.
7. Create a Swing Skill Matrix.
8. Revise an operator's skill without losing history.
9. Record daily operator attendance.
10. Create/manage styles.
11. Create/manage configurable sizes.
12. Create an order.
13. Enter size-wise order quantities.
14. Automatically calculate total order quantity.
15. Create an Operation Bulletin.
16. Add/remove/reorder operations in the bulletin.
17. Attach one bulletin to multiple styles.
18. Perform CRUD on required masters.
19. Preserve historical data.
20. Run the complete workflow using seeded dummy data.

---

# 32. Do Not Build Yet

Unless explicitly requested, do NOT implement these in the first phase:

- Advanced optimization algorithms
- AI-based operator assignment
- Predictive production forecasting
- Machine IoT integration
- SAP integration
- ERPNext integration
- Biometric attendance integration
- Complex notifications
- Payroll
- Quality inspection
- Inventory
- Purchase
- Sales
- Finance

The architecture should remain integration-ready, but these are outside the current scope.

---

# 33. Immediate First Task for the AI Agent

Start with:

### Step 1
Create the project skeleton:

```text
qtech-swing-line-balancing/
├── frontend/
├── backend/
├── database/
├── docs/
└── README.md
```

### Step 2
Initialize:

**Frontend**
- React
- TypeScript
- Vite

**Backend**
- Java
- Spring Boot
- Maven/Gradle

**Database**
- PostgreSQL
- Flyway migrations

### Step 3

Implement only:

1. Shift Master
2. Operation Master
3. Size Master
4. Operator Master

Then test the APIs and UI.

### Step 4

Proceed to:

5. Shift Assignment
6. Swing Skill Matrix
7. Daily Attendance

### Step 5

Then:

8. Style Master
9. Order Details
10. Operation Bulletin

Do not jump to Line Balancing calculations until these modules are working and validated.

---

# 34. Product Vision

The long-term QTech product should evolve into a complete **Swing Line Balancing and Production Workforce Management platform**.

The strategic flow is:

`Factory Masters`
→ `Operators`
→ `Skills`
→ `Attendance`
→ `Styles`
→ `Orders`
→ `Operation Bulletin`
→ `Standard Time`
→ `Takt Time`
→ `Cycle Time`
→ `Operator Requirement`
→ `Operator Placement`
→ `Swing Line Balancing`
→ `Real-Time Monitoring`
→ `Performance Analytics`

The Phase-1 implementation must establish the data foundation required for this future architecture.
