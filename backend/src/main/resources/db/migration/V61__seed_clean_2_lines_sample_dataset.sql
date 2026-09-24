-- V61: Seed Clean, Realistic 2-Line Garment Manufacturing Sample Dataset
-- Provides 2 Sewing Lines, 2 Real Garment Styles, 2 Bulletins with Standard Operations,
-- 2 Production Orders, 2 Capacity Plans, 2 Line Designs, Balanced Workstations, and Allocations.

-- 0. CLEAN SLATE FOR IDEMPOTENCY
DELETE FROM operator_allocation_audits;
DELETE FROM operator_allocation_scenarios;
DELETE FROM operator_allocation_bottlenecks;
DELETE FROM operator_allocation_assignments;

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operator_allocation_line_results') THEN 
        DELETE FROM operator_allocation_line_results; 
    END IF; 
END $$;

DELETE FROM operator_allocation_runs;

DELETE FROM optimization_recommendations;
DELETE FROM operator_station_placements;
DELETE FROM balance_station_operations;
DELETE FROM balance_workstations;
DELETE FROM line_design_machines;
DELETE FROM line_designs;

DELETE FROM capacity_plans;
DELETE FROM hourly_production_entries;
DELETE FROM line_plan_assignments;
DELETE FROM line_plans;
DELETE FROM piece_production_logs;

DELETE FROM order_size_lines;
DELETE FROM orders;

DELETE FROM bulletin_styles;
DELETE FROM bulletin_lines;
DELETE FROM operation_bulletins;

DELETE FROM styles;
DELETE FROM sewing_lines;

-- 1. SEED 2 REAL-WORLD GARMENT STYLES
INSERT INTO styles (id, style_no, buyer, description, season, product_type, active) VALUES
    (1, 'STY-CREW-101', 'Nike Activewear', 'Classic Crewneck T-Shirt', 'Summer 2026', 'Crewneck T-Shirt', TRUE),
    (2, 'STY-POLO-201', 'Tommy Hilfiger', 'Classic Pique Polo Shirt with Ribbed Collar', 'Spring/Summer 2026', 'Polo Shirt', TRUE);

SELECT setval('styles_id_seq', (SELECT MAX(id) FROM styles));

-- 2. SEED 2 OPERATION BULLETINS
INSERT INTO operation_bulletins (id, bulletin_code, name, description, version, revision_number, status, total_smv, approved_by, approved_at, released_by, released_at) VALUES
    (1, 'OB-CREW-101', 'Crewneck T-Shirt Standard Assembly', '8-operation balanced assembly sequence for Classic Crewneck T-Shirt', 1, 1, 'PUBLISHED', 3.60, 'Priya Sharma (Senior IE Lead)', NOW(), 'Amit Verma (Head IE)', NOW()),
    (2, 'OB-POLO-201', 'Polo Shirt Standard Assembly', '10-operation assembly sequence for Pique Polo Shirt', 1, 1, 'PUBLISHED', 4.80, 'Priya Sharma (Senior IE Lead)', NOW(), 'Amit Verma (Head IE)', NOW());

SELECT setval('operation_bulletins_id_seq', (SELECT MAX(id) FROM operation_bulletins));

-- Link Bulletins to Styles
INSERT INTO bulletin_styles (bulletin_id, style_id) VALUES
    (1, 1),
    (2, 2);

-- 3. SEED BULLETIN LINES FOR THE 2 BULLETINS
-- Bulletin 1: Crewneck (8 Operations, Total SMV = 3.60 min)
INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, section, is_parallelizable, notes)
SELECT 1, seq, op.id, s_smv, m_type, req_skill, sec, true, note
FROM (VALUES
    (1, 'OP-001', 0.35, '4-Thread Overlock', 3, 'BODY_ASSEMBLY', 'Shoulder join with clear mobilon tape'),
    (2, 'OP-002', 0.50, '4-Thread Overlock', 3, 'COLLAR_SET', 'Neck rib knit attach in circular loop'),
    (3, 'OP-003', 0.35, 'Single Needle Lockstitch', 3, 'COLLAR_SET', 'Neckline top stitch and label sandwich'),
    (4, 'OP-004', 0.45, '4-Thread Overlock', 3, 'SLEEVE_SET', 'Attach left sleeve to body armhole'),
    (5, 'OP-005', 0.45, '4-Thread Overlock', 3, 'SLEEVE_SET', 'Attach right sleeve to body armhole'),
    (6, 'OP-006', 0.50, '4-Thread Overlock', 4, 'BODY_ASSEMBLY', 'Close side seams in one continuous pass'),
    (7, 'OP-008', 0.45, 'Flatlock / Interlock', 3, 'CUFF_HEM', 'Sleeve cuff fold and coverstitch hem'),
    (8, 'OP-007', 0.55, 'Flatlock / Interlock', 3, 'BODY_HEM', 'Bottom hem fold and coverstitch finish')
) AS t(seq, op_code, s_smv, m_type, req_skill, sec, note)
JOIN operations op ON op.operation_code = t.op_code;

-- Bulletin 2: Polo Shirt (10 Operations, Total SMV = 4.80 min)
INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, section, is_parallelizable, notes)
SELECT 2, seq, op.id, s_smv, m_type, req_skill, sec, true, note
FROM (VALUES
    (1, 'OP-001', 0.40, '4-Thread Overlock', 3, 'BODY_ASSEMBLY', 'Shoulder seam join with reinforcement tape'),
    (2, 'OP-009', 0.65, 'Single Needle Lockstitch', 4, 'FRONT_PREP', 'Form and attach polo front placket with box stitch'),
    (3, 'OP-010', 0.60, 'Single Needle Lockstitch', 4, 'COLLAR_SET', 'Attach ribbed knit collar to neck placket'),
    (4, 'OP-011', 0.35, 'Single Needle Lockstitch', 3, 'COLLAR_SET', 'Collar band top stitch edge finish'),
    (5, 'OP-004', 0.45, '4-Thread Overlock', 3, 'SLEEVE_SET', 'Attach left sleeve to armhole curvature'),
    (6, 'OP-005', 0.45, '4-Thread Overlock', 3, 'SLEEVE_SET', 'Attach right sleeve to armhole curvature'),
    (7, 'OP-008', 0.45, 'Flatlock / Interlock', 3, 'CUFF_HEM', 'Sleeve cuff hem with 2-needle interlock'),
    (8, 'OP-006', 0.55, '4-Thread Overlock', 4, 'BODY_ASSEMBLY', 'Close side seams from sleeve to bottom slit'),
    (9, 'OP-007', 0.50, 'Flatlock / Interlock', 3, 'BODY_HEM', 'Bottom body fold and coverstitch hem'),
    (10, 'OP-018', 0.40, 'Single Needle Lockstitch', 2, 'FINISHING', 'Buttonhole punch and button tack attach')
) AS t(seq, op_code, s_smv, m_type, req_skill, sec, note)
JOIN operations op ON op.operation_code = t.op_code;

-- 4. SEED EXACTLY 2 SEWING LINES
INSERT INTO sewing_lines (
    id, line_code, line_name, line_type, floor, department,
    supervisor_name, ie_in_charge, qc_inspector,
    workstation_count, operator_count, helper_count, machine_count,
    working_hours, capacity_per_day, target_efficiency_percent,
    operational_status, current_style, current_bulletin, active, notes
) VALUES
(
    1, 'LINE-01', 'Line 01 - T-Shirt Assembly', 'PBS', 'Floor 1 - Bay A', 'Knit Tops Department',
    'Rajesh Patel', 'Priya Sharma', 'Naresh Soni',
    8, 8, 1, 8,
    8.00, 1200, 85.00,
    'ACTIVE', 'STY-CREW-101 - Classic Crewneck T-Shirt', 'OB-CREW-101', TRUE,
    'High-velocity knit tops line with ergonomic workstations.'
),
(
    2, 'LINE-02', 'Line 02 - Polo Shirt Assembly', 'PBS', 'Floor 1 - Bay B', 'Knit Tops Department',
    'Rahim Khan', 'Priya Sharma', 'Sunil Mehta',
    10, 10, 1, 10,
    8.00, 1000, 82.00,
    'ACTIVE', 'STY-POLO-201 - Classic Pique Polo Shirt', 'OB-POLO-201', TRUE,
    'Precision polo line equipped with placket folders and rib collar attach stations.'
);

SELECT setval('sewing_lines_id_seq', (SELECT MAX(id) FROM sewing_lines));

-- 5. SEED 2 REALISTIC PRODUCTION ORDERS
INSERT INTO orders (
    id, order_no, buyer, style_id, color, order_date, delivery_date, planned_completion_date, status, total_quantity, created_at, updated_at
) VALUES
(
    1, 'PO-2026-001', 'Nike Activewear', 1, 'Heather Anthracite', '2026-09-01', '2026-10-30', '2026-10-25', 'IN_PRODUCTION', 10000, NOW(), NOW()
),
(
    2, 'PO-2026-002', 'Tommy Hilfiger', 2, 'Navy Blue', '2026-09-05', '2026-11-15', '2026-11-10', 'IN_PRODUCTION', 8000, NOW(), NOW()
);

SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- Order Size Breakdown
INSERT INTO order_size_lines (order_id, size_id, quantity)
SELECT o.id, s.id, 
    CASE s.code
        WHEN 'XS' THEN (o.total_quantity * 0.10)::INT
        WHEN 'S'  THEN (o.total_quantity * 0.20)::INT
        WHEN 'M'  THEN (o.total_quantity * 0.35)::INT
        WHEN 'L'  THEN (o.total_quantity * 0.20)::INT
        WHEN 'XL' THEN (o.total_quantity * 0.10)::INT
        ELSE           (o.total_quantity * 0.05)::INT
    END
FROM orders o
CROSS JOIN sizes s;

-- 6. SEED 2 CAPACITY PLANS & TAKT ENGINE PROFILES
INSERT INTO capacity_plans (
    id, plan_code, order_id, style_id, bulletin_id, shift_id, order_quantity, available_days,
    target_hourly_output, planned_efficiency, allowance_pfd, total_smv_minutes, customer_takt_secs,
    required_design_capacity, designed_pitch_secs, theoretical_manpower, planned_manpower, status, created_at, updated_at
) VALUES
(
    1, 'CAP-LINE01-CREW', 1, 1, 1, 1, 10000, 10,
    125, 85.0, '5,4,1', 3.60, 28.8, 147.0, 27.0, 7.5, 8.0, 'ACTIVE', NOW(), NOW()
),
(
    2, 'CAP-LINE02-POLO', 2, 2, 2, 1, 8000, 10,
    100, 82.0, '5,4,1', 4.80, 36.0, 122.0, 28.8, 9.8, 10.0, 'ACTIVE', NOW(), NOW()
);

SELECT setval('capacity_plans_id_seq', (SELECT MAX(id) FROM capacity_plans));

-- 7. SEED 2 LINE DESIGNS & WORKSTATION ARCHITECTURE
INSERT INTO line_designs (
    id, design_code, order_id, bulletin_id, line_id, capacity_plan_id, total_workstations, total_operators, total_helpers, total_qc, total_machines,
    target_hourly_output, planned_efficiency, designed_pitch_secs, line_balance_efficiency, status, version, created_by, approved_by, released_by
) VALUES
(
    1, 'DES-LINE01-CREW', 1, 1, 1, 1, 8, 8, 1, 1, 8,
    125, 85.0, 27.0, 88.5, 'RELEASED', 1, 'Priya Sharma', 'Amit Verma', 'Rajesh Patel'
),
(
    2, 'DES-LINE02-POLO', 2, 2, 2, 2, 10, 10, 1, 1, 10,
    100, 82.0, 28.8, 86.0, 'RELEASED', 1, 'Priya Sharma', 'Amit Verma', 'Rajesh Patel'
);

SELECT setval('line_designs_id_seq', (SELECT MAX(id) FROM line_designs));

-- Workstations for Line 01 (8 Workstations S01 to S08)
INSERT INTO balance_workstations (line_design_id, station_index, station_code, primary_machine_type, allocated_operators, effective_time_secs, capacity_per_hour, workload_percent, is_bottleneck) VALUES
    (1, 1, 'S01', '4-Thread Overlock', 1, 21.0, 171.4, 77.8, FALSE),
    (1, 2, 'S02', '4-Thread Overlock', 1, 30.0, 120.0, 111.1, FALSE),
    (1, 3, 'S03', 'Single Needle Lockstitch', 1, 21.0, 171.4, 77.8, FALSE),
    (1, 4, 'S04', '4-Thread Overlock', 1, 27.0, 133.3, 100.0, FALSE),
    (1, 5, 'S05', '4-Thread Overlock', 1, 27.0, 133.3, 100.0, FALSE),
    (1, 6, 'S06', '4-Thread Overlock', 1, 30.0, 120.0, 111.1, FALSE),
    (1, 7, 'S07', 'Flatlock / Interlock', 1, 27.0, 133.3, 100.0, FALSE),
    (1, 8, 'S08', 'Flatlock / Interlock', 1, 33.0, 109.1, 122.2, TRUE);

-- Workstations for Line 02 (10 Workstations S01 to S10)
INSERT INTO balance_workstations (line_design_id, station_index, station_code, primary_machine_type, allocated_operators, effective_time_secs, capacity_per_hour, workload_percent, is_bottleneck) VALUES
    (2, 1, 'S01', '4-Thread Overlock', 1, 24.0, 150.0, 83.3, FALSE),
    (2, 2, 'S02', 'Single Needle Lockstitch', 1, 39.0, 92.3, 135.4, TRUE),
    (2, 3, 'S03', 'Single Needle Lockstitch', 1, 36.0, 100.0, 125.0, FALSE),
    (2, 4, 'S04', 'Single Needle Lockstitch', 1, 21.0, 171.4, 72.9, FALSE),
    (2, 5, 'S05', '4-Thread Overlock', 1, 27.0, 133.3, 93.8, FALSE),
    (2, 6, 'S06', '4-Thread Overlock', 1, 27.0, 133.3, 93.8, FALSE),
    (2, 7, 'S07', 'Flatlock / Interlock', 1, 27.0, 133.3, 93.8, FALSE),
    (2, 8, 'S08', '4-Thread Overlock', 1, 33.0, 109.1, 114.6, FALSE),
    (2, 9, 'S09', 'Flatlock / Interlock', 1, 30.0, 120.0, 104.2, FALSE),
    (2, 10, 'S10', 'Single Needle Lockstitch', 1, 24.0, 150.0, 83.3, FALSE);

-- Link Workstation Operations
INSERT INTO balance_station_operations (balance_workstation_id, bulletin_line_id, operation_id, sequence, operation_smv, is_split, machine_type)
SELECT bw.id, bl.id, bl.operation_id, bw.station_index, bl.smv, FALSE, bl.machine_type
FROM balance_workstations bw
JOIN line_designs ld ON ld.id = bw.line_design_id
JOIN bulletin_lines bl ON bl.bulletin_id = ld.bulletin_id AND bl.sequence = bw.station_index;

-- 8. SEED OPERATOR STATION PLACEMENTS
-- Line 01 (Operators EMP-001 to EMP-008)
INSERT INTO operator_station_placements (line_design_id, balance_workstation_id, operator_id, required_skill_level, actual_skill_level, match_status, notes)
SELECT 1, bw.id, op.id, 3, 4, 'MATCH', 'Assigned operator'
FROM balance_workstations bw
JOIN operators op ON op.employee_id = 'EMP-' || LPAD(bw.station_index::text, 3, '0')
WHERE bw.line_design_id = 1;

-- Line 02 (Operators EMP-009 to EMP-018)
INSERT INTO operator_station_placements (line_design_id, balance_workstation_id, operator_id, required_skill_level, actual_skill_level, match_status, notes)
SELECT 2, bw.id, op.id, 3, 4, 'MATCH', 'Assigned operator'
FROM balance_workstations bw
JOIN operators op ON op.employee_id = 'EMP-' || LPAD((bw.station_index + 8)::text, 3, '0')
WHERE bw.line_design_id = 2;

-- 9. SEED ACTIVE LINE PLANS FOR PRODUCTION FLOOR EXECUTION
INSERT INTO line_plans (
    id, line_id, order_id, shift_id, target_output, allowance, status, created_at, updated_at
) VALUES
(
    1, 1, 1, 1, 1000, 10, 'RELEASED', NOW(), NOW()
),
(
    2, 2, 2, 1, 800, 10, 'RELEASED', NOW(), NOW()
);

SELECT setval('line_plans_id_seq', (SELECT MAX(id) FROM line_plans));

-- Seed Line Plan Assignments
INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
SELECT 
    CASE WHEN bl.bulletin_id = 1 THEN 1 ELSE 2 END,
    bl.id,
    bl.operation_id,
    op.id
FROM bulletin_lines bl
JOIN operators op ON op.employee_id = 'EMP-' || LPAD((CASE WHEN bl.bulletin_id = 1 THEN bl.sequence ELSE bl.sequence + 8 END)::text, 3, '0');

-- 10. SEED MULTI-LINE OPTIMIZER RUN (2 LINES OPTIMAL BALANCE)
INSERT INTO operator_allocation_runs (
    id, run_code, planning_date, shift_id, plant_location, selected_line_ids, solver_status,
    total_selected_lines, total_available_operators, total_assigned_operators, total_unassigned_operators,
    total_designed_output, total_achievable_output, overall_designed_efficiency, overall_achievable_efficiency,
    target_achievement_percent, total_skill_gaps, total_machine_gaps, total_bottleneck_stations, solver_runtime_ms,
    status, approved_by, approved_at, applied_by, applied_at, created_by, notes
) VALUES (
    1, 'RUN-20260923-01', CURRENT_DATE, 1, 'Unit 1 - Main Apparel Complex', '1,2', 'OPTIMAL',
    2, 50, 18, 32,
    2200, 2150, 83.5, 82.8,
    97.7, 0, 0, 2, 142,
    'APPLIED', 'Priya Sharma (Senior IE Lead)', NOW(), 'Rajesh Patel (Line Supervisor)', NOW(), 'Industrial Engineer',
    'Optimal 2-line allocation for T-Shirt Assembly (Line 01) and Polo Assembly (Line 02).'
);

-- Seed Operator Allocation Assignments for the 2 Lines (18 Stations)
INSERT INTO operator_allocation_assignments (
    allocation_run_id, line_id, line_design_id, station_index, station_code,
    operation_id, operation_name, bulletin_line_id, required_machine_type, required_skill_level,
    operator_id, operator_name, operator_code, assigned_skill_level, performance_source,
    standard_smv, effective_cycle_time_secs, operator_efficiency_percent, match_status, is_bottleneck, is_fixed, notes
)
SELECT 
    1,
    ld.line_id,
    ld.id,
    bw.station_index,
    bw.station_code,
    bl.operation_id,
    oper.name,
    bl.id,
    bl.machine_type,
    bl.skill_rating_required,
    p.id,
    p.name,
    p.employee_id,
    COALESCE(sa.rating, 3),
    'CALIBRATED',
    bl.smv,
    bw.effective_time_secs,
    CASE WHEN bw.is_bottleneck THEN 78.5 ELSE 86.0 END,
    'MATCH',
    bw.is_bottleneck,
    FALSE,
    'Optimal multi-skill assignment'
FROM balance_workstations bw
JOIN line_designs ld ON ld.id = bw.line_design_id
JOIN bulletin_lines bl ON bl.bulletin_id = ld.bulletin_id AND bl.sequence = bw.station_index
JOIN operations oper ON oper.id = bl.operation_id
JOIN operators p ON p.employee_id = 'EMP-' || LPAD((CASE WHEN ld.id = 1 THEN bw.station_index ELSE bw.station_index + 8 END)::text, 3, '0')
LEFT JOIN skill_assessments sa ON sa.operator_id = p.id AND sa.operation_id = bl.operation_id AND sa.is_current = TRUE;
