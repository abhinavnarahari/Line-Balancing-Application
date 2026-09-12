# QTech Swing Line Balancing & Production Management Application
## Complete System Architecture, Industrial Engineering Guide & User Manual

---

## 1. Executive Summary & Core Purpose

The **QTech Swing Line Balancing & Production Management Application** is an enterprise-grade manufacturing execution and industrial engineering platform tailored for **garment and apparel manufacturing plants**.

It provides an end-to-end digital ecosystem that bridges the gap between theoretical Industrial Engineering (IE) planning and real-time shop-floor execution.

### Key Capabilities
* **Industrial Engineering & Line Balancing:** Dynamic workstation balancing and planned line efficiency calibration.
* **Operation Bulletins (OB):** Digital Operation Breakdown, Standard Minute Value (SMV) management, machine allocation, and precedence sequencing.
* **Yamazumi Pitch Balancing:** Real-time visual pitch charts with dual reference thresholds (Designed Pitch vs Customer Takt).
* **Skill Matrix & Multi-Skilling:** Automatic rating generation (Levels 1 to 5) powered by real historical cycle times and piece logs.
* **Piece-Rate & Live Production Logging:** 24-hour continuous timesheet logging with earned minute calculations, defect logging, and operator efficiency tracking.
* **Hourly Production Board:** Real-time visual hourly tracking board for shop-floor displays and line monitoring.
* **Plant Management Dashboard:** Executive oversight over plant-wide OEE, line balancing efficiency, labor utilization, bottleneck alerts, and delivery horizons.

---

## 2. Technology Stack & Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (Frontend)                            │
│  React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts      │
│  Port: 5173                                                                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API Calls / JSON
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API LAYER (Backend)                                │
│  Java 21 + Spring Boot 3.5.3 + Spring Data JPA + Hibernate 6.6 + Flyway    │
│  Port: 8085                                                                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ JDBC (HikariCP)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER (PostgreSQL)                              │
│  PostgreSQL 14+ (Port: 5432 / Database: qtech_linebalancing)                │
│  47 Automated Schema Migrations                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backend Components
* **Framework:** Spring Boot 3.5.3 (Java 21)
* **Database:** PostgreSQL (using Flyway for version-controlled migrations `V1` to `V47`)
* **Persistence:** Spring Data JPA with Hibernate 6.6
* **Security & Validation:** Jakarta Validation API, CORS configuration for cross-origin local and network deployment

### Frontend Components
* **Framework:** React 18 with TypeScript and Vite
* **Styling & Design System:** Modern Tailwind CSS with a curated warm terracotta palette (`#9C5B3C`, `#221912`, `#FDFBF7`, `#E6DDCE`), glassmorphic panels, and smooth micro-animations.
* **Icons & Visuals:** Lucide React
* **Data Visualization:** Custom SVG Yamazumi charts, load meters, interactive timeline bars, and Recharts KPI charts.

---

## 3. Core Modules & Feature Breakdown

```
                            APPLICATION MODULES
 ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
 │ Line Balancing  │   │   Bulletins     │   │  Skill Matrix   │
 │ & Capacity Plan │   │  (Operation OB) │   │ & Rating Engine │
 └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
 ┌─────────────────┐   ┌────────┴────────┐   ┌─────────────────┐
 │ Piece Rate &    │   │  Hourly Board   │   │ Plant Dashboard │
 │ Timesheet Logs  │   │  & Alerts Radar │   │ & Executive KPI │
 └─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

### Module 1: Line Balancing & Capacity Planning (`/line-balance`)

The Line Balancing module enables Industrial Engineers to allocate operations to workstations, assign operators, and balance cycle times against production targets.

#### Dual Target Modes
1. **Mode A: Direct Hourly Target**
   * The user specifies a target output in pieces per hour (e.g., 70 pcs/hr).
   * Customer Takt Time is calculated as: `3600 / Target Output`.
2. **Mode B: Shift & Delivery Horizon Target**
   * The user enters Total Order Quantity, Available Production Days, and Working Shifts.
   * Target per shift and required hourly run rates are automatically computed.

#### Expected Line Efficiency & Backward Capacity Calibration
Real factory lines operate between 70% and 85% efficiency due to fatigue, micro-stops, and style ramp-up. The application allows IEs to set the **Expected Line Efficiency** (default 80%, with presets `70%`, `75%`, `80%`, `85%`, `90%`, `100%`).

* **Design Capacity Formula:**
  `Required Design Capacity = Target Output / (Planned Efficiency / 100)`
  *Example:* Target = 70 pcs/hr, Efficiency = 80% (0.80)
  `Required Design Capacity = 70 / 0.80 = 87.5 pieces/hour`
* **Designed Pitch Time Formula:**
  `Designed Pitch Time = 3600 / Required Design Capacity = Customer Takt * (Planned Efficiency / 100)`
  *Example:* `3600 / 87.5 = 41.14 seconds/station`
* **Planned Manpower Formula:**
  `Planned Manpower = Total Garment SMV in seconds / Designed Pitch Time`
  *Example:* `900s / 41.14s = 21.9 operators (22 ops)`

#### Workstation Allocation & Bottleneck Auto-Fix
* Workstations are evaluated against `Designed Pitch Time`.
* If a station takes longer than the Designed Pitch Time (or station capacity is below Design Capacity), it is highlighted in terracotta as a **Bottleneck**.
* The **Auto-Fix (+1 Op)** button or **Auto-Balance Optimizer** automatically assigns shared helper operators or splits operations to resolve bottlenecks.

---

### Module 2: Yamazumi Pitch Line Balance Chart

An authentic Industrial Engineering visual tool embedded directly in the Line Balancing page.

#### Features
* **Vertical Column Bars:** Each bar represents a workstation's cycle time, color-coded by machine type and load condition.
* **Dual Reference Lines:**
  1. **Designed Pitch Line (Solid Terracotta #9C5B3C):** Operational target threshold (e.g., 41.1s).
  2. **Customer Takt Line (Dashed Slate #64748B):** Absolute customer delivery limit (e.g., 51.4s).
* **Efficiency Buffer:** The visual gap between the Designed Pitch and Customer Takt lines represents the 20% floor safety cushion.
* **Interactive Views:** Toggle between **Time View (seconds)**, **Capacity View (pcs/hour)**, and **Workload Load %**.

---

### Module 3: Operation Bulletins (OB) & Sequences (`/bulletins`)

The digital Operation Breakdown module for style preparation:
* **Section Grouping:** Cutting, Pre-Assembly, Assembly, Finishing, Quality.
* **Operation Attributes:** Operation Code, Operation Name, Standard SMV (minutes and seconds), Machine Category (SNLS, DNLS, 4-Thread Overlock, 5-Thread Flatlock, Kansai, Buttonhole, Button Attach, Manual, Iron, QC Checkpoint).
* **Precedence & Dependencies:** Defines required previous operations to prevent sequence errors.
* **Import / Export:** Excel/CSV template download and bulk upload for style libraries.

---

### Module 4: Skill Matrix & Rating Engine (`/skill-matrix`)

A real-time competency matrix that evaluates operators based on actual historical piece production and cycle-time data.

#### 5-Tier Competency Rating System
* **Level 5 - Master Operator:** Cycle time < 90% of Standard SMV (Efficiency > 110%).
* **Level 4 - Standard Operator:** Cycle time 90% - 105% of SMV (Efficiency 95% - 110%).
* **Level 3 - Competent Operator:** Cycle time 105% - 120% of SMV (Efficiency 80% - 95%).
* **Level 2 - Training / Improver:** Cycle time 120% - 140% of SMV (Efficiency 65% - 80%).
* **Level 1 - Novice:** Cycle time > 140% of SMV (Efficiency < 65%).

#### Multi-Skilling Metrics
* **Flexibility Score:** Number of operations an operator can perform at Level 3 or above.
* **Versatility Index:** Line coverage capability for unexpected absenteeism.

---

### Module 5: Piece Rate & 24-Hour Production Logs (`/production`)

Replaces manual paper logsheets with a live continuous digital production ledger:
* **Time Slot Recording:** Tracks start time, end time, and duration in minutes.
* **Quantity Breakdown:** Completed Pieces, Good Pieces, Rejected / Defective Pieces.
* **Live Earned vs Actual Minutes:**
  `Earned Minutes = Good Quantity * Standard SMV`
  `Operator Efficiency % = (Earned Minutes / Actual Work Minutes) * 100`
  `Defect Rate % = (Rejected Pieces / Completed Pieces) * 100`
* **Real-time Payroll & Piece Rate Support:** Computes earned value based on operator piece logs.

---

### Module 6: Hourly Production Board (`/hourly-board`)

Designed for TV displays on the sewing floor and real-time supervisor monitoring:
* **Hour-by-Hour Production Tracking:** Displays target vs actual for each 1-hour time slot across the shift.
* **Color-Coded Status:**
  * **Green (On Track):** Actual >= 95% of hourly target.
  * **Amber (Watch):** Actual between 80% and 94% of target.
  * **Red (Critical Bottleneck):** Actual < 80% of target.
* **Cumulative Shift Curve:** Visualizes cumulative output trend against customer commitment.
* **Hourly Defect Tracking:** Highlights spikes in rejected pieces per hour.

---

### Module 7: Plant Management Dashboard (`/dashboard`)

The executive mission-control center providing plant-wide performance metrics:
* **Overall Plant Efficiency:** Aggregated actual output vs total SMV.
* **Line Balancing Efficiency:** Measure of workload distribution balance across all stations.
* **Active Bottleneck Radar:** Real-time list of overloaded stations requiring supervisor intervention.
* **Labor & Attendance Overview:** Present operators, line assignments, and absenteeism rates.
* **Delivery Horizon Status:** Projected shipment dates based on current run rates.

---

## 4. Master Mathematical Formulas Reference

All formulas used across the application follow standard garment manufacturing Industrial Engineering principles:

| Parameter | Plain Text Formula | Example Calculation |
| :--- | :--- | :--- |
| **Customer Takt Time** | `3600 / Target Hourly Output` | `3600 / 70 = 51.43 seconds` |
| **Required Design Capacity** | `Target Output / (Planned Efficiency / 100)` | `70 / 0.80 = 87.5 pieces/hour` |
| **Designed Pitch Time** | `3600 / Required Design Capacity` | `3600 / 87.5 = 41.14 seconds` |
| **Theoretical Manpower** | `Total Line SMV in seconds / Customer Takt` | `900s / 51.43s = 17.5 operators` |
| **Planned Manpower** | `Total Line SMV in seconds / Designed Pitch Time` | `900s / 41.14s = 21.9 operators (22 ops)` |
| **Station Capacity** | `(3600 / Station Effective Time) * Allocated Operators` | `(3600 / 40s) * 1 = 90 pieces/hour` |
| **Station Workload %** | `(Station Effective Time / Designed Pitch Time) * 100` | `(38s / 41.14s) * 100 = 92.4%` |
| **Line Balance Efficiency %** | `(Total Line SMV / (Max Station Cycle Time * Total Ops)) * 100` | `(900 / (42 * 22)) * 100 = 97.4%` |
| **Operator Earned Minutes** | `Good Output Quantity * Standard Operation SMV` | `60 pcs * 0.35 min = 21.0 earned mins` |
| **Operator Efficiency %** | `(Earned Minutes / Actual Work Minutes) * 100` | `(21.0 / 25.0) * 100 = 84.0%` |
| **Defect Rate %** | `(Rejected Quantity / Completed Quantity) * 100` | `(3 / 60) * 100 = 5.0%` |

---

## 5. Database Architecture & Key Entities

The PostgreSQL schema consists of structured relational entities managed by Flyway migrations (`V1` to `V47`):

```
 ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
 │     orders      │──────<│   line_plans    │>──────│     shifts      │
 └─────────────────┘       └────────┬────────┘       └─────────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │  line_plan_assignments  │
                       └────────────┬────────────┘
                                    │
                 ┌──────────────────┴──────────────────┐
                 ▼                                     ▼
      ┌─────────────────────┐               ┌─────────────────────┐
      │     operations      │               │      operators      │
      └──────────┬──────────┘               └──────────┬──────────┘
                 │                                     │
                 ▼                                     ▼
      ┌─────────────────────┐               ┌─────────────────────┐
      │ piece_prod_logs     │<──────────────│  operator_skills    │
      └─────────────────────┘               └─────────────────────┘
```

### Core Database Tables
1. `orders`: Customer purchase orders, total order quantities, target delivery dates, style references.
2. `styles`: Apparel style definitions, fabric classifications, garment category.
3. `operations`: Individual sewing operations, standard SMV, machine code, complexity level.
4. `bulletin_headers` & `bulletin_lines`: Sequence of operations per style with standard minute values.
5. `lines`: Physical sewing lines in the plant (e.g., Line 01, Line 02).
6. `shifts`: Working shifts with start time, end time, break deductions, and net available working hours.
7. `operators`: Employee records, hire dates, assigned lines, attendance status.
8. `line_plans`: Line balance configurations, target outputs, and `planned_efficiency` (Double Precision).
9. `line_plan_assignments`: Station-to-operation and station-to-operator assignments with QC checkpoint flags.
10. `piece_production_logs`: Live 24-hour continuous piece tracking logs (start time, end time, good qty, reject qty, earned minutes).
11. `operator_skill_matrix`: Historical operator competencies per operation with average cycle times and level ratings.
12. `hourly_production`: Aggregated hourly targets, actual outputs, and variance metrics per sewing line.

---

## 6. Installation, Configuration & Running Locally

### Prerequisites
* **Java Development Kit (JDK):** Version 21
* **Build Tool:** Apache Maven 3.9+
* **Node.js:** Version 18+ or 20+ (with `npm`)
* **Database:** PostgreSQL 14 or higher

---

### Step 1: Database Setup
Create the PostgreSQL database:
```sql
CREATE DATABASE qtech_linebalancing;
```
Verify connection credentials in `backend/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/qtech_linebalancing
    username: postgres
    password: 1234
```

---

### Step 2: Start the Backend Server (Spring Boot)
Open a terminal in the `backend/` directory:
```bash
cd backend
mvn spring-boot:run
```
* The backend will run on **http://localhost:8085**.
* Flyway will automatically apply all migrations (`V1` to `V47`).
* Health check: `http://localhost:8085/actuator/health`

---

### Step 3: Start the Frontend Application (Vite + React)
Open another terminal in the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
* The frontend will start at **http://localhost:5173**.
* Open your browser and navigate to `http://localhost:5173`.

---

## 7. Step-by-Step User Workflows

### Workflow 1: Creating & Balancing a New Sewing Line Plan
1. Navigate to **Line Balance** (`/line-balance`).
2. Select the **Order**, **Sewing Line**, and **Shift**.
3. Choose your target mode:
   * **Mode A:** Enter target pieces per hour (e.g., `70`).
   * **Mode B:** Enter order quantity and delivery horizon days.
4. Set the **Expected Line Efficiency** using the quick presets (`70%`, `75%`, `80% (Std)`, `85%`, `90%`, `100%`) or slider.
   * Review the live formula breakdown: `70 / 0.80 = 87.5 pcs/hr`.
5. Review the **Workstation Balancing Table**:
   * Inspect stations highlighted in terracotta as bottlenecks (`Cycle Time > Designed Pitch Time`).
   * Click **Auto-Fix (+1 Op)** on bottleneck stations to add an operator or split the task.
   * Or click **Auto-Balance Line** to run the global heuristic balancing algorithm.
6. Check the **Yamazumi Pitch Chart** to ensure all station bars stay beneath the terracotta **Designed Pitch Time Line**.
7. Click **Save Plan** to store the balanced configuration.

---

### Workflow 2: Shop-Floor Piece-Rate & Timesheet Logging
1. Operators or station data clerks navigate to **Piece Rate Logging** (`/production`).
2. Select the **Sewing Line**, **Operator Name**, and **Operation**.
3. Record the hourly batch:
   * Enter **Start Time** and **End Time**.
   * Enter **Good Pieces** and **Rejected Pieces**.
4. The system automatically computes:
   * **Work Minutes**
   * **Earned Minutes**
   * **Operator Efficiency %**
   * **Defect Rate %**
5. Click **Submit Log**. Real-time skill ratings and hourly boards update immediately.

---

### Workflow 3: Monitoring the Shop-Floor Hourly Display
1. Open the **Hourly Production Board** (`/hourly-board`) on shop-floor TV monitors.
2. Select the active **Sewing Line** and **Shift**.
3. The board refreshes continuously:
   * Visualizes hourly actuals vs hourly targets.
   * Flags red alerts if hourly pace drops below 80%.
   * Displays the cumulative output vs shift target progress curve.

---

## 8. Summary of Benefits for Apparel Factories

* **Eliminates Overproduction and Shortages:** Plans capacity accurately by incorporating realistic 80% line efficiency rather than idealized 100% assumptions.
* **Reduces Work-in-Progress (WIP) Piles:** Synchronizes workstation cycle times to Designed Pitch Time, preventing bottlenecks and idle waiting stations.
* **Empowers Data-Driven Decisions:** Live skill matrices ensure operators are placed on machines matching their actual historical cycle-time competency.
* **Paperless Shop Floor:** Seamless digital flow from Industrial Engineering Operation Bulletins to piece rate tracking and executive dashboards.
