import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_cell_borders(cell, top="CCCCCC", bottom="CCCCCC", left=None, right=None):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{top}"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="{bottom}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)

def add_callout(doc, text, title="INDUSTRIAL NOTE", fill_hex="F8FAFC", border_hex="9C5B3C"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, fill_hex)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Left border highlight
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_hex}"/>'
        f'<w:top w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run_t = p.add_run(f"📌 {title}: ")
    run_t.bold = True
    run_t.font.name = "Arial"
    run_t.font.size = Pt(10)
    run_t.font.color.rgb = RGBColor(156, 91, 60)
    
    run_b = p.add_run(text)
    run_b.font.name = "Arial"
    run_b.font.size = Pt(9.5)
    run_b.font.color.rgb = RGBColor(51, 65, 85)
    doc.add_paragraph()

def build_manual():
    doc = docx.Document()
    
    # Page Setup - Normal Margins (1 inch)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    # Styles Setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Arial'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(34, 40, 49)

    # ── COVER / TITLE HEADER ────────────────────────────────────────────────
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(18)
    title_p.paragraph_format.space_after = Pt(4)
    run_brand = title_p.add_run("SewNexa™ Manufacturing Execution Platform\n")
    run_brand.font.name = 'Arial Black'
    run_brand.font.size = Pt(22)
    run_brand.font.color.rgb = RGBColor(30, 58, 138) # Navy

    run_main_title = title_p.add_run("TECHNO-FUNCTIONAL MANUAL\n")
    run_main_title.font.name = 'Arial'
    run_main_title.font.size = Pt(18)
    run_main_title.bold = True
    run_main_title.font.color.rgb = RGBColor(156, 91, 60) # Terracotta

    run_sub = title_p.add_run("End-to-End Business Functionality, Industrial Engineering Math & Technical Architecture Design")
    run_sub.font.name = 'Arial'
    run_sub.font.size = Pt(11)
    run_sub.italic = True
    run_sub.font.color.rgb = RGBColor(100, 116, 139)

    # Meta Table
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Application Name", "SewNexa (Sewing Line Balancing & Shopfloor Intelligence MES)"),
        ("Document Version", "v2.4.0 — Enterprise Production Release"),
        ("Target Audience", "Industrial Engineers (IE), Production Managers, Tech Leads, Solution Architects"),
        ("Core Technology Stack", "Spring Boot 3 (Java 21), PostgreSQL 15, React 18, TypeScript, Tailwind CSS, Vite"),
        ("Classification", "Enterprise Confidential & Technical Reference Guide")
    ]
    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        c1, c2 = row.cells[0], row.cells[1]
        c1.width = Inches(2.2)
        c2.width = Inches(4.3)
        set_cell_background(c1, "F1F5F9")
        set_cell_background(c2, "FFFFFF")
        set_cell_margins(c1, 60, 60, 100, 100)
        set_cell_margins(c2, 60, 60, 100, 100)
        set_cell_borders(c1, "E2E8F0", "E2E8F0")
        set_cell_borders(c2, "E2E8F0", "E2E8F0")
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(k)
        r1.bold = True
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(30, 41, 59)
        
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(v)
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph()
    doc.add_page_break()

    # ── TABLE OF CONTENTS ──────────────────────────────────────────────────
    toc_head = doc.add_heading("Table of Contents", level=1)
    toc_head.style.font.color.rgb = RGBColor(30, 58, 138)

    toc_items = [
        ("1. Executive Summary & Product Vision", "3"),
        ("2. Apparel Industrial Engineering Foundations", "4"),
        ("3. Business Flow & Operational Lifecycles", "6"),
        ("4. Comprehensive Functional Modules", "9"),
        ("    4.1 Commercial Order Management & Planned Completion", "9"),
        ("    4.2 Style Library & Operation Bulletins (OB)", "11"),
        ("    4.3 Operator Skill Matrix & Historical Assessment Tracking", "13"),
        ("    4.4 Planned Lines & Dynamic Balancing Engine", "15"),
        ("    4.5 Production Monitoring & Daily Output Feedback Loop", "19"),
        ("    4.6 Notification Center & Intelligent Manager Alerts", "22"),
        ("5. Technical Architecture & System Design", "24"),
        ("    5.1 System Architecture Diagram & Layering", "24"),
        ("    5.2 Database Schema & Entity Relational Model", "26"),
        ("    5.3 REST API Specifications & Core Endpoints", "30"),
        ("    5.4 Mathematical Formulations & IE Algorithms", "34"),
        ("6. Deployment, Configuration & Maintenance Guide", "38")
    ]

    for item, page in toc_items:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r_item = p.add_run(item)
        r_item.font.size = Pt(10)
        r_item.font.color.rgb = RGBColor(30, 41, 59)
        if not item.startswith("    "):
            r_item.bold = True

    doc.add_page_break()

    # ── 1. EXECUTIVE SUMMARY ────────────────────────────────────────────────
    h1 = doc.add_heading("1. Executive Summary & Product Vision", level=1)
    h1.style.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "SewNexa™ is an enterprise-grade Manufacturing Execution System (MES) and Line Balancing platform engineered specifically for apparel manufacturing, garment export houses, and precision textile assembly plants."
    )
    doc.add_paragraph(
        "In traditional apparel factories, industrial engineers (IEs) and floor managers face severe operational inefficiencies: bottleneck workstations starve downstream operators, unbalanced lines cause high Work-In-Progress (WIP), operator skill mismatches decrease productivity, and daily end-line outputs are decoupled from delivery deadlines."
    )
    doc.add_paragraph(
        "SewNexa bridges this critical gap by harmonizing commercial purchase orders, operational engineering bulletins (SMVs), operator multi-skill assessments, shift attendances, live interval tracking, and Theory-of-Constraints (TOC) dynamic balancing algorithms into a unified, real-time command center."
    )

    add_callout(
        doc,
        "SewNexa introduces Closed-Loop Dynamic Balancing: every verified piece recorded in Production Monitoring automatically deducts from the active order quantity, instantly updating the remaining delivery workload and recalculating Takt Time in real time.",
        title="CORE VALUE DRIVER",
        border_hex="1E3A8A"
    )

    # ── 2. APPAREL INDUSTRIAL ENGINEERING FOUNDATIONS ──────────────────────
    h2 = doc.add_heading("2. Apparel Industrial Engineering Foundations", level=1)
    h2.style.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "To maximize throughput and eliminate bottlenecks, SewNexa relies on globally standardized garment manufacturing Industrial Engineering formulas and principles:"
    )

    ie_table = doc.add_table(rows=6, cols=3)
    ie_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Term / Metric", "Formula / Standard", "Operational Role & Significance"]
    
    for c_idx, text in enumerate(headers):
        cell = ie_table.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    rows_data = [
        ("Standard Minute Value (SMV)", "Basic Time + (Basic Time × Allowance %)", "The standard work content required for a qualified operator at 100% rating to complete a specific sewing operation."),
        ("Basic Pitch Time (BPT)", "Total Garment SMV ÷ Total Number of Operators", "The theoretical average cycle time per workstation when work is perfectly distributed across all allocated operators."),
        ("Takt Time (Delivery Paced)", "Net Available Operating Secs ÷ Remaining Order Units", "The maximum allowable cycle time per workstation required to meet the customer's delivery deadline or internal completion target."),
        ("Takt Time (Shift Paced)", "Shift Operating Secs (e.g. 28,800s) ÷ Fixed Shift Target Pcs", "The workstation cycle pace needed to satisfy daily factory production targets (e.g., 500 pcs/shift)."),
        ("Line Balance Efficiency (LBE)", "Total SMV ÷ (Bottleneck Cycle Time × Total Operators) × 100", "Indicates the level of synchronization across sewing stations. Higher percentage (>85%) represents balanced flow with minimal WIP buildup.")
    ]

    for r_idx, (t, f, s) in enumerate(rows_data):
        row = ie_table.rows[r_idx + 1]
        c1, c2, c3 = row.cells[0], row.cells[1], row.cells[2]
        c1.width, c2.width, c3.width = Inches(1.8), Inches(2.3), Inches(2.6)
        for c in [c1, c2, c3]:
            set_cell_margins(c, 60, 60, 80, 80)
            set_cell_borders(c, "E2E8F0", "E2E8F0")
            if r_idx % 2 == 1:
                set_cell_background(c, "F8FAFC")
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(t)
        r1.bold = True
        r1.font.size = Pt(9)
        
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(f)
        r2.font.size = Pt(8.5)
        r2.font.name = "Consolas"
        r2.font.color.rgb = RGBColor(156, 91, 60)
        
        p3 = c3.paragraphs[0]
        r3 = p3.add_run(s)
        r3.font.size = Pt(8.5)

    doc.add_paragraph()

    # ── 3. BUSINESS FLOW & OPERATIONAL LIFECYCLES ──────────────────────────
    h3 = doc.add_heading("3. Business Flow & Operational Lifecycles", level=1)
    h3.style.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "SewNexa coordinates a six-stage closed-loop manufacturing lifecycle from merchandising order entry to automated shopfloor production reconciliation:"
    )

    steps = [
        ("Stage 1: Commercial Order Booking & Timeline Scheduling", "Merchandising creates Purchase Orders with size breakdowns, color specs, contractual Delivery Dates, and internal 'Plan to Complete Dates' that incorporate buffer days before shipment."),
        ("Stage 2: Style Engineering & Operation Bulletin (OB) Setup", "Industrial Engineering establishes the master garment operation sequence, assigning machine classes (Single Needle Lockstitch, Overlock, Flatlock, Kansai, Feed-off-the-Arm) and calculated Standard Minute Values (SMVs)."),
        ("Stage 3: Multi-Skilled Workforce Rating & Shift Attendance", "HR and Production Supervisors record daily shift clock-ins (Shift A, Shift B, Shift C). Operators are mapped against an audited 1–5 Skill Matrix with historical proficiency logs."),
        ("Stage 4: Planned Line Balancing & Manpower Allocation", "IE assigns operators to workstations based on skill compatibility and machine requirements. The engine computes Theoretical Manpower, calculates Station Load %, highlights Bottlenecks exceeding Takt Time, and allows one-click AI Auto-Balancing."),
        ("Stage 5: Live Shopfloor Production Monitoring & Interval Tracking", "Floor Line Managers enter operator-wise completed pieces at 1-hour or 2-hour intervals. The system validates pieces against theoretical station capacity, isolates daily date records, and computes End-Line final throughput."),
        ("Stage 6: Real-Time Dynamic Feedback & Manager Alerting", "Finalized daily output is automatically deducted from the remaining order balance in Planned Lines. If any station cycle exceeds Takt Time, single-instance de-duplicated critical alerts are dispatched to the Manager's Notification Center.")
    ]

    for title, desc in steps:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        r_t = p.add_run(f"{title}: ")
        r_t.bold = True
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = RGBColor(156, 91, 60)
        r_d = p.add_run(desc)
        r_d.font.size = Pt(9.5)

    doc.add_page_break()

    # ── 4. COMPREHENSIVE FUNCTIONAL MODULES ────────────────────────────────
    h4 = doc.add_heading("4. Comprehensive Functional Modules", level=1)
    h4.style.font.color.rgb = RGBColor(30, 58, 138)

    # 4.1 Orders
    h4_1 = doc.add_heading("4.1 Commercial Order Management & Planned Completion", level=2)
    h4_1.style.font.color.rgb = RGBColor(156, 91, 60)
    doc.add_paragraph(
        "The Order Register manages commercial apparel contracts. Key features include:"
    )
    doc.add_paragraph(
        "• Dual Target Date Control: Manages both contractual 'Delivery Date' (buyer deadline) and internal 'Plan to Complete Date' (factory completion target).\n"
        "• Buffer & Countdown Badges: Displays real-time countdown chips (e.g., '18d target left', '4d buffer before delivery') to alert planners to tight delivery windows.\n"
        "• Multi-Size Matrix Breakdown: Allows matrix entry of sizes (XS, S, M, L, XL, XXL) with automated sum reconciliation.\n"
        "• Excel Data Export: Generates formatted production registers for factory planning meetings."
    )

    # 4.2 Bulletins
    h4_2 = doc.add_heading("4.2 Style Library & Operation Bulletins (OB)", level=2)
    h4_2.style.font.color.rgb = RGBColor(156, 91, 60)
    doc.add_paragraph(
        "Defines the product technical specification. Each Bulletin specifies the exact sewing sequence (e.g., Collar Preparation, Sleeve Setting, Bottom Hemming), machine requirements, SMV, and seam types (ISO 4915)."
    )

    # 4.3 Skill Matrix
    h4_3 = doc.add_heading("4.3 Operator Skill Matrix & Historical Assessment Tracking", level=2)
    h4_3.style.font.color.rgb = RGBColor(156, 91, 60)
    doc.add_paragraph(
        "SewNexa provides a multi-grade skill rating system (Grades 1 to 5: Learner to Master) across operations and machine categories. Every change is logged with timestamp and user attribution in the Skill Audit History log for compliance and ISO-9001 certifications."
    )

    # 4.4 Planned Lines & Dynamic Balancing
    h4_4 = doc.add_heading("4.4 Planned Lines & Dynamic Balancing Engine", level=2)
    h4_4.style.font.color.rgb = RGBColor(156, 91, 60)
    doc.add_paragraph(
        "The core mathematical balancing engine provides two operational pacing modes:"
    )
    doc.add_paragraph(
        "1. Delivery Schedule Window Mode: Computes working days remaining between today and the Planned Complete Date (excluding factory off-days like Sundays) to establish the live required hourly output.\n"
        "2. Fixed Shift Target Mode: Establishes a daily shift production goal (e.g., 600 pieces in an 8-hour shift = 75 pcs/hr = 48.0s Takt Time).\n"
        "3. Theory of Constraints Bottleneck Highlighting: Workstations exceeding Takt Time are automatically highlighted in crimson with capacity warnings.\n"
        "4. One-Click AI Auto-Balancing: Analyzes present operators, matches skill ratings against operation difficulty, allocates float helpers to heavy stations, and balances pitch time."
    )

    # 4.5 Production Monitoring
    h4_5 = doc.add_heading("4.5 Production Monitoring & Daily Output Feedback Loop", level=2)
    h4_5.style.font.color.rgb = RGBColor(156, 91, 60)
    doc.add_paragraph(
        "Enables floor line supervisors to log operator pieces in regular intervals (1 hour, 2 hours, or shift end). Key mechanisms:"
    )
    doc.add_paragraph(
        "• Date Isolation: Records are strictly partitioned by calendar date in PostgreSQL (e.g., 01-09-2026 data remains independent from 02-09-2026).\n"
        "• Closed-Loop Quantity Deduction: Cumulative end-line throughput is automatically deducted from total order quantity in Planned Lines, dynamically increasing or decreasing remaining takt time.\n"
        "• Operator Efficiency Tracking: Calculates operator earned minutes vs available minutes in real time."
    )

    # 4.6 Notifications
    h4_6 = doc.add_heading("4.6 Notification Center & Intelligent Manager Alerts", level=2)
    h4_6.style.font.color.rgb = RGBColor(156, 91, 60)
    doc.add_paragraph(
        "Keeps management informed with actionable, de-duplicated alerts:"
    )
    doc.add_paragraph(
        "• Single-Notification Deduplication: Prevents alert flooding by updating existing active alerts in-place rather than creating duplicate rows.\n"
        "• Direct Navigation: Clicking any Bottleneck Notification automatically navigates directly to Planned Lines in Fixed Shift Target mode with the affected order preselected."
    )

    doc.add_page_break()

    # ── 5. TECHNICAL ARCHITECTURE & SYSTEM DESIGN ──────────────────────────
    h5 = doc.add_heading("5. Technical Architecture & System Design", level=1)
    h5.style.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "SewNexa is built upon a modern, cloud-ready, high-performance layered architecture following Domain-Driven Design (DDD) principles:"
    )

    tech_table = doc.add_table(rows=6, cols=3)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tech_headers = ["Layer / Component", "Technology Stack", "Key Responsibilities & Design Patterns"]
    
    for c_idx, text in enumerate(tech_headers):
        cell = tech_table.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    tech_data = [
        ("Frontend Presentation", "React 18, TypeScript, Tailwind CSS, Vite, Framer Motion", "Interactive Single Page Application (SPA), React Portals for modal layering, custom responsive design system."),
        ("Backend Services", "Java 21, Spring Boot 3.3.x, Spring Web, Spring Data JPA", "RESTful API controllers, Transactional Service Layer (@Transactional), DTO mapping, validation filters."),
        ("Persistence & Migration", "PostgreSQL 15, Flyway Migration Engine (38 Versions)", "ACID compliance, schema versioning, foreign key integrity, temporal audit logs."),
        ("Industrial Math Engine", "Client/Server Hybrid IE Computation Modules", "Takt time calculators, PFD allowance engines, line efficiency algorithms, bottleneck detection."),
        ("Notification Subsystem", "Spring Event / REST Notification Hub", "Manager alert dispatch, de-duplication cache, unread counter synchronization.")
    ]

    for r_idx, (l, t, r) in enumerate(tech_data):
        row = tech_table.rows[r_idx + 1]
        c1, c2, c3 = row.cells[0], row.cells[1], row.cells[2]
        c1.width, c2.width, c3.width = Inches(1.8), Inches(2.3), Inches(2.6)
        for c in [c1, c2, c3]:
            set_cell_margins(c, 60, 60, 80, 80)
            set_cell_borders(c, "E2E8F0", "E2E8F0")
            if r_idx % 2 == 1:
                set_cell_background(c, "F8FAFC")
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(l)
        r1.bold = True
        r1.font.size = Pt(9)
        
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(t)
        r2.font.size = Pt(8.5)
        r2.font.name = "Consolas"
        r2.font.color.rgb = RGBColor(30, 58, 138)
        
        p3 = c3.paragraphs[0]
        r3 = p3.add_run(r)
        r3.font.size = Pt(8.5)

    doc.add_paragraph()

    # 5.2 API Surface
    h5_3 = doc.add_heading("5.3 Core REST API Specifications", level=2)
    h5_3.style.font.color.rgb = RGBColor(156, 91, 60)

    api_table = doc.add_table(rows=8, cols=3)
    api_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    api_headers = ["HTTP Method & Route", "Module", "Description & Payload Details"]
    
    for c_idx, text in enumerate(api_headers):
        cell = api_table.rows[0].cells[c_idx]
        set_cell_background(cell, "334155")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    api_rows = [
        ("GET /api/orders", "Orders", "Retrieves all production orders with size breakdown and completion dates."),
        ("POST /api/orders", "Orders", "Creates order with orderDate, plannedCompletionDate, and deliveryDate."),
        ("GET /api/lines", "Sewing Lines", "Fetches active manufacturing lines, target pitch time, and capacities."),
        ("GET /api/bulletins", "Engineering", "Retrieves Operation Bulletins, SMVs, and sequence mappings."),
        ("POST /api/piece-production/log", "Monitoring", "Logs operator pieces for a specific date, shift, and time interval."),
        ("GET /api/piece-production/24h-timesheet", "Monitoring", "Fetches date-isolated hourly matrix per operator."),
        ("POST /api/notifications/bottleneck-alert", "Alerts", "Triggers single de-duplicated manager bottleneck notification.")
    ]

    for r_idx, (route, mod, desc) in enumerate(api_rows):
        row = api_table.rows[r_idx + 1]
        c1, c2, c3 = row.cells[0], row.cells[1], row.cells[2]
        c1.width, c2.width, c3.width = Inches(2.4), Inches(1.3), Inches(3.0)
        for c in [c1, c2, c3]:
            set_cell_margins(c, 50, 50, 80, 80)
            set_cell_borders(c, "E2E8F0", "E2E8F0")
            if r_idx % 2 == 1:
                set_cell_background(c, "F8FAFC")
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(route)
        r1.font.size = Pt(8.5)
        r1.font.name = "Consolas"
        r1.font.color.rgb = RGBColor(156, 91, 60)
        
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(mod)
        r2.font.size = Pt(8.5)
        r2.bold = True
        
        p3 = c3.paragraphs[0]
        r3 = p3.add_run(desc)
        r3.font.size = Pt(8.5)

    doc.add_page_break()

    # ── 6. DEPLOYMENT & CONFIGURATION GUIDE ─────────────────────────────────
    h6 = doc.add_heading("6. Deployment, Configuration & Maintenance Guide", level=1)
    h6.style.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Follow these standard enterprise deployment steps to run SewNexa in on-premise or cloud environments:"
    )

    doc.add_heading("Database Setup (PostgreSQL)", level=2)
    doc.add_paragraph(
        "1. Create database: CREATE DATABASE line_balancing;\n"
        "2. Spring Boot will automatically run all Flyway migrations (V1 through V38) on application startup."
    )

    doc.add_heading("Backend API Service (Spring Boot 3)", level=2)
    doc.add_paragraph(
        "• Working Directory: /backend\n"
        "• Command to run: mvn spring-boot:run\n"
        "• Port: http://localhost:8080"
    )

    doc.add_heading("Frontend Client Service (React + Vite)", level=2)
    doc.add_paragraph(
        "• Working Directory: /frontend\n"
        "• Install dependencies: npm install\n"
        "• Development Server: npm run dev (running on http://localhost:5173)\n"
        "• Production Build: npm run build"
    )

    add_callout(
        doc,
        "Ensure PostgreSQL service is running and credentials in backend/src/main/resources/application.properties match your local or cloud database instance.",
        title="OPERATIONAL PREREQUISITE",
        border_hex="77876F"
    )

    output_path = os.path.join(os.getcwd(), "SewNexa_Techno_Functional_Manual.docx")
    doc.save(output_path)
    print(f"Successfully generated manual at: {output_path}")

if __name__ == "__main__":
    build_manual()
