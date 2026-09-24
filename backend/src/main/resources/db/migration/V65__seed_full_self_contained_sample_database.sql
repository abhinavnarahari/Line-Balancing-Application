-- V65: 100% Self-Contained Enterprise Sample Database Seeder
-- Guarantees complete end-to-end sample data regardless of database state or previous migration history.

-- ==============================================================================
-- 1. SEED 50 OPERATORS (EMP-001 to EMP-050)
-- ==============================================================================
INSERT INTO operators (employee_id, name, age, gender, department, role, joining_date, active)
VALUES
    ('EMP-001', 'Priya Sharma',       26, 'Female', 'Sewing Line 1', 'OPERATOR',        '2021-03-15', TRUE),
    ('EMP-002', 'Rajesh Kumar',       32, 'Male',   'Sewing Line 1', 'OPERATOR',        '2020-07-20', TRUE),
    ('EMP-003', 'Ananya Roy',         24, 'Female', 'Sewing Line 1', 'OPERATOR',        '2022-01-10', TRUE),
    ('EMP-004', 'Deepa Patel',        29, 'Female', 'Sewing Line 1', 'OPERATOR',        '2021-09-15', TRUE),
    ('EMP-005', 'Suresh Nair',        35, 'Male',   'Sewing Line 1', 'OPERATOR',        '2019-05-01', TRUE),
    ('EMP-006', 'Fatima Begum',       23, 'Female', 'Sewing Line 1', 'FLOATER',         '2023-02-18', TRUE),
    ('EMP-007', 'Manoj Verma',        28, 'Male',   'Sewing Line 1', 'OPERATOR',        '2022-06-01', TRUE),
    ('EMP-008', 'Kavita Sundaram',    27, 'Female', 'Sewing Line 2', 'OPERATOR',        '2021-04-20', TRUE),
    ('EMP-009', 'Vikramaditya Rao',   34, 'Male',   'Sewing Line 2', 'LINE_SUPERVISOR', '2018-02-28', TRUE),
    ('EMP-010', 'Meera Krishnan',     25, 'Female', 'Sewing Line 2', 'OPERATOR',        '2022-11-28', TRUE),
    ('EMP-011', 'Arjun Sengupta',     30, 'Male',   'Sewing Line 2', 'OPERATOR',        '2020-11-12', TRUE),
    ('EMP-012', 'Pooja Deshmukh',     23, 'Female', 'Sewing Line 2', 'HELPER',          '2023-04-01', TRUE),
    ('EMP-013', 'Mohanlal Meena',     36, 'Male',   'Sewing Line 2', 'QUALITY_CHECKER', '2019-01-08', TRUE),
    ('EMP-014', 'Sunita Mahajan',     29, 'Female', 'Sewing Line 2', 'FLOATER',         '2021-06-20', TRUE),
    ('EMP-015', 'Rohan Kulkarni',     24, 'Male',   'Sewing Line 2', 'OPERATOR',        '2022-07-15', TRUE),
    ('EMP-016', 'Naresh Soni',        28, 'Male',   'Quality Control','QUALITY_CHECKER', '2022-08-10', TRUE),
    ('EMP-017', 'Umesh Rao',          42, 'Male',   'Sewing Line 3', 'LINE_SUPERVISOR', '2016-04-03', TRUE),
    ('EMP-018', 'Ganesh Reddy',       35, 'Male',   'Sewing Line 3', 'OPERATOR',        '2019-10-18', TRUE),
    ('EMP-019', 'Santosh Nair',       27, 'Male',   'Sewing Line 3', 'OPERATOR',        '2023-01-15', TRUE),
    ('EMP-020', 'Yogesh Pillai',      33, 'Male',   'Packing',       'OPERATOR',        '2020-03-07', TRUE),
    ('EMP-021', 'Pooja Das',          25, 'Female', 'Sewing Line 3', 'OPERATOR',        '2023-04-01', TRUE),
    ('EMP-022', 'Neha Devi',          31, 'Female', 'Finishing',     'OPERATOR',        '2021-06-20', TRUE),
    ('EMP-023', 'Asha Kumari',        28, 'Female', 'Sewing Line 3', 'OPERATOR',        '2022-09-05', TRUE),
    ('EMP-024', 'Usha Bai',           36, 'Female', 'Quality Control','QUALITY_CHECKER', '2019-05-15', TRUE),
    ('EMP-025', 'Manju Khan',         29, 'Female', 'Sewing Line 3', 'OPERATOR',        '2022-02-18', TRUE),
    ('EMP-026', 'Saroj Ansari',       34, 'Female', 'Finishing',     'OPERATOR',        '2020-08-30', TRUE),
    ('EMP-027', 'Kamlesh Sheikh',     30, 'Male',   'Sewing Line 3', 'OPERATOR',        '2021-10-12', TRUE),
    ('EMP-028', 'Vijay Siddiqui',     38, 'Male',   'Packing',       'HELPER',          '2018-03-25', TRUE),
    ('EMP-029', 'Ajay Malik',         26, 'Male',   'Sewing Line 1', 'FLOATER',         '2023-02-28', TRUE),
    ('EMP-030', 'Sanjay Thakur',      32, 'Male',   'Quality Control','QUALITY_CHECKER', '2020-12-01', TRUE),
    ('EMP-031', 'Arun Rathore',       35, 'Male',   'Sewing Line 1', 'OPERATOR',        '2019-07-08', TRUE),
    ('EMP-032', 'Tarun Rajput',       27, 'Male',   'Finishing',     'OPERATOR',        '2022-05-20', TRUE),
    ('EMP-033', 'Varun Bhatt',        33, 'Male',   'Sewing Line 2', 'OPERATOR',        '2020-09-15', TRUE),
    ('EMP-034', 'Kiran Mehta',        29, 'Female', 'Packing',       'OPERATOR',        '2021-07-01', TRUE),
    ('EMP-035', 'Nisha Shah',         31, 'Female', 'Sewing Line 2', 'OPERATOR',        '2021-03-20', TRUE),
    ('EMP-036', 'Ritu Kapoor',        26, 'Female', 'Quality Control','QUALITY_CHECKER', '2023-01-10', TRUE),
    ('EMP-037', 'Seema Malhotra',     38, 'Female', 'Sewing Line 1', 'OPERATOR',        '2018-06-05', TRUE),
    ('EMP-038', 'Reena Bhatia',       33, 'Female', 'Finishing',     'OPERATOR',        '2020-04-14', TRUE),
    ('EMP-039', 'Veena Khanna',       28, 'Female', 'Sewing Line 3', 'OPERATOR',        '2022-11-28', TRUE),
    ('EMP-040', 'Leena Ahuja',        35, 'Female', 'Packing',       'HELPER',          '2019-02-07', TRUE),
    ('EMP-041', 'Mohan Arora',        40, 'Male',   'Sewing Line 1', 'OPERATOR',        '2017-08-20', TRUE),
    ('EMP-042', 'Rohan Sethi',        27, 'Male',   'Finishing',     'OPERATOR',        '2022-07-15', TRUE),
    ('EMP-043', 'Sohan Chopra',       34, 'Male',   'Sewing Line 2', 'OPERATOR',        '2020-01-22', TRUE),
    ('EMP-044', 'Laxman Walia',       30, 'Male',   'Quality Control','QUALITY_CHECKER', '2021-05-30', TRUE),
    ('EMP-045', 'Raman Bansal',       36, 'Male',   'Sewing Line 3', 'OPERATOR',        '2019-09-12', TRUE),
    ('EMP-046', 'Bharat Mittal',      29, 'Male',   'Packing',       'OPERATOR',        '2022-04-08', TRUE),
    ('EMP-047', 'Madan Agarwal',      32, 'Male',   'Sewing Line 1', 'OPERATOR',        '2020-10-25', TRUE),
    ('EMP-048', 'Chandan Goyal',      25, 'Male',   'Finishing',     'OPERATOR',        '2023-03-15', TRUE),
    ('EMP-049', 'Nandan Jain',        44, 'Male',   'Quality Control','LINE_SUPERVISOR', '2016-01-20', TRUE),
    ('EMP-050', 'Pawan Tiwari',       31, 'Male',   'Sewing Line 2', 'OPERATOR',        '2021-08-05', TRUE)
ON CONFLICT (employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    department = EXCLUDED.department,
    role = EXCLUDED.role,
    joining_date = EXCLUDED.joining_date,
    active = TRUE;

-- ==============================================================================
-- 2. SEED 18 OPERATIONS
-- ==============================================================================
INSERT INTO operations (id, operation_code, name, description, standard_smv, machine_type, sequence, active)
VALUES
    (1,  'OP-001', 'Shoulder Join', 'Join front and back body panels at shoulder seams', 0.45, '4-Thread Overlock', 1, TRUE),
    (2,  'OP-002', 'Neck Rib Attach', 'Attach ribbed knit neckband to neckline loop', 0.50, '4-Thread Overlock', 2, TRUE),
    (3,  'OP-003', 'Neck Top Stitch', 'Top stitch around neckline for collar stabilization', 0.35, 'Single Needle Lockstitch', 3, TRUE),
    (4,  'OP-004', 'Sleeve Attach Left', 'Attach left sleeve to armhole curvature', 0.45, '4-Thread Overlock', 4, TRUE),
    (5,  'OP-005', 'Sleeve Attach Right', 'Attach right sleeve to armhole curvature', 0.45, '4-Thread Overlock', 5, TRUE),
    (6,  'OP-006', 'Side Seam Close', 'Close side seams and underarm in continuous pass', 0.55, '4-Thread Overlock', 6, TRUE),
    (7,  'OP-007', 'Bottom Hem', 'Fold and coverstitch bottom body hem', 0.50, 'Flatlock / Interlock', 7, TRUE),
    (8,  'OP-008', 'Sleeve Hem', 'Fold and coverstitch sleeve cuff hems', 0.45, 'Flatlock / Interlock', 8, TRUE),
    (9,  'OP-009', 'Placket Set', 'Form and attach front placket with box stitch', 0.65, 'Single Needle Lockstitch', 9, TRUE),
    (10, 'OP-010', 'Collar Set', 'Attach polo ribbed collar to neckline placket', 0.60, 'Single Needle Lockstitch', 10, TRUE),
    (11, 'OP-011', 'Collar Band Top Stitch', 'Top stitch collar band edge finish', 0.35, 'Single Needle Lockstitch', 11, TRUE),
    (12, 'OP-012', 'Pocket Attach', 'Position and top stitch front chest pocket', 0.55, 'Single Needle Lockstitch', 12, TRUE),
    (13, 'OP-013', 'Cuff Attach', 'Attach tubular rib cuffs to sleeve hems', 0.40, '4-Thread Overlock', 13, TRUE),
    (14, 'OP-014', 'Side Slit Reinforce', 'Reinforce side bottom slits with bartack', 0.30, 'Single Needle Lockstitch', 14, TRUE),
    (15, 'OP-015', 'Main Label Attach', 'Attach brand and care labels inside back neckline', 0.25, 'Single Needle Lockstitch', 15, TRUE),
    (16, 'OP-016', 'Buttonhole Make', 'Punch and stitch keyhole buttonholes on placket', 0.30, 'Buttonhole Machine', 16, TRUE),
    (17, 'OP-017', 'Button Attach', 'Sew 2-hole or 4-hole buttons to matching placket', 0.25, 'Button Attach Machine', 17, TRUE),
    (18, 'OP-018', 'Final Quality Inspection', 'Full garment construction and measurement audit', 0.40, 'Single Needle Lockstitch', 18, TRUE)
ON CONFLICT (id) DO UPDATE SET
    operation_code = EXCLUDED.operation_code,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    standard_smv = EXCLUDED.standard_smv,
    machine_type = EXCLUDED.machine_type,
    sequence = EXCLUDED.sequence,
    active = TRUE;

-- ==============================================================================
-- 3. SEED 14 MACHINES
-- ==============================================================================
INSERT INTO machines (id, machine_code, machine_type, brand, model, status, quantity, active)
VALUES
    (1,  'SN-001',  'Single Needle Lockstitch', 'Juki',    'DDL-8700',  'AVAILABLE', 30, TRUE),
    (2,  'SN-002',  'Single Needle Lockstitch', 'Juki',    'DDL-9000C', 'AVAILABLE', 30, TRUE),
    (3,  'SN-003',  'Single Needle Lockstitch', 'Brother', 'S-7300A',   'AVAILABLE', 30, TRUE),
    (4,  'SN-004',  'Single Needle Lockstitch', 'Jack',    'A4F',       'AVAILABLE', 30, TRUE),
    (5,  'OL-001',  '4-Thread Overlock',        'Pegasus', 'M952-52',   'AVAILABLE', 25, TRUE),
    (6,  'OL-002',  '4-Thread Overlock',        'Siruba',  '747K',      'AVAILABLE', 25, TRUE),
    (7,  'OL-003',  '5-Thread Overlock',        'Juki',    'MO-6816S',  'AVAILABLE', 15, TRUE),
    (8,  'FL-001',  'Flatlock / Interlock',     'Yamato',  'VG2700',    'AVAILABLE', 20, TRUE),
    (9,  'FL-002',  'Flatlock / Interlock',     'Pegasus', 'W562PV',    'AVAILABLE', 20, TRUE),
    (10, 'BH-001',  'Buttonhole Machine',       'Juki',    'LBH-1790A', 'AVAILABLE', 10, TRUE),
    (11, 'BA-001',  'Button Attach Machine',    'Juki',    'MB-1377',   'AVAILABLE', 10, TRUE),
    (12, 'BT-001',  'Bar Tack Machine',         'Brother', 'KE-430FX',  'AVAILABLE', 10, TRUE),
    (13, 'FOA-001', 'Feed-off-the-arm Machine', 'Juki',    'MS-1261',   'AVAILABLE', 8,  TRUE),
    (14, 'DN-001',  'Double Needle Lockstitch', 'Juki',    'LH-3568A',  'AVAILABLE', 10, TRUE)
ON CONFLICT (id) DO UPDATE SET
    machine_code = EXCLUDED.machine_code,
    machine_type = EXCLUDED.machine_type,
    brand = EXCLUDED.brand,
    model = EXCLUDED.model,
    status = EXCLUDED.status,
    quantity = EXCLUDED.quantity,
    active = TRUE;

-- ==============================================================================
-- 4. SEED GARMENT SIZES
-- ==============================================================================
INSERT INTO sizes (id, code, name, chest_cm, waist_cm, hip_cm, sequence, active)
VALUES
    (1, 'XS',  'Extra Small', 86,  71, 88,  1, TRUE),
    (2, 'S',   'Small',       92,  77, 94,  2, TRUE),
    (3, 'M',   'Medium',      98,  83, 100, 3, TRUE),
    (4, 'L',   'Large',       104, 89, 106, 4, TRUE),
    (5, 'XL',  'Extra Large', 110, 95, 112, 5, TRUE),
    (6, 'XXL', '2X Large',    116, 101,118, 6, TRUE)
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    sequence = EXCLUDED.sequence,
    active = TRUE;

-- ==============================================================================
-- 5. SEED GARMENT STYLES
-- ==============================================================================
INSERT INTO styles (id, style_no, buyer, description, season, product_type, active)
VALUES
    (1, 'STY-CREW-101', 'Nike Activewear', 'Classic Crewneck T-Shirt', 'Summer 2026', 'Crewneck T-Shirt', TRUE),
    (2, 'STY-POLO-201', 'Tommy Hilfiger', 'Classic Pique Polo Shirt with Ribbed Collar', 'Spring/Summer 2026', 'Polo Shirt', TRUE)
ON CONFLICT (id) DO UPDATE SET
    style_no = EXCLUDED.style_no,
    buyer = EXCLUDED.buyer,
    description = EXCLUDED.description,
    season = EXCLUDED.season,
    product_type = EXCLUDED.product_type,
    active = TRUE;

-- ==============================================================================
-- 6. SEED OPERATION BULLETINS & BULLETIN LINES
-- ==============================================================================
INSERT INTO operation_bulletins (id, bulletin_code, name, description, version, revision_number, status, total_smv, approved_by, approved_at, released_by, released_at)
VALUES
    (1, 'OB-CREW-101', 'Crewneck T-Shirt Standard Assembly', '8-operation balanced assembly sequence for Classic Crewneck T-Shirt', 1, 1, 'PUBLISHED', 3.70, 'Priya Sharma (Senior IE Lead)', NOW(), 'Amit Verma (Head IE)', NOW()),
    (2, 'OB-POLO-201', 'Polo Shirt Standard Assembly', '10-operation assembly sequence for Pique Polo Shirt', 1, 1, 'PUBLISHED', 4.85, 'Priya Sharma (Senior IE Lead)', NOW(), 'Amit Verma (Head IE)', NOW())
ON CONFLICT (id) DO UPDATE SET
    bulletin_code = EXCLUDED.bulletin_code,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    total_smv = EXCLUDED.total_smv;

DELETE FROM bulletin_styles WHERE bulletin_id IN (1, 2);
INSERT INTO bulletin_styles (bulletin_id, style_id) VALUES (1, 1), (2, 2);

DELETE FROM bulletin_lines WHERE bulletin_id IN (1, 2);

-- Bulletin 1 Lines (Crewneck T-Shirt - 8 Operations)
INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, section, is_parallelizable, notes)
VALUES
    (1, 1, 1, 0.45, '4-Thread Overlock',        3, 'BODY_ASSEMBLY', 'Shoulder join with clear mobilon tape'),
    (1, 2, 2, 0.50, '4-Thread Overlock',        3, 'COLLAR_SET',    'Neck rib knit attach in circular loop'),
    (1, 3, 3, 0.35, 'Single Needle Lockstitch', 3, 'COLLAR_SET',    'Neckline top stitch and label sandwich'),
    (1, 4, 4, 0.45, '4-Thread Overlock',        3, 'SLEEVE_SET',    'Attach left sleeve to body armhole'),
    (1, 5, 5, 0.45, '4-Thread Overlock',        3, 'SLEEVE_SET',    'Attach right sleeve to body armhole'),
    (1, 6, 6, 0.55, '4-Thread Overlock',        4, 'BODY_ASSEMBLY', 'Close side seams in one continuous pass'),
    (1, 7, 7, 0.50, 'Flatlock / Interlock',     3, 'BODY_HEM',      'Bottom hem fold and coverstitch finish'),
    (1, 8, 8, 0.45, 'Flatlock / Interlock',     3, 'CUFF_HEM',      'Sleeve cuff fold and coverstitch hem');

-- Bulletin 2 Lines (Polo Shirt - 10 Operations)
INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, section, is_parallelizable, notes)
VALUES
    (2, 1,  1,  0.45, '4-Thread Overlock',        3, 'BODY_ASSEMBLY', 'Shoulder seam join with reinforcement tape'),
    (2, 2,  9,  0.65, 'Single Needle Lockstitch', 4, 'FRONT_PREP',    'Form and attach polo front placket with box stitch'),
    (2, 3,  10, 0.60, 'Single Needle Lockstitch', 4, 'COLLAR_SET',    'Attach ribbed knit collar to neck placket'),
    (2, 4,  11, 0.35, 'Single Needle Lockstitch', 3, 'COLLAR_SET',    'Collar band top stitch edge finish'),
    (2, 5,  4,  0.45, '4-Thread Overlock',        3, 'SLEEVE_SET',    'Attach left sleeve to armhole curvature'),
    (2, 6,  5,  0.45, '4-Thread Overlock',        3, 'SLEEVE_SET',    'Attach right sleeve to armhole curvature'),
    (2, 7,  8,  0.45, 'Flatlock / Interlock',     3, 'CUFF_HEM',      'Sleeve cuff hem with 2-needle interlock'),
    (2, 8,  6,  0.55, '4-Thread Overlock',        4, 'BODY_ASSEMBLY', 'Close side seams from sleeve to bottom slit'),
    (2, 9,  7,  0.50, 'Flatlock / Interlock',     3, 'BODY_HEM',      'Bottom body fold and coverstitch hem'),
    (2, 10, 18, 0.40, 'Single Needle Lockstitch', 2, 'FINISHING',     'Buttonhole punch and button tack attach');

-- ==============================================================================
-- 7. SEED SEWING LINES
-- ==============================================================================
INSERT INTO sewing_lines (
    id, line_code, line_name, line_type, floor, department,
    supervisor_name, ie_in_charge, qc_inspector,
    workstation_count, operator_count, helper_count, machine_count,
    working_hours, capacity_per_day, target_efficiency_percent,
    operational_status, current_style, current_bulletin, active, notes
)
VALUES
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
)
ON CONFLICT (id) DO UPDATE SET
    line_code = EXCLUDED.line_code,
    line_name = EXCLUDED.line_name,
    line_type = EXCLUDED.line_type,
    floor = EXCLUDED.floor,
    supervisor_name = EXCLUDED.supervisor_name,
    workstation_count = EXCLUDED.workstation_count,
    operator_count = EXCLUDED.operator_count,
    capacity_per_day = EXCLUDED.capacity_per_day,
    target_efficiency_percent = EXCLUDED.target_efficiency_percent,
    operational_status = EXCLUDED.operational_status,
    active = TRUE;

-- ==============================================================================
-- 8. SEED PRODUCTION ORDERS
-- ==============================================================================
INSERT INTO orders (
    id, order_no, buyer, style_id, color, order_date, delivery_date, planned_completion_date, status, total_quantity, created_at, updated_at
)
VALUES
(
    1, 'PO-2026-001', 'Nike Activewear', 1, 'Heather Anthracite', CURRENT_DATE - INTERVAL '23 days', CURRENT_DATE + INTERVAL '36 days', CURRENT_DATE + INTERVAL '30 days', 'IN_PRODUCTION', 20000, NOW(), NOW()
),
(
    2, 'PO-2026-002', 'Tommy Hilfiger', 2, 'Navy Blue', CURRENT_DATE - INTERVAL '19 days', CURRENT_DATE + INTERVAL '32 days', CURRENT_DATE + INTERVAL '28 days', 'IN_PRODUCTION', 9200, NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
    order_no = EXCLUDED.order_no,
    buyer = EXCLUDED.buyer,
    style_id = EXCLUDED.style_id,
    total_quantity = EXCLUDED.total_quantity,
    delivery_date = EXCLUDED.delivery_date,
    planned_completion_date = EXCLUDED.planned_completion_date,
    status = EXCLUDED.status;

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

-- ==============================================================================
-- 9. SEED 900 COMPREHENSIVE SKILL ASSESSMENTS (50 Operators x 18 Operations)
-- ==============================================================================
DELETE FROM skill_matrix_history;
DELETE FROM skill_assessments;

DO $$
DECLARE
    v_oper RECORD;
    v_op RECORD;
    v_rating INT;
    v_cycle_time INT;
    v_base_sam INT;
    v_emp_num INT;
    v_op_num INT;
    v_dept TEXT;
    v_role TEXT;
    v_is_sewing_op BOOLEAN;
    v_is_flock BOOLEAN;
    v_is_lock BOOLEAN;
    v_is_over BOOLEAN;
    v_hash INT;
BEGIN
    FOR v_oper IN SELECT id, employee_id, name, department, role, joining_date FROM operators WHERE active = TRUE ORDER BY id ASC LOOP
        v_emp_num := CAST(SUBSTRING(v_oper.employee_id FROM 5) AS INT);
        IF v_emp_num IS NULL THEN v_emp_num := CAST(v_oper.id AS INT); END IF;
        v_dept := COALESCE(v_oper.department, 'Sewing Line 1');
        v_role := COALESCE(v_oper.role, 'OPERATOR');

        FOR v_op IN SELECT id, operation_code, name, standard_smv, sequence FROM operations ORDER BY sequence ASC LOOP
            v_op_num := COALESCE(v_op.sequence, 1);
            v_base_sam := COALESCE(ROUND(v_op.standard_smv * 60), 25);
            IF v_base_sam <= 0 THEN v_base_sam := 25; END IF;

            v_hash := ((v_emp_num * 37) + (v_op_num * 19) + (v_oper.id * 7)) % 100;
            v_is_over := v_op.operation_code IN ('OP-001', 'OP-002', 'OP-004', 'OP-005', 'OP-006', 'OP-013', 'OP-014', 'OP-015');
            v_is_lock := v_op.operation_code IN ('OP-003', 'OP-009', 'OP-010', 'OP-011', 'OP-012', 'OP-016', 'OP-017', 'OP-018');
            v_is_flock := v_op.operation_code IN ('OP-007', 'OP-008');
            v_is_sewing_op := (v_is_over OR v_is_lock OR v_is_flock);

            IF v_role IN ('LINE_SUPERVISOR', 'FLOATER') THEN
                IF v_hash < 60 THEN v_rating := 5; ELSE v_rating := 4; END IF;
            ELSIF v_dept = 'Quality Control' OR v_role = 'QUALITY_CHECKER' THEN
                IF v_op.operation_code IN ('OP-010', 'OP-012', 'OP-014', 'OP-015', 'OP-018') THEN
                    IF v_hash < 65 THEN v_rating := 5; ELSE v_rating := 4; END IF;
                ELSIF v_is_sewing_op THEN
                    IF v_hash < 50 THEN v_rating := 3; ELSE v_rating := 2; END IF;
                ELSE
                    IF v_hash < 40 THEN v_rating := 4; ELSIF v_hash < 80 THEN v_rating := 3; ELSE v_rating := 2; END IF;
                END IF;
            ELSIF v_dept IN ('Finishing', 'Packing') THEN
                IF v_op.operation_code IN ('OP-011', 'OP-013', 'OP-016', 'OP-017', 'OP-018') THEN
                    IF v_hash < 40 THEN v_rating := 5; ELSIF v_hash < 75 THEN v_rating := 4; ELSE v_rating := 3; END IF;
                ELSIF v_is_sewing_op THEN
                    IF v_hash < 40 THEN v_rating := 2; ELSE v_rating := 1; END IF;
                ELSE
                    IF v_hash < 50 THEN v_rating := 3; ELSE v_rating := 2; END IF;
                END IF;
            ELSE
                IF v_emp_num <= 15 THEN
                    IF (v_emp_num % 3 = 0 AND v_is_over) OR (v_emp_num % 3 = 1 AND v_is_lock) OR (v_emp_num % 3 = 2 AND v_is_flock) THEN
                        IF v_hash < 50 THEN v_rating := 5; ELSE v_rating := 4; END IF;
                    ELSIF v_is_sewing_op THEN
                        IF v_hash < 40 THEN v_rating := 4; ELSE v_rating := 3; END IF;
                    ELSE
                        IF v_hash < 50 THEN v_rating := 3; ELSE v_rating := 2; END IF;
                    END IF;
                ELSE
                    IF (v_emp_num % 3 = 0 AND v_is_over) OR (v_emp_num % 3 = 1 AND v_is_lock) OR (v_emp_num % 3 = 2 AND v_is_flock) THEN
                        IF v_hash < 40 THEN v_rating := 4; ELSE v_rating := 3; END IF;
                    ELSIF v_is_sewing_op THEN
                        IF v_hash < 35 THEN v_rating := 3; ELSE v_rating := 2; END IF;
                    ELSE
                        IF v_hash < 40 THEN v_rating := 3; ELSE v_rating := 2; END IF;
                    END IF;
                END IF;
            END IF;

            IF v_rating = 5 THEN v_cycle_time := ROUND(v_base_sam * 0.80);
            ELSIF v_rating = 4 THEN v_cycle_time := ROUND(v_base_sam * 0.95);
            ELSIF v_rating = 3 THEN v_cycle_time := ROUND(v_base_sam * 1.10);
            ELSIF v_rating = 2 THEN v_cycle_time := ROUND(v_base_sam * 1.35);
            ELSE v_cycle_time := ROUND(v_base_sam * 1.60);
            END IF;

            INSERT INTO skill_assessments (
                operator_id, operation_id, rating, cycle_time_seconds, is_current, assessment_date, assessor, notes, created_at, updated_at
            ) VALUES (
                v_oper.id, v_op.id, v_rating, v_cycle_time, TRUE, CURRENT_DATE - INTERVAL '15 days', 'Priya Sharma (Senior IE Lead)', 'Certified performance rating', NOW(), NOW()
            );
        END LOOP;
    END LOOP;
END $$;

-- ==============================================================================
-- 10. SEED LINE PLANS & ALL WORKSTATION ASSIGNMENTS
-- ==============================================================================
INSERT INTO line_plans (
    id, line_id, order_id, shift_id, target_output, planned_efficiency, allowance, status, created_at, updated_at
)
VALUES
    (1, 1, 1, 1, 840, 85.00, 10, 'active',   NOW(), NOW()),
    (2, 2, 2, 1, 800, 82.00, 10, 'RELEASED', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    target_output = EXCLUDED.target_output,
    planned_efficiency = EXCLUDED.planned_efficiency,
    allowance = EXCLUDED.allowance,
    status = EXCLUDED.status;

DELETE FROM line_plan_assignments WHERE line_plan_id IN (1, 2);

-- Line 01 (8 main stations + 3 support stations)
INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
SELECT 1, bl.id, bl.operation_id, op.id
FROM bulletin_lines bl
JOIN operators op ON op.employee_id = 'EMP-' || LPAD(bl.sequence::text, 3, '0')
WHERE bl.bulletin_id = 1;

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

-- Line 02 (10 stations)
INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
SELECT 2, bl.id, bl.operation_id, op.id
FROM bulletin_lines bl
JOIN operators op ON op.employee_id = 'EMP-' || LPAD((bl.sequence + 11)::text, 3, '0')
WHERE bl.bulletin_id = 2;

-- ==============================================================================
-- 11. SEED PIECE PRODUCTION LOGS FOR CURRENT_DATE (145 PCS FLOW OUTPUT)
-- ==============================================================================
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

-- ==============================================================================
-- 12. SEED BIOMETRIC ATTENDANCE FOR ALL 50 OPERATORS FOR CURRENT_DATE
-- ==============================================================================
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

-- ==============================================================================
-- 13. SEED CAPACITY PLANS & LINE DESIGNS
-- ==============================================================================
INSERT INTO capacity_plans (
    id, plan_code, order_id, style_id, bulletin_id, shift_id, order_quantity, available_days,
    target_hourly_output, planned_efficiency, allowance_pfd, total_smv_minutes, customer_takt_secs,
    required_design_capacity, designed_pitch_secs, theoretical_manpower, planned_manpower, status, created_at, updated_at
)
VALUES
(
    1, 'CAP-LINE01-CREW', 1, 1, 1, 1, 20000, 27,
    125, 85.0, '5,4,1', 3.70, 28.8, 147.0, 27.0, 7.5, 8.0, 'ACTIVE', NOW(), NOW()
),
(
    2, 'CAP-LINE02-POLO', 2, 2, 2, 1, 9200, 25,
    100, 82.0, '5,4,1', 4.85, 36.0, 122.0, 28.8, 9.8, 10.0, 'ACTIVE', NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
    order_quantity = EXCLUDED.order_quantity,
    available_days = EXCLUDED.available_days,
    target_hourly_output = EXCLUDED.target_hourly_output,
    planned_efficiency = EXCLUDED.planned_efficiency,
    status = 'ACTIVE';

INSERT INTO line_designs (
    id, design_code, order_id, bulletin_id, line_id, capacity_plan_id, total_workstations, total_operators, total_helpers, total_qc, total_machines,
    target_hourly_output, planned_efficiency, designed_pitch_secs, line_balance_efficiency, status, version, created_by, approved_by, released_by
)
VALUES
(
    1, 'DES-LINE01-CREW', 1, 1, 1, 1, 8, 8, 1, 1, 8,
    125, 85.0, 27.0, 88.5, 'RELEASED', 1, 'Priya Sharma', 'Amit Verma', 'Rajesh Patel'
),
(
    2, 'DES-LINE02-POLO', 2, 2, 2, 2, 10, 10, 1, 1, 10,
    100, 82.0, 28.8, 86.0, 'RELEASED', 1, 'Priya Sharma', 'Amit Verma', 'Rajesh Patel'
)
ON CONFLICT (id) DO UPDATE SET
    target_hourly_output = EXCLUDED.target_hourly_output,
    planned_efficiency = EXCLUDED.planned_efficiency,
    status = 'RELEASED';
