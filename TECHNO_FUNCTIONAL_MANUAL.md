# SewNexa™ — Techno-Functional Manual
## Enterprise Apparel Sewing Line Balancing & Manufacturing Execution System (MES)

> **Document Version:** `v2.4.0` — Enterprise Production Release  
> **Target Audience:** Industrial Engineers (IEs), Production Floor Managers, Solution Architects, Tech Leads, QA Engineers  
> **Tech Stack:** Spring Boot 3 (Java 21) + PostgreSQL (Flyway 38 Migrations) + React 18 + TypeScript + Tailwind CSS v4 + Vite  
> **Word Document Deliverable:** [`SewNexa_Techno_Functional_Manual.docx`](./SewNexa_Techno_Functional_Manual.docx)

---

## Executive Summary

**SewNexa™** is an enterprise-grade Manufacturing Execution System (MES) and Dynamic Line Balancing platform purpose-built for the apparel and garment manufacturing industry.

In traditional apparel factories, industrial engineers (IEs) and floor managers face severe operational hurdles:
- **Bottleneck Operations:** Heavy sewing operations exceed cycle limits, starving downstream operators and accumulating high Work-In-Progress (WIP).
- **Static vs Dynamic Disconnect:** Production logs recorded during daily operations are rarely tied back to calculate remaining delivery Takt Time.
- **Workforce Mismatch:** Operator skill competencies and shift attendance records are fragmented across spreadsheets.

SewNexa closes this loop with an **AI-driven closed-loop manufacturing engine**: every piece recorded during daily shift production is automatically deducted from active orders, dynamically pacing Takt Time and dispatching proactive bottleneck alerts.

---

## Table of Contents

1. [Apparel Industrial Engineering Foundations](#1-apparel-industrial-engineering-foundations)
2. [End-to-End Business Flow & Manufacturing Lifecycle](#2-end-to-end-business-flow--manufacturing-lifecycle)
3. [Functional Module Specifications](#3-functional-module-specifications)
   - [3.1 Commercial Order Management & Planned Completion Pacing](#31-commercial-order-management--planned-completion-pacing)
   - [3.2 Style Engineering & Operation Bulletins (OB)](#32-style-engineering--operation-bulletins-ob)
   - [3.3 Operator Skill Matrix & Historical Assessment Tracking](#33-operator-skill-matrix--historical-assessment-tracking)
   - [3.4 Planned Lines & Dynamic Balancing Engine](#34-planned-lines--dynamic-balancing-engine)
   - [3.5 Multi-Interval Shopfloor Production Monitoring](#35-multi-interval-shopfloor-production-monitoring)
   - [3.6 Intelligent Manager Notification Subsystem](#36-intelligent-manager-notification-subsystem)
4. [Technical Architecture & System Design](#4-technical-architecture--system-design)
   - [4.1 Architecture Diagram & Component Layering](#41-architecture-diagram--component-layering)
   - [4.2 Database Schema & Entity Relational Model](#42-database-schema--entity-relational-model)
   - [4.3 REST API Endpoints Reference](#43-rest-api-endpoints-reference)
   - [4.4 Core Mathematical Algorithms](#44-core-mathematical-algorithms)
5. [Deployment & Operations Guide](#5-deployment--operations-guide)

---

## 1. Apparel Industrial Engineering Foundations

SewNexa implements globally recognized apparel manufacturing Industrial Engineering (IE) standards:

| Standard / Metric | Formula / Standard Definition | Operational Role & Significance |
| :--- | :--- | :--- |
| **Standard Minute Value (SMV)** | $\text{SMV} = \text{Basic Time} \times (1 + \text{PFD Allowance } \%)$ | The standard work content required for a qualified operator at 100% rating to complete a specific sewing operation. |
| **Basic Pitch Time (BPT)** | $\text{BPT} = \frac{\text{Total Garment SMV} \times 60}{\text{Total Allocated Operators}}$ | The theoretical average cycle time per workstation under perfect work distribution. |
| **Takt Time (Delivery Paced)** | $\text{Takt Time} = \frac{\text{Net Available Production Seconds}}{\text{Remaining Order Units}}$ | The maximum allowable cycle time per workstation required to meet the customer's delivery deadline or internal planned completion date. |
| **Takt Time (Shift Paced)** | $\text{Takt Time} = \frac{\text{Shift Operating Seconds (e.g. 28,800s)}}{\text{Fixed Shift Target Pieces}}$ | The workstation cycle pace required to satisfy the daily shift production quota (e.g., 600 pcs/shift = 48.0s Takt). |
| **Line Balance Efficiency (LBE)** | $\text{LBE} \% = \frac{\sum \text{SMV}}{\text{Bottleneck Cycle Time} \times \text{Total Operators}} \times 100$ | Measures line synchronization. Higher efficiency (>85%) minimizes idle waiting time and WIP pile-ups. |
| **PFD Allowance** | Personal (5%) + Fatigue (4%) + Delay (1%) = **10%** | Standard relaxation allowances added to observed sewing times. |

---

## 2. End-to-End Business Flow & Manufacturing Lifecycle

```
[ Commercial PO Booking ] ───► [ Order Management (Plan to Complete & Delivery) ]
                                          │
                                          ▼
[ Style & OB Engineering ] ───► [ Operation Sequences & SMV Benchmarks ]
                                          │
                                          ▼
[ Floor Attendance & Skills ] ──► [ Operator Allocation & Dynamic Line Balancing ]
                                          │
                                          ▼
[ Live Shopfloor Monitoring ] ──► [ 1h / 2h Interval Piece Production Entry ]
                                          │
                                          ▼
[ Real-Time TOC Closed Loop ] ──► [ Deduct Finalized Pieces ➔ Update Takt & Alerts ]
```

---

## 3. Functional Module Specifications

### 3.1 Commercial Order Management & Planned Completion Pacing
- **Dual Completion Milestones:**
  - **Plan to Complete Date:** Factory sewing target deadline (used by IE for takt time pacing).
  - **Contractual Delivery Date:** Final buyer shipment deadline.
- **Smart Countdown Badges:** Displays days remaining and safety buffers (e.g. `18d target left`, `4d buffer before delivery`).
- **Matrix Breakdown:** Multi-size entry with instant total validation.
- **Excel Export:** Generates standardized production registers for executive meetings.

### 3.2 Style Engineering & Operation Bulletins (OB)
- Operation sequence mapping with machine categorization (Single Needle, Overlock, Flatlock, Kansai).
- Standard SMV setup with international seam type classifications (ISO 4915).

### 3.3 Operator Skill Matrix & Historical Assessment Tracking
- **Multi-Grade Proficiency (1–5):** From Trainee to Master Artisan.
- **Skill Audit History:** Temporal logging of rating adjustments with timestamps and reviewer IDs for ISO-9001 auditability.

### 3.4 Planned Lines & Dynamic Balancing Engine
- **Delivery Schedule Window Mode:** Paces line based on remaining working days (excluding factory Sundays).
- **Fixed Shift Target Mode:** Paces line based on day-wise shift output targets.
- **Bottleneck Detection:** Highlights operations exceeding Takt Time in high-contrast crimson.
- **One-Click AI Auto-Balancing:** Analyzes present operators, matches skill ratings against operation complexity, and balances pitch time.

### 3.5 Multi-Interval Shopfloor Production Monitoring
- Floor managers enter completed pieces per operator at 1-hour or 2-hour intervals.
- **Date-Isolated Storage:** Guarantees that logs for `01-09-2026` and `02-09-2026` remain strictly independent.
- **Cumulative End-Line Throughput:** Final output is automatically deducted from active orders in Planned Lines.

### 3.6 Intelligent Manager Notification Subsystem
- **Single-Instance Deduplication:** Updates existing notifications in-place rather than spamming duplicate records.
- **Direct Action Routing:** Clicking any bottleneck notification navigates straight to **Planned Lines in Fixed Shift Target mode**.

---

## 4. Technical Architecture & System Design

### 4.1 Architecture Diagram & Component Layering

```
┌──────────────────────────────────────────────────────────────────┐
│                   React 18 + Vite Frontend (SPA)                 │
│  • Orders Page  • Skill Matrix  • Line Balancing  • Monitoring   │
│  • Framer Motion Transitions   • React Portals (z-[9999] Modals) │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ HTTP / JSON REST APIs
┌─────────────────────────────────▼────────────────────────────────┐
│                   Spring Boot 3.3.x Backend                      │
│  • Security & CORS Filters     • Transactional Service Layer     │
│  • Domain Controllers          • Spring Data JPA Repositories    │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ JPA / Hibernate ORM
┌─────────────────────────────────▼────────────────────────────────┐
│                   PostgreSQL 15 Relational DB                    │
│  • 38 Flyway Migrations (V1..V38)  • ACID Referential Integrity  │
│  • Indexed Foreign Keys            • JSONB Performance Caching   │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Database Schema & Entity Relational Model

Key relational tables:
1. `orders`: Primary PO registry with `order_date`, `planned_completion_date`, and `delivery_date`.
2. `order_sizes`: Breakdown of size allocations per order.
3. `operation_bulletins`: Garment operation definitions with SMV values.
4. `operators` & `operator_skills`: Workforce registry with 1–5 proficiency ratings.
5. `operator_skill_history`: Audit trail of skill modifications.
6. `attendance_records`: Multi-shift check-ins with late arrival detection.
7. `piece_production_logs`: Interval-based piece entry per operator per date.
8. `notifications`: Manager alerts with deduplication by `type` and `reference_id`.

### 4.3 REST API Endpoints Reference

| Method | Endpoint | Module | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/orders` | Orders | Fetches order register with completion dates. |
| `POST` | `/api/orders` | Orders | Creates new commercial order with size breakdown. |
| `GET` | `/api/lines` | Lines | Fetches sewing lines and line capacity limits. |
| `GET` | `/api/bulletins` | Bulletins | Fetches style operation sequence and SMVs. |
| `POST` | `/api/piece-production/log` | Monitoring | Saves operator interval piece logs for a specific date. |
| `GET` | `/api/piece-production/24h-timesheet` | Monitoring | Retrieves date-isolated daily matrix. |
| `POST` | `/api/notifications/bottleneck-alert` | Notifications | Dispatches de-duplicated manager bottleneck alert. |

---

## 5. Deployment & Operations Guide

### Prerequisites
- **Java:** JDK 21+
- **Database:** PostgreSQL 14+
- **Node.js:** v18+ & npm 9+
- **Build Tool:** Apache Maven 3.8+

### Running the Services

1. **PostgreSQL Setup:**
   ```sql
   CREATE DATABASE line_balancing;
   ```
2. **Backend API Service:**
   ```bash
   cd backend
   mvn spring-boot:run
   # Running on http://localhost:8080
   ```
3. **Frontend Client Application:**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Running on http://localhost:5173
   ```

---
*Manual compiled by Senior Software Engineering Architecture Team for SewNexa Platform.*
