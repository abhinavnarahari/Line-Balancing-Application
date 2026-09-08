# SewNexa™ — Operational User Manual
## Step-by-Step Operations, Process Flow Diagrams & Shopfloor Workflows

> **Document Version:** `v2.4.0` — Enterprise Production Release  
> **Target Audience:** Production Line Managers, Floor Supervisors, Industrial Engineers, Merchandisers  
> **Word Document Deliverable:** [`SewNexa_User_Manual.docx`](./SewNexa_User_Manual.docx)

---

## Executive Overview

Welcome to **SewNexa™**, the enterprise sewing line balancing and shopfloor manufacturing intelligence platform. 

This manual provides **step-by-step visual workflows**, **process flow diagrams**, and **practical operational instructions** to help floor teams manage commercial orders, engineering bulletins, operator skill matrices, dynamic line balancing, multi-interval production logging, and closed-loop throughput deductions.

---

## Table of Contents

1. [Navigation Architecture & Quick Reference](#1-navigation-architecture--quick-reference)
2. [End-to-End Factory Process Flow](#2-end-to-end-factory-process-flow)
3. [Chapter 1: Commercial Order Register & Schedule Pacing](#chapter-1-commercial-order-register--schedule-pacing)
4. [Chapter 2: Garment Styles & Operation Bulletins (OB)](#chapter-2-garment-styles--operation-bulletins-ob)
5. [Chapter 3: Operator Skill Matrix & Shift Attendance](#chapter-3-operator-skill-matrix--shift-attendance)
6. [Chapter 4: Planned Lines & Dynamic Balancing Engine](#chapter-4-planned-lines--dynamic-balancing-engine)
7. [Chapter 5: Shopfloor Production Monitoring & Closed-Loop Deductions](#chapter-5-shopfloor-production-monitoring--closed-loop-deductions)
8. [Chapter 6: Manager Notifications & 1-Click Bottleneck Routing](#chapter-6-manager-notifications--1-click-bottleneck-routing)
9. [Chapter 7: FAQ & Troubleshooting](#chapter-7-faq--troubleshooting)

---

## 1. Navigation Architecture & Quick Reference

```
┌──────────────────────────────────────────────────────────────┐
│                    SewNexa™ Navigation                       │
├────────────────────────┬─────────────────────────────────────┤
│ 🛒 Orders & Breakdown  │ Commercial POs & Timeline Tracking  │
│ 📐 Styles & Bulletins  │ Sewing Sequences, Machines & SMVs   │
│ ⭐ Skill Matrix        │ Operator Ratings (1–5) & Audits     │
│ ⚡ Planned Lines       │ Dynamic Balancing & Bottlenecks     │
│ 📊 Production Monitor  │ Hourly/2-Hour Logging & Deductions  │
│ 🔔 Notifications Bell  │ Manager Alerts & 1-Click Routing    │
└────────────────────────┴─────────────────────────────────────┘
```

---

## 2. End-to-End Factory Process Flow

```
[ Merchandising ]
       │
       ▼  Step 1: Create Order with Plan to Complete Date & Size Breakdown
[ Order Register ]
       │
       ▼  Step 2: Define Operation Sequences, Machine Classes & SMV
[ Operation Bulletin ]
       │
       ▼  Step 3: Check-in Shift Attendance & Skill Matrix Ratings (1–5)
[ Workforce Readiness ]
       │
       ▼  Step 4: Select Order/Line ➔ Set Takt Pacing ➔ Auto-Balance Line
[ Planned Lines & Balancing ]
       │
       ▼  Step 5: Log Hourly/2-Hour Operator Pieces ➔ Isolate by Date
[ Production Monitoring ]
       │
       ▼  Step 6: Deduct Finalized Pieces ➔ Update Takt & Dispatch Alerts
[ Closed-Loop TOC Balance ]
```

---

## Chapter 1: Commercial Order Register & Schedule Pacing

### Step-by-Step Instructions: Creating a Production Order

1. Click the **`+ Create New Order`** button at the top right of the Orders page.
2. Select the **Garment Style** (e.g. `ST-TSHIRT-01`).
3. Enter the **PO Number** (e.g. `PO-TSHIRT-480`) and **Buyer Name** (e.g. `Zara`).
4. Select **Order Date**, internal **Plan to Complete Date** (e.g. `20 Sept 2026`), and contractual **Delivery Date** (e.g. `25 Sept 2026`).
5. Enter quantities in the size breakdown matrix (`XS`, `S`, `M`, `L`, `XL`, `XXL`).
6. Click **`Create Order`** to commit the record to PostgreSQL.

> 💡 **Pro Tip:** Setting the *Plan to Complete Date* 3–5 days prior to the contractual *Delivery Date* establishes a buffer that protects the factory from shipment delay penalties.

---

## Chapter 2: Garment Styles & Operation Bulletins (OB)

### Step-by-Step Instructions: Setting Up an Operation Sequence

1. Open **`Styles & Bulletins`** in the navigation sidebar.
2. Click **`+ Add Operation`** to define operations in sewing sequence (e.g. `#1 Front Placket`, `#2 Shoulder Join`, `#3 Sleeve Attach`, `#4 Side Seam`, `#5 Bottom Hem`).
3. Assign the required **Machine Class** (`SNLS`, `OVERLOCK`, `FLATLOCK`, `KANSAI`).
4. Enter the **Standard Minute Value (SMV)** in minutes (e.g. `0.65 min` = 39 seconds).
5. Save the bulletin. The system automatically computes Total Garment SMV and Theoretical Pitch.

---

## Chapter 3: Operator Skill Matrix & Shift Attendance

### Step-by-Step Instructions: Evaluating Operator Proficiency

1. Open **`Skill Matrix`** from the navigation sidebar.
2. Search for the operator by name or employee ID.
3. Click on the rating selector for the respective operation:
   * **Grade 1:** Learner
   * **Grade 2:** Assistant
   * **Grade 3:** Skilled
   * **Grade 4:** Senior Specialist
   * **Grade 5:** Master Artisan
4. Select the new grade. The change is instantly saved to PostgreSQL and recorded in the **Skill Audit History Log**.

---

## Chapter 4: Planned Lines & Dynamic Balancing Engine

### Pacing Strategy Modes:

1. **Tab 1: Delivery Schedule Window (Overall Delivery Horizon)**
   * Calculates working days between today and the **Planned Complete Date** (excluding Sundays).
   * Dynamically calculates live Takt Time:
     $$\text{Takt Time} = \frac{\text{Net Available Seconds}}{\text{Remaining Order Quantity}}$$

2. **Tab 2: Fixed Shift Target (Day-Wise Shift Target)**
   * Sets a fixed daily target (e.g., 500 pcs/shift = 57.6s Takt).
   * Displays **Today's Completed End-Line Output** and tracks day-wise shift progress in real time.

### Resolving Bottleneck Workstations:

* Workstations exceeding Takt Time turn **Crimson** with a warning badge.
* **Option A:** Click **`+ Add Operator`** on the station card to assign a helper, halving the effective cycle time.
* **Option B:** Swap in a higher-rated Grade 4 or 5 operator.
* **Option C:** Click **`Auto-Balance Line`** for automated AI workload smoothing.

---

## Chapter 5: Shopfloor Production Monitoring & Closed-Loop Deductions

### Step-by-Step Instructions: Logging Operator Pieces

1. Open **`Production Monitoring`** from the navigation sidebar.
2. Select **Date** (e.g. `01-09-2026`), **Line** (`Line 01`), and **Shift** (`Shift A`).
3. In the Timesheet Matrix, enter completed pieces for each operator in their respective 1-hour or 2-hour interval slots.
4. The system validates entries against theoretical station capacity and calculates individual operator efficiency.

### Closed-Loop Quantity Deduction:

* **Day 1 (01-09-2026):** Operators complete 60 pieces. This output is deducted from the order (1,000 - 60 = 940 pcs remaining).
* **Day 2 (02-09-2026):** Operators complete 65 pieces. Cumulative output (125 pcs) is deducted (875 pcs remaining).
* **Date Isolation:** Timesheets are strictly partitioned by calendar date in PostgreSQL. Viewing a new date shows fresh blank slots while preserving historical logs.

---

## Chapter 6: Manager Notifications & 1-Click Bottleneck Routing

1. When a line workstation exceeds Takt Time, the top **Notification Bell** pulses with an unread badge.
2. Click the Bell icon to view the clean, simplified alert:
   > **Bottleneck Alert · Line 01**  
   > `PO-TSHIRT-480 · 1 station(s) exceed Takt (55.3s): #4 Bottom Hem (72.0s)`
3. **Click anywhere on the notification card:**
   * Automatically opens **`Planned Lines & Balancing`** in **`Fixed Shift Target`** mode with the affected production order preselected for immediate rebalancing.
4. Employs single-instance deduplication: existing alerts are updated in-place to prevent notification spam.

---

## Chapter 7: FAQ & Troubleshooting

* **Q: Why does Takt Time change when I enter completed pieces in Production Monitoring?**  
  **A:** Because SewNexa uses closed-loop dynamic balancing. As actual output reduces the remaining order quantity, less remaining work needs to be completed over the available time.
* **Q: Are records for different dates isolated?**  
  **A:** Yes. Each date has its own independent database records in PostgreSQL.
* **Q: How do I export my production register?**  
  **A:** Click the **`Export to Excel`** button at the top right of the Orders page.

---
*Operational User Manual compiled for SewNexa Platform.*
