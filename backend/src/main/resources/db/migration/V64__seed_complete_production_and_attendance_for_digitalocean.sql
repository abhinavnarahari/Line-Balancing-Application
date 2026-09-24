-- V64: Complete Production Logs, Attendance, and Master Alignment for Cloud & DigitalOcean Deployment
-- Ensures 100% complete, reproducible sample data on any fresh or existing deployment:
-- 1. Synchronizes 2 Real Production Orders (PO-2026-001: 20,000 pcs, PO-2026-002: 9,200 pcs) with dynamic delivery dates.
-- 2. Seeds Active Line Plans (Target 840 pcs & 800 pcs) with all operator assignments.
-- 3. Seeds Daily Piece Production Logs for Line 01 (145 pcs finished goods, 113.9% floor efficiency) for CURRENT_DATE.
-- 4. Seeds Daily Attendance Records for all 50 operators for CURRENT_DATE.
-- 5. Aligns Capacity Plans and Line Designs with active orders and sewing lines.

-- 1. SYNCHRONIZE 2 PRODUCTION ORDERS WITH REAL QUANTITIES & DELIVERY DATES
UPDATE orders
SET total_quantity = 20000,
    order_date = CURRENT_DATE - INTERVAL '23 days',
    delivery_date = CURRENT_DATE + INTERVAL '36 days',
    planned_completion_date = CURRENT_DATE + INTERVAL '30 days',
    status = 'IN_PRODUCTION',
    buyer = 'Nike Activewear',
    color = 'Heather Anthracite',
    updated_at = NOW()
WHERE id = 1 OR order_no = 'PO-2026-001';

UPDATE orders
SET total_quantity = 9200,
    order_date = CURRENT_DATE - INTERVAL '19 days',
    delivery_date = CURRENT_DATE + INTERVAL '32 days',
    planned_completion_date = CURRENT_DATE + INTERVAL '28 days',
    status = 'IN_PRODUCTION',
    buyer = 'Tommy Hilfiger',
    color = 'Navy Blue',
    updated_at = NOW()
WHERE id = 2 OR order_no = 'PO-2026-002';

-- Re-populate Order Size Breakdown
DELETE FROM order_size_lines WHERE order_id IN (1, 2);
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
CROSS JOIN sizes s
WHERE o.id IN (1, 2);

-- 2. SYNCHRONIZE ACTIVE SEWING LINES
UPDATE sewing_lines
SET capacity_per_day = 1200,
    target_efficiency_percent = 85.00,
    operational_status = 'ACTIVE',
    active = TRUE,
    supervisor_name = 'Rajesh Patel',
    current_style = 'STY-CREW-101 - Classic Crewneck T-Shirt',
    current_bulletin = 'OB-CREW-101'
WHERE id = 1 OR line_code = 'LINE-01';

UPDATE sewing_lines
SET capacity_per_day = 1000,
    target_efficiency_percent = 82.00,
    operational_status = 'ACTIVE',
    active = TRUE,
    supervisor_name = 'Rahim Khan',
    current_style = 'STY-POLO-201 - Classic Pique Polo Shirt',
    current_bulletin = 'OB-POLO-201'
WHERE id = 2 OR line_code = 'LINE-02';

-- 3. SYNCHRONIZE ACTIVE LINE PLANS
UPDATE line_plans
SET target_output = 840,
    planned_efficiency = 85.00,
    allowance = 10,
    status = 'active',
    updated_at = NOW()
WHERE id = 1;

UPDATE line_plans
SET target_output = 800,
    planned_efficiency = 82.00,
    allowance = 10,
    status = 'RELEASED',
    updated_at = NOW()
WHERE id = 2;

-- Re-populate Line Plan Assignments for Line 01 (11 assignments) and Line 02 (10 assignments)
DELETE FROM line_plan_assignments WHERE line_plan_id IN (1, 2);

-- Line 01 Assignments (8 stations + 3 support floaters)
INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
SELECT 1, bl.id, bl.operation_id, op.id
FROM bulletin_lines bl
JOIN operators op ON op.employee_id = 'EMP-' || LPAD(bl.sequence::text, 3, '0')
WHERE bl.bulletin_id = 1;

-- Extra 3 support operators assigned to Line 01
INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
SELECT 1, bl.id, bl.operation_id, op.id
FROM bulletin_lines bl
JOIN operators op ON op.employee_id = 'EMP-009'
WHERE bl.bulletin_id = 1 AND bl.sequence = 2;

INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
SELECT 1, bl.id, bl.operation_id, op.id
FROM bulletin_lines bl
JOIN operators op ON op.employee_id = 'EMP-010'
WHERE bl.bulletin_id = 1 AND bl.sequence = 4;

INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
SELECT 1, bl.id, bl.operation_id, op.id
FROM bulletin_lines bl
JOIN operators op ON op.employee_id = 'EMP-011'
WHERE bl.bulletin_id = 1 AND bl.sequence = 6;

-- Line 02 Assignments (10 stations)
INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
SELECT 2, bl.id, bl.operation_id, op.id
FROM bulletin_lines bl
JOIN operators op ON op.employee_id = 'EMP-' || LPAD((bl.sequence + 11)::text, 3, '0')
WHERE bl.bulletin_id = 2;

-- 4. SEED PIECE PRODUCTION LOGS FOR CURRENT_DATE (145 PCS FLOW OUTPUT)
DELETE FROM piece_production_logs WHERE log_date = CURRENT_DATE;

INSERT INTO piece_production_logs (
    operator_id, operation_id, order_id, target_qty, completed_qty, good_qty, reject_qty,
    start_time, end_time, actual_time_minutes, sam_minutes, machine_code, log_date, hour_slot,
    earned_minutes, efficiency_percent, defect_rate_percent, created_at
)
SELECT 
    op.id,
    t.op_id,
    1,
    t.t_qty,
    t.c_qty,
    t.g_qty,
    t.r_qty,
    '10:00:00'::TIME,
    '11:00:00'::TIME,
    60,
    t.sam,
    t.m_type,
    CURRENT_DATE,
    10,
    ROUND((t.g_qty * t.sam)::NUMERIC, 2),
    ROUND(((t.g_qty * t.sam / 60.0) * 100.0)::NUMERIC, 1),
    0.0,
    NOW()
FROM (VALUES
    ('EMP-001', 1, 150, 150, 150, 0, 0.45, '4-Thread Overlock'),
    ('EMP-002', 2, 150, 150, 150, 0, 0.50, '4-Thread Overlock'),
    ('EMP-003', 3, 148, 148, 148, 0, 0.35, 'Single Needle Lockstitch'),
    ('EMP-004', 4, 148, 148, 148, 0, 0.45, '4-Thread Overlock'),
    ('EMP-005', 5, 148, 148, 148, 0, 0.45, '4-Thread Overlock'),
    ('EMP-006', 6, 148, 148, 148, 0, 0.55, '4-Thread Overlock'),
    ('EMP-007', 8, 145, 145, 145, 0, 0.45, 'Flatlock / Interlock'),
    ('EMP-008', 7, 145, 145, 145, 0, 0.50, 'Flatlock / Interlock')
) AS t(emp_code, op_id, t_qty, c_qty, g_qty, r_qty, sam, m_type)
JOIN operators op ON op.employee_id = t.emp_code;

-- 5. SEED ATTENDANCE RECORDS FOR ALL 50 OPERATORS FOR CURRENT_DATE
DELETE FROM attendance_records WHERE attendance_date = CURRENT_DATE;

INSERT INTO attendance_records (
    operator_id, attendance_date, shift_id, status, check_in_time, check_out_time, working_hours, overtime_hours, notes, created_at, updated_at
)
SELECT 
    op.id,
    CURRENT_DATE,
    1,
    'PRESENT',
    '07:55:00'::TIME,
    '16:35:00'::TIME,
    8.00,
    0.00,
    'On-time shopfloor biometric check-in',
    NOW(),
    NOW()
FROM operators op
WHERE op.active = TRUE;

-- 6. SYNCHRONIZE CAPACITY PLANS
UPDATE capacity_plans
SET order_quantity = 20000,
    available_days = 27,
    target_hourly_output = 125,
    planned_efficiency = 85.0,
    total_smv_minutes = 3.60,
    customer_takt_secs = 28.8,
    required_design_capacity = 147.0,
    designed_pitch_secs = 27.0,
    theoretical_manpower = 7.5,
    planned_manpower = 8.0,
    status = 'ACTIVE',
    updated_at = NOW()
WHERE id = 1 OR plan_code = 'CAP-LINE01-CREW';

UPDATE capacity_plans
SET order_quantity = 9200,
    available_days = 25,
    target_hourly_output = 100,
    planned_efficiency = 82.0,
    total_smv_minutes = 4.80,
    customer_takt_secs = 36.0,
    required_design_capacity = 122.0,
    designed_pitch_secs = 28.8,
    theoretical_manpower = 9.8,
    planned_manpower = 10.0,
    status = 'ACTIVE',
    updated_at = NOW()
WHERE id = 2 OR plan_code = 'CAP-LINE02-POLO';
