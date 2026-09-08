import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

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

def set_cell_borders(cell, top="CCCCCC", bottom="CCCCCC"):
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

def add_step_box(doc, step_num, title, instructions, tip=None):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="1E3A8A"/>'
        f'<w:top w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    
    r_step = p.add_run(f"STEP {step_num}: {title}\n")
    r_step.bold = True
    r_step.font.name = "Arial"
    r_step.font.size = Pt(11)
    r_step.font.color.rgb = RGBColor(30, 58, 138)
    
    r_inst = p.add_run(instructions)
    r_inst.font.name = "Arial"
    r_inst.font.size = Pt(9.5)
    r_inst.font.color.rgb = RGBColor(51, 65, 85)
    
    if tip:
        p2 = cell.add_paragraph()
        p2.paragraph_format.space_before = Pt(4)
        p2.paragraph_format.space_after = Pt(2)
        r_tip_label = p2.add_run("💡 Pro Tip: ")
        r_tip_label.bold = True
        r_tip_label.font.size = Pt(9)
        r_tip_label.font.color.rgb = RGBColor(156, 91, 60)
        
        r_tip = p2.add_run(tip)
        r_tip.italic = True
        r_tip.font.size = Pt(9)
        r_tip.font.color.rgb = RGBColor(71, 85, 105)
        
    doc.add_paragraph()

def add_flow_diagram(doc, title, stages):
    doc.add_paragraph()
    p_title = doc.add_paragraph()
    r = p_title.add_run(f"📊 Process Flow: {title}")
    r.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(30, 58, 138)
    
    tbl = doc.add_table(rows=len(stages), cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    for idx, (stage_name, stage_desc) in enumerate(stages):
        row = tbl.rows[idx]
        c1, c2 = row.cells[0], row.cells[1]
        c1.width = Inches(1.8)
        c2.width = Inches(4.7)
        
        set_cell_background(c1, "1E3A8A" if idx == 0 else "F1F5F9")
        set_cell_background(c2, "FFFFFF")
        set_cell_margins(c1, 80, 80, 100, 100)
        set_cell_margins(c2, 80, 80, 100, 100)
        set_cell_borders(c1, "E2E8F0", "E2E8F0")
        set_cell_borders(c2, "E2E8F0", "E2E8F0")
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(f"Stage {idx + 1}\n{stage_name}")
        r1.bold = True
        r1.font.size = Pt(9)
        r1.font.color.rgb = RGBColor(255, 255, 255) if idx == 0 else RGBColor(30, 41, 59)
        
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(stage_desc)
        r2.font.size = Pt(9)
        r2.font.color.rgb = RGBColor(51, 65, 85)
        
    doc.add_paragraph()

def build_user_manual():
    doc = docx.Document()
    
    # Page setup
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Arial'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(34, 40, 49)

    # ── COVER HEADER ────────────────────────────────────────────────────────
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(18)
    title_p.paragraph_format.space_after = Pt(4)
    run_brand = title_p.add_run("SewNexa™ Enterprise Platform\n")
    run_brand.font.name = 'Arial Black'
    run_brand.font.size = Pt(22)
    run_brand.font.color.rgb = RGBColor(30, 58, 138)

    run_main_title = title_p.add_run("OPERATIONAL USER MANUAL\n")
    run_main_title.font.name = 'Arial'
    run_main_title.font.size = Pt(18)
    run_main_title.bold = True
    run_main_title.font.color.rgb = RGBColor(156, 91, 60)

    run_sub = title_p.add_run("End-to-End User Operations, Step-by-Step Walkthroughs & Process Flow Architecture")
    run_sub.font.name = 'Arial'
    run_sub.font.size = Pt(11)
    run_sub.italic = True
    run_sub.font.color.rgb = RGBColor(100, 116, 139)

    # Metadata table
    meta_table = doc.add_table(rows=5, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Document Type", "Official Standard Operating Procedure (SOP) & User Manual"),
        ("System Release", "SewNexa Enterprise v2.4.0"),
        ("Target Roles", "Production Line Managers, Floor Supervisors, Industrial Engineers, Merchandisers"),
        ("Author", "Senior Industrial Engineering & Software Architecture Practice"),
        ("Classification", "Standard Factory Operating Reference Guide")
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

    doc.add_page_break()

    # ── TABLE OF CONTENTS ──────────────────────────────────────────────────
    h_toc = doc.add_heading("User Manual Table of Contents", level=1)
    h_toc.style.font.color.rgb = RGBColor(30, 58, 138)

    chapters = [
        ("1. System Overview & Navigation Architecture", "3"),
        ("2. Commercial Order Register & Schedule Tracking", "5"),
        ("3. Garment Style Library & Operation Bulletins (OB)", "8"),
        ("4. Operator Skill Matrix & Daily Shift Attendance", "11"),
        ("5. Planned Lines & Dynamic Balancing Engine", "14"),
        ("    5.1 Delivery Schedule Window Mode (Takt Pacing)", "15"),
        ("    5.2 Fixed Shift Target Mode (Daily Target Pacing)", "17"),
        ("    5.3 Bottleneck Identification & AI Auto-Balancing", "19"),
        ("6. Shopfloor Production Monitoring & Interval Piece Entry", "22"),
        ("    6.1 Hourly & 2-Hour Operator Quantity Logging", "23"),
        ("    6.2 Date-Isolated Log Management", "25"),
        ("    6.3 End-Line Actual Throughput Deduction Loop", "27"),
        ("7. Notification Center & Critical Alert Management", "29"),
        ("8. Frequently Asked Questions (FAQ) & Troubleshooting", "31")
    ]

    for item, page in chapters:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r_item = p.add_run(item)
        r_item.font.size = Pt(10)
        r_item.font.color.rgb = RGBColor(30, 41, 59)
        if not item.startswith("    "):
            r_item.bold = True

    doc.add_page_break()

    # ── CHAPTER 1: NAVIGATION ARCHITECTURE ─────────────────────────────────
    h1 = doc.add_heading("1. System Overview & Navigation Architecture", level=1)
    h1.style.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "SewNexa features a clean, responsive sidebar navigation designed for fast shopfloor access across tablets, laptops, and desktop workstations."
    )

    nav_table = doc.add_table(rows=7, cols=3)
    nav_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    nav_headers = ["Sidebar Navigation Menu", "Core Functionality", "Primary User Role"]
    
    for c_idx, text in enumerate(nav_headers):
        cell = nav_table.rows[0].cells[c_idx]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    nav_data = [
        ("Orders & Breakdown", "Manage purchase orders, size matrices, delivery dates, and plan to complete targets.", "Merchandiser / Production Planner"),
        ("Styles & Bulletins", "Configure garment style specs, sewing operations, SMVs, and machine types.", "Industrial Engineer (IE)"),
        ("Skill Matrix", "Evaluate operator skill ratings (1-5), log audit history, and manage attachments.", "Floor Supervisor / HR"),
        ("Planned Lines & Balancing", "Balance sewing lines, calculate dynamic Takt Time, allocate operators, and eliminate bottlenecks.", "Industrial Engineer / Floor Manager"),
        ("Production Monitoring", "Enter operator hourly pieces, track 2-hour intervals, and finalize daily end-line output.", "Line Supervisor / Data Entry Operator"),
        ("Notifications Bell", "Receive real-time alerts on line bottlenecks and operator late check-ins with 1-click action routing.", "Factory Manager / Plant Head")
    ]

    for r_idx, (m, f, u) in enumerate(nav_data):
        row = nav_table.rows[r_idx + 1]
        c1, c2, c3 = row.cells[0], row.cells[1], row.cells[2]
        c1.width, c2.width, c3.width = Inches(2.0), Inches(2.8), Inches(1.7)
        for c in [c1, c2, c3]:
            set_cell_margins(c, 60, 60, 80, 80)
            set_cell_borders(c, "E2E8F0", "E2E8F0")
            if r_idx % 2 == 1:
                set_cell_background(c, "F8FAFC")
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(m)
        r1.bold = True
        r1.font.size = Pt(9)
        
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(f)
        r2.font.size = Pt(8.5)
        
        p3 = c3.paragraphs[0]
        r3 = p3.add_run(u)
        r3.font.size = Pt(8.5)
        r3.font.color.rgb = RGBColor(156, 91, 60)

    doc.add_paragraph()

    # ── CHAPTER 2: COMMERCIAL ORDERS ───────────────────────────────────────
    h2 = doc.add_heading("2. Commercial Order Register & Schedule Tracking", level=1)
    h2.style.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "The Order Register is the commercial entry point for manufacturing. It records garment purchase orders and establishes production timelines."
    )

    add_flow_diagram(
        doc,
        "Order Booking & Delivery Timeline Scheduling",
        [
            ("Order Ingestion", "Enter PO Number, Buyer, Style, and Garment Color."),
            ("Timeline Setup", "Specify Order Release Date, internal 'Plan to Complete Date', and contractual 'Delivery Date'."),
            ("Size Breakdown Matrix", "Distribute total units across XS, S, M, L, XL, XXL sizes with automated sum checking."),
            ("Balancing Readiness", "Order status is marked 'PLANNED' and becomes available in the Line Balancing engine.")
        ]
    )

    add_step_box(
        doc,
        1,
        "Creating a New Production Order",
        "1. Click the '+ Create New Order' button in the top right of the Orders page.\n"
        "2. Select the Garment Style from the dropdown (e.g., 'ST-TSHIRT-01').\n"
        "3. Enter the PO Number (e.g., 'PO-TSHIRT-480') and Buyer Name (e.g., 'Zara').\n"
        "4. Choose Order Date, Plan to Complete Date (e.g., 20 Sept 2026), and Contractual Delivery Date (e.g., 25 Sept 2026).\n"
        "5. Enter quantities in the size breakdown matrix. The system automatically computes Total Quantity.\n"
        "6. Click 'Create Order' to commit to the database.",
        tip="Setting the 'Plan to Complete Date' 3 to 5 days before the buyer's delivery date creates a safety buffer that shields your factory against shipment penalties."
    )

    add_step_box(
        doc,
        2,
        "Reading Order Timeline & Plan to Complete Badges",
        "• Plan to Complete Column: Displays the internal target date with calendar icon and live countdown badge (e.g. '18d target left').\n"
        "• Green Buffer Badge: If the planned completion date is comfortably ahead of shipment, a green chip confirms safety margin.\n"
        "• Overdue Warnings: Crimson chips alert planners if an order has exceeded its target date.\n"
        "• Status Quick-Selector: Change status directly from the table (PLANNED 🔵, IN_PRODUCTION ⚡, COMPLETED ✅, ON_HOLD ⏸️).",
        tip="Use the Excel export button at the top right to download the complete production schedule for weekly merchant meetings."
    )

    doc.add_page_break()

    # ── CHAPTER 3: STYLES & BULLETINS ──────────────────────────────────────
    h3 = doc.add_heading("3. Garment Style Library & Operation Bulletins (OB)", level=1)
    h3.style.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Operation Bulletins (OB) define the exact industrial engineering sequence required to sew a garment."
    )

    add_step_box(
        doc,
        1,
        "Setting Up Style Operation Sequences",
        "1. Navigate to 'Styles & Bulletins' in the sidebar.\n"
        "2. Click '+ Add Operation' to add sewing stages in sequential order (e.g., #1 Front Placket, #2 Shoulder Join, #3 Sleeve Attach, #4 Side Seam, #5 Bottom Hem).\n"
        "3. Assign Machine Class (SNLS Single Needle, OVERLOCK 4-Thread, FLATLOCK, KANSAI Elasticator).\n"
        "4. Input Standard Minute Value (SMV) in minutes (e.g., 0.65 min = 39 seconds).\n"
        "5. Save bulletin. The system automatically computes Total Garment SMV and Theoretical Pitch.",
        tip="Accurate SMV calculation (observed cycle time + 10% allowance) is essential for correct Takt Time pacing in subsequent line balancing."
    )

    # ── CHAPTER 4: SKILL MATRIX & ATTENDANCE ───────────────────────────────
    h4 = doc.add_heading("4. Operator Skill Matrix & Daily Shift Attendance", level=1)
    h4.style.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "The Skill Matrix tracks operator proficiency across machinery and operations, while Shift Attendance ensures only present operators are assigned to lines."
    )

    add_step_box(
        doc,
        1,
        "Updating Operator Proficiency Ratings",
        "1. Open 'Skill Matrix' from the sidebar.\n"
        "2. Use search or department filters to find the operator.\n"
        "3. Click on the rating cell (Grades 1 to 5: 1=Learner, 2=Assistant, 3=Skilled, 4=Senior, 5=Master Artisan).\n"
        "4. Select the new grade. The change is instantly saved to PostgreSQL and logged in the Skill Audit History.\n"
        "5. Click 'View History' to review the historical timeline of rating adjustments.",
        tip="Maintain multi-skilled Grade 4 and 5 operators across critical operations so they can act as 'Float Operators' when absenteeism occurs."
    )

    doc.add_page_break()

    # ── CHAPTER 5: PLANNED LINES & BALANCING ────────────────────────────────
    h5 = doc.add_heading("5. Planned Lines & Dynamic Balancing Engine", level=1)
    h5.style.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "The Planned Lines & Balancing module is the core engineering workspace. It coordinates line setups, pacing strategies, workstation operator pairing, and bottleneck mitigation."
    )

    add_flow_diagram(
        doc,
        "Line Balancing Operational Flow",
        [
            ("Line & Order Selection", "Select Active Order (PO-480), Sewing Line (Line 01), and Shift (Shift A)."),
            ("Pacing Strategy Mode", "Choose 'Delivery Schedule Window' (Plan to Complete pacing) or 'Fixed Shift Target' (Day-wise pacing)."),
            ("Operator Allocation", "Assign present operators to workstations based on machine type and skill rating."),
            ("Bottleneck Detection", "Workstations exceeding Takt Time turn Crimson. Review pitch diagram."),
            ("AI Auto-Balance / Float", "Click 'Auto-Balance Line' to optimize workload distribution and assign float helpers.")
        ]
    )

    add_step_box(
        doc,
        1,
        "Configuring Line Pacing Modes",
        "• Tab 1: Delivery Schedule Window (Overall Delivery Horizon):\n"
        "  - Calculates working days between today and the Planned Complete Date (excluding Sundays).\n"
        "  - Dynamically calculates live Takt Time: Net Available Time ÷ Remaining Order Quantity.\n"
        "• Tab 2: Fixed Shift Target (Day-Wise Shift Target):\n"
        "  - Sets day-wise shift output targets (e.g. 500 pcs/shift).\n"
        "  - Displays Today's Completed End-Line Output and tracks progress against shift quota in real time.",
        tip="Use Fixed Shift Target during daily morning briefings to set operator hourly quotas, and Delivery Window for master factory scheduling."
    )

    add_step_box(
        doc,
        2,
        "Resolving Bottleneck Workstations",
        "1. Identify workstations highlighted in Crimson with 'Bottleneck: Exceeds Takt Time'.\n"
        "2. Check the Effective Cycle Time vs Takt Time (e.g., Station #4: 72.0s vs Takt: 55.3s).\n"
        "3. Option A: Click '+ Add Operator' on the station card to assign a second operator, halving the cycle time (36.0s).\n"
        "4. Option B: Swap in a higher-rated Grade 4 or 5 operator.\n"
        "5. Option C: Click 'Auto-Balance Line' for automated AI workload smoothing.",
        tip="Eliminating the highest bottleneck station produces the greatest immediate increase in overall line balance efficiency (LBE%)."
    )

    doc.add_page_break()

    # ── CHAPTER 6: PRODUCTION MONITORING ───────────────────────────────────
    h6 = doc.add_heading("6. Shopfloor Production Monitoring & Output Deductions", level=1)
    h6.style.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "Floor line managers log operator completed pieces at 1-hour or 2-hour intervals throughout each production shift."
    )

    add_flow_diagram(
        doc,
        "Closed-Loop Production Logging & Deductions",
        [
            ("Interval Piece Entry", "Line supervisor enters pieces completed by each operator every 1 or 2 hours."),
            ("Date-Isolated Storage", "Logs are saved to PostgreSQL under the selected calendar date (e.g. 01-09-2026)."),
            ("Finalizing Actual Output", "Supervisor clicks 'Finalize Day Output' to verify and lock shift totals."),
            ("Dynamic Takt Recalibration", "End-line output automatically deducts from Planned Lines total quantity, recalibrating Takt Time.")
        ]
    )

    add_step_box(
        doc,
        1,
        "Entering Operator Interval Quantities",
        "1. Navigate to 'Production Monitoring' from the sidebar.\n"
        "2. Select Date (e.g., 01-09-2026), Line (Line 01), and Shift (Shift A).\n"
        "3. In the Timesheet Matrix, enter completed pieces for each operator in their respective time slot (e.g., 08:00–09:00: 8 pcs, 09:00–10:00: 9 pcs).\n"
        "4. Values are validated against hourly theoretical station capacity.\n"
        "5. The system computes total output and individual operator efficiency % in real time.",
        tip="Entering data every 2 hours allows supervisors to catch lagging stations before the shift ends."
    )

    add_step_box(
        doc,
        2,
        "Understanding Closed-Loop Quantity Deduction",
        "• When operators complete pieces on Day 1 (e.g. 60 pcs on 01-09-2026), this output is deducted from the original order quantity (e.g. 1,000 - 60 = 940 pcs remaining).\n"
        "• On Day 2 (e.g. 65 pcs on 02-09-2026), cumulative output (125 pcs) is subtracted (875 pcs remaining).\n"
        "• In Planned Lines, Takt Time automatically recalculates based on remaining pieces and remaining days.",
        tip="Data for each date is strictly isolated. Viewing 02-09-2026 shows fresh blank slots for the new day while preserving historical logs for 01-09-2026."
    )

    doc.add_page_break()

    # ── CHAPTER 7: NOTIFICATIONS ───────────────────────────────────────────
    h7 = doc.add_heading("7. Notification Center & Critical Alert Management", level=1)
    h7.style.font.color.rgb = RGBColor(30, 58, 138)

    doc.add_paragraph(
        "The Notification Bell in the top header keeps plant managers instantly informed without alert flooding."
    )

    add_step_box(
        doc,
        1,
        "Acting on Manager Bottleneck Notifications",
        "1. When a line station exceeds Takt Time, the Bell icon shows a pulsing badge (e.g., '1 unread').\n"
        "2. Click the Bell icon to open the Notification Panel.\n"
        "3. Review the simplified alert: 'Bottleneck Alert · Line 01 | PO-TSHIRT-480 · 1 station(s) exceed Takt (55.3s): #4 Bottom Hem (72.0s)'.\n"
        "4. Click anywhere on the notification card.\n"
        "5. The application instantly navigates directly to Planned Lines in Fixed Shift Target mode with the relevant order preselected for immediate rebalancing.",
        tip="The system employs single-instance deduplication: existing alerts are updated in-place rather than creating duplicate rows."
    )

    # ── CHAPTER 8: FAQ & TROUBLESHOOTING ───────────────────────────────────
    h8 = doc.add_heading("8. Frequently Asked Questions (FAQ) & Troubleshooting", level=1)
    h8.style.font.color.rgb = RGBColor(30, 58, 138)

    faq_items = [
        ("Q: Why is my Takt Time showing 0.0s in Planned Lines?", "A: Ensure that an Active Order is selected and that the Plan to Complete Date is set to today or a future date."),
        ("Q: Does entering production on 02-09-2026 overwrite my 01-09-2026 records?", "A: No. SewNexa strictly partitions piece logs by calendar date in PostgreSQL. Each day maintains its own isolated timesheet."),
        ("Q: How does the system calculate working days?", "A: The factory calendar operates on a standard 6-day work week (Monday to Saturday), automatically excluding non-working Sundays."),
        ("Q: What should I do if a workstation requires a specialized machine not on the line?", "A: Check the machine requirements on the Operation Bulletin and use the Line Setup page to allocate the appropriate machine to that station.")
    ]

    for q, a in faq_items:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(2)
        r_q = p.add_run(q + "\n")
        r_q.bold = True
        r_q.font.size = Pt(9.5)
        r_q.font.color.rgb = RGBColor(30, 58, 138)
        
        r_a = p.add_run(a)
        r_a.font.size = Pt(9.5)
        r_a.font.color.rgb = RGBColor(51, 65, 85)

    output_path = os.path.join(os.getcwd(), "SewNexa_User_Manual.docx")
    doc.save(output_path)
    print(f"Successfully generated User Manual at: {output_path}")

if __name__ == "__main__":
    build_user_manual()
