-- V59: Clean & Cohesive Enterprise Garment Sample Dataset
-- Standardizes Styles, Operation Bulletins, Sewing Lines, Production Orders, Line Designs,
-- Operator Skill Matrix, Attendance, and Multi-Line Optimizer Context.

-- 1. PURGE LEGACY SAMPLE DATA SAFELY IN PROPER DEPENDENCY ORDER
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

-- 2. SEED 18 CANONICAL INDUSTRIAL SEWING OPERATIONS WITH REALISTIC SMVs & MACHINE TYPES
INSERT INTO operations (operation_code, name, description, sequence, active, standard_smv, machine_type) VALUES
    ('OP-001', 'Shoulder Join', 'Join front and back shoulder seams with safety stitch', 1, TRUE, 0.40, '4-Thread Overlock'),
    ('OP-002', 'Neck Rib Attach', 'Attach ribbed collar neckband to body neckline', 2, TRUE, 0.50, '4-Thread Overlock'),
    ('OP-003', 'Neck Top Stitch', 'Single needle top stitch around neck rib seam', 3, TRUE, 0.35, 'Single Needle Lockstitch'),
    ('OP-004', 'Sleeve Attach Left', 'Set and sew left sleeve to armhole curvature', 4, TRUE, 0.45, '4-Thread Overlock'),
    ('OP-005', 'Sleeve Attach Right', 'Set and sew right sleeve to armhole curvature', 5, TRUE, 0.45, '4-Thread Overlock'),
    ('OP-006', 'Side Seam Close', 'Close garment side seam from cuff to bottom hem', 6, TRUE, 0.55, '4-Thread Overlock'),
    ('OP-007', 'Bottom Hem', 'Hem bottom body edge with double needle interlock', 7, TRUE, 0.50, 'Flatlock / Interlock'),
    ('OP-008', 'Sleeve Hem', 'Hem sleeve cuff openings with flatlock stitch', 8, TRUE, 0.45, 'Flatlock / Interlock'),
    ('OP-009', 'Placket Form & Attach', 'Form front placket, fuse, and attach to polo body', 9, TRUE, 0.65, 'Single Needle Lockstitch'),
    ('OP-010', 'Collar Attach', 'Attach rib knit polo collar to neckline placket', 10, TRUE, 0.60, 'Single Needle Lockstitch'),
    ('OP-011', 'Collar Top Stitch', 'Top stitch around collar band and edge for structure', 11, TRUE, 0.35, 'Single Needle Lockstitch'),
    ('OP-012', 'Front Pocket Attach', 'Position and attach patch pocket to front body', 12, TRUE, 0.60, 'Single Needle Lockstitch'),
    ('OP-013', 'Back Yoke Join', 'Attach upper back yoke panel to lower back body', 13, TRUE, 0.50, '4-Thread Overlock'),
    ('OP-014', 'Inseam Join', 'Join pants front and back panels along inner leg', 14, TRUE, 0.75, '4-Thread Overlock'),
    ('OP-015', 'Outseam Join', 'Join outer side seams with safety overlock stitch', 15, TRUE, 0.70, '4-Thread Overlock'),
    ('OP-016', 'Waistband Attach', 'Fold and stitch waistband elastic/canvas around waist', 16, TRUE, 0.70, 'Single Needle Lockstitch'),
    ('OP-017', 'Cuff Attach', 'Attach sleeve cuff to woven/knit shirt sleeve opening', 17, TRUE, 0.60, 'Single Needle Lockstitch'),
    ('OP-018', 'Buttonhole & Button', 'Cut buttonhole eyelets and sew tack buttons', 18, TRUE, 0.40, 'Single Needle Lockstitch')
ON CONFLICT (operation_code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    sequence = EXCLUDED.sequence,
    standard_smv = EXCLUDED.standard_smv,
    machine_type = EXCLUDED.machine_type,
    active = TRUE;

-- 3. SEED 4 CLEAN CORE GARMENT STYLES
INSERT INTO styles (id, style_no, buyer, description, season, product_type, active) VALUES
    (1, 'STY-POLO-100', 'Tommy Hilfiger', 'Classic Pique Polo Shirt with Ribbed Collar', 'Spring/Summer 2026', 'Polo Shirt', TRUE),
    (2, 'STY-CREW-200', 'Nike Activewear', 'Performance Dri-FIT Crewneck T-Shirt', 'Summer 2026', 'Crewneck T-Shirt', TRUE),
    (3, 'STY-DENIM-300', 'Levi Strauss & Co', '5-Pocket Raw Stretch Denim Jeans', 'Autumn/Winter 2026', 'Denim Bottoms', TRUE),
    (4, 'STY-SHIRT-400', 'Ralph Lauren', 'Oxford Button-Down Formal Woven Shirt', 'Year-Round Formal', 'Woven Shirt', TRUE);

SELECT setval('styles_id_seq', (SELECT MAX(id) FROM styles));

-- 4. SEED 4 CANONICAL OPERATION BULLETINS
INSERT INTO operation_bulletins (id, bulletin_code, name, description, version, revision_number, status, total_smv, approved_by, approved_at, released_by, released_at) VALUES
    (1, 'OB-POLO-100', 'Pique Polo Standard Assembly Bulletin', '10-operation balanced assembly bulletin for Classic Pique Polo', 1, 1, 'PUBLISHED', 4.80, 'Priya Sharma (Senior IE Lead)', NOW(), 'Amit Verma (Head IE)', NOW()),
    (2, 'OB-CREW-200', 'Performance Dri-FIT Crewneck Bulletin', '8-operation high-velocity modular cell bulletin for Active Crewneck', 1, 1, 'PUBLISHED', 3.60, 'Priya Sharma (Senior IE Lead)', NOW(), 'Amit Verma (Head IE)', NOW()),
    (3, 'OB-DENIM-300', '5-Pocket Raw Denim Jeans Bulletin', '10-operation heavy assembly bulletin for Raw Denim Pants', 1, 1, 'PUBLISHED', 5.60, 'Amit Verma (Head IE)', NOW(), 'Rajesh Patel (Plant Head)', NOW()),
    (4, 'OB-SHIRT-400', 'Oxford Button-Down Shirt Bulletin', '10-operation formal woven assembly bulletin for Oxford Shirt', 1, 1, 'PUBLISHED', 5.20, 'Priya Sharma (Senior IE Lead)', NOW(), 'Amit Verma (Head IE)', NOW());

SELECT setval('operation_bulletins_id_seq', (SELECT MAX(id) FROM operation_bulletins));

-- Link Bulletins to Styles
INSERT INTO bulletin_styles (bulletin_id, style_id) VALUES
    (1, 1),
    (2, 2),
    (3, 3),
    (4, 4);

-- 5. SEED BULLETIN LINES FOR THE 4 BULLETINS
-- Bulletin 1: Polo (10 Operations, Total SMV = 4.80 min)
INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, section, is_parallelizable, notes)
SELECT 1, seq, op.id, s_smv, m_type, req_skill, sec, true, note
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

-- Bulletin 2: Crewneck T-Shirt (8 Operations, Total SMV = 3.60 min)
INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, section, is_parallelizable, notes)
SELECT 2, seq, op.id, s_smv, m_type, req_skill, sec, true, note
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

-- Bulletin 3: Raw Denim (10 Operations, Total SMV = 5.60 min)
INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, section, is_parallelizable, notes)
SELECT 3, seq, op.id, s_smv, m_type, req_skill, sec, true, note
FROM (VALUES
    (1, 'OP-012', 0.60, 'Single Needle Lockstitch', 3, 'FRONT_PREP', 'Position and stitch front scoop pockets'),
    (2, 'OP-018', 0.40, 'Single Needle Lockstitch', 2, 'FRONT_PREP', 'Coin pocket stitch and rivet prep'),
    (3, 'OP-013', 0.50, '4-Thread Overlock', 3, 'BACK_PREP', 'Back yoke join with double needle overlock'),
    (4, 'OP-012', 0.65, 'Single Needle Lockstitch', 4, 'BACK_PREP', 'Back patch pocket stitch with twin needle decorative arc'),
    (5, 'OP-014', 0.75, '4-Thread Overlock', 4, 'ASSEMBLY', 'Heavy inseam chainstitch join'),
    (6, 'OP-015', 0.70, '4-Thread Overlock', 4, 'ASSEMBLY', 'Outseam safety overlock join'),
    (7, 'OP-009', 0.60, 'Single Needle Lockstitch', 4, 'WAIST_SET', 'Zipper fly j-stitch attach'),
    (8, 'OP-016', 0.70, 'Single Needle Lockstitch', 4, 'WAIST_SET', 'Contour waistband attach with lockstitch folder'),
    (9, 'OP-007', 0.40, 'Single Needle Lockstitch', 3, 'HEM_FINISH', 'Bottom leg opening rope hem stitch'),
    (10, 'OP-018', 0.30, 'Single Needle Lockstitch', 2, 'FINISHING', '5 belt loops attach and bartack reinforcement')
) AS t(seq, op_code, s_smv, m_type, req_skill, sec, note)
JOIN operations op ON op.operation_code = t.op_code;

-- Bulletin 4: Oxford Formal Shirt (10 Operations, Total SMV = 5.20 min)
INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, section, is_parallelizable, notes)
SELECT 4, seq, op.id, s_smv, m_type, req_skill, sec, true, note
FROM (VALUES
    (1, 'OP-013', 0.45, 'Single Needle Lockstitch', 3, 'BACK_PREP', 'Back yoke sandwich join to back panel with box pleat'),
    (2, 'OP-009', 0.60, 'Single Needle Lockstitch', 4, 'FRONT_PREP', 'Folded front button placket top stitch'),
    (3, 'OP-010', 0.70, 'Single Needle Lockstitch', 4, 'COLLAR_SET', 'Collar band assembly and attach to neckline'),
    (4, 'OP-011', 0.35, 'Single Needle Lockstitch', 3, 'COLLAR_SET', 'Point collar edge top stitch finish'),
    (5, 'OP-009', 0.50, 'Single Needle Lockstitch', 3, 'SLEEVE_PREP', 'Sleeve placket binding and gauntlet buttonhole'),
    (6, 'OP-004', 0.60, '4-Thread Overlock', 3, 'SLEEVE_SET', 'Set sleeves to armhole with safety overlock'),
    (7, 'OP-006', 0.55, '4-Thread Overlock', 4, 'BODY_ASSEMBLY', 'French seam side closing from cuff to curve hem'),
    (8, 'OP-017', 0.60, 'Single Needle Lockstitch', 4, 'CUFF_SET', 'Attach structured cuffs with pleats'),
    (9, 'OP-007', 0.45, 'Single Needle Lockstitch', 3, 'BODY_HEM', 'Narrow rolled curve hem finish'),
    (10, 'OP-018', 0.40, 'Single Needle Lockstitch', 2, 'FINISHING', 'Front buttonholes and cross-stitch buttoning')
) AS t(seq, op_code, s_smv, m_type, req_skill, sec, note)
JOIN operations op ON op.operation_code = t.op_code;

-- 6. SEED 6 SEWING LINES MASTER (CLEAN SEQUENTIAL IDs 1 TO 6)
INSERT INTO sewing_lines (
    id, line_code, line_name, line_type, floor, department,
    supervisor_name, ie_in_charge, qc_inspector,
    workstation_count, operator_count, helper_count, machine_count,
    working_hours, capacity_per_day, target_efficiency_percent,
    operational_status, current_style, current_bulletin, active, notes
) VALUES
(
    1, 'LINE-01', 'Line 01 - Polo Shirt Assembly', 'PBS', 'Floor 1 - Bay A', 'Knit Polo & Tops Floor',
    'Rahim Khan', 'Priya Sharma', 'Naresh Soni',
    10, 10, 1, 10,
    8.00, 1000, 82.00,
    'ACTIVE', 'STY-POLO-100 - Classic Pique Polo', 'OB-POLO-100', TRUE,
    'High-volume polo line equipped with under-bed thread trimmers and placket folders.'
),
(
    2, 'LINE-02', 'Line 02 - Crewneck T-Shirt Cell', 'MODULAR_CELL', 'Floor 1 - Bay B', 'Activewear & Crewnecks Floor',
    'Rajesh Patel', 'Priya Sharma', 'Naresh Soni',
    8, 8, 1, 8,
    8.00, 1300, 85.00,
    'ACTIVE', 'STY-CREW-200 - Performance Dri-FIT Crew T-Shirt', 'OB-CREW-200', TRUE,
    'Lean U-shape modular cell for rapid quick-turn crewneck production.'
),
(
    3, 'LINE-03', 'Line 03 - Denim Bottoms Assembly', 'PBS', 'Floor 2 - Bay C', 'Denim & Heavy Bottoms Floor',
    'Suresh Nair', 'Amit Verma', 'Deepa Roy',
    10, 10, 2, 10,
    8.00, 800, 78.00,
    'ACTIVE', 'STY-DENIM-300 - 5-Pocket Raw Stretch Denim Jeans', 'OB-DENIM-300', TRUE,
    'Heavy-duty sewing line with synchronized pullers and waistband folders.'
),
(
    4, 'LINE-04', 'Line 04 - Formal Woven Shirts Line', 'UPS_HANGER', 'Floor 2 - Bay D', 'Woven Formal Shirts Floor',
    'Fatima Begum', 'Priya Sharma', 'Sunil Mehta',
    10, 10, 1, 10,
    8.00, 900, 80.00,
    'ACTIVE', 'STY-SHIRT-400 - Oxford Button-Down Formal Woven Shirt', 'OB-SHIRT-400', TRUE,
    'Equipped with overhead motorized unit production hanger system.'
),
(
    5, 'LINE-05', 'Line 05 - Outerwear & Casual Polo Line', 'PBS', 'Floor 3 - Bay E', 'Outerwear & Casualwear Floor',
    'Anand Kumar', 'Amit Verma', 'Sunil Mehta',
    9, 9, 1, 9,
    8.00, 850, 80.00,
    'ACTIVE', 'STY-POLO-100 - Classic Pique Polo', 'OB-POLO-100', TRUE,
    'Multi-product flexible progressive bundle line for casual tops.'
),
(
    6, 'LINE-06', 'Line 06 - Small Parts & Collar Feeder Cell', 'FEEDER_LINE', 'Floor 1 - Prep Zone', 'Pre-Assembly & Feeders',
    'Meera Das', 'Priya Sharma', 'Naresh Soni',
    9, 9, 1, 9,
    8.00, 1400, 85.00,
    'ACTIVE', 'STY-CREW-200 - Performance Dri-FIT Crew T-Shirt', 'OB-CREW-200', TRUE,
    'Specialized preparation cell feeding completed collars, plackets, and small components.'
);

SELECT setval('sewing_lines_id_seq', (SELECT MAX(id) FROM sewing_lines));

-- 7. SEED 6 REALISTIC PRODUCTION ORDERS (MAPPED TO BUYERS, STYLES, LINES, DUE DATES)
INSERT INTO orders (
    id, order_no, buyer, style_id, color, order_date, delivery_date, planned_completion_date, status, total_quantity, created_at, updated_at
) VALUES
(
    1, 'PO-POLO-2026-01', 'Tommy Hilfiger', 1, 'Classic Navy Blue', '2026-08-01', '2026-10-15', '2026-10-10', 'IN_PRODUCTION', 10000, NOW(), NOW()
),
(
    2, 'PO-CREW-2026-02', 'Nike Activewear', 2, 'Heather Anthracite', '2026-08-05', '2026-10-20', '2026-10-18', 'IN_PRODUCTION', 15000, NOW(), NOW()
),
(
    3, 'PO-DENIM-2026-03', 'Levi Strauss & Co', 3, 'Deep Indigo Raw', '2026-08-10', '2026-11-05', '2026-11-01', 'IN_PRODUCTION', 8000, NOW(), NOW()
),
(
    4, 'PO-SHIRT-2026-04', 'Ralph Lauren', 4, 'Crisp Oxford Light Blue', '2026-08-15', '2026-11-12', '2026-11-08', 'IN_PRODUCTION', 6500, NOW(), NOW()
),
(
    5, 'PO-POLO-2026-05', 'Tommy Hilfiger', 1, 'Optic White', '2026-08-20', '2026-11-25', '2026-11-20', 'PLANNED', 7500, NOW(), NOW()
),
(
    6, 'PO-CREW-2026-06', 'Nike Activewear', 2, 'Sport Red', '2026-08-25', '2026-12-01', '2026-11-28', 'PLANNED', 12000, NOW(), NOW()
);

SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- Size Breakdowns for Orders
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

-- 8. SEED 6 LINE DESIGNS & BALANCED WORKSTATIONS (TOTAL 56 WORKSTATIONS)
-- Line 01 Design (Polo, 10 stations, Target: 102 pcs/hr, 82% eff)
INSERT INTO line_designs (
    id, design_code, order_id, bulletin_id, line_id, total_workstations, total_operators, total_helpers, total_qc, total_machines,
    target_hourly_output, planned_efficiency, designed_pitch_secs, line_balance_efficiency, status, version, created_by, approved_by, released_by
) VALUES
(
    1, 'DES-LINE01-POLO', 1, 1, 1, 10, 10, 1, 1, 10,
    102, 82.0, 28.8, 85.5, 'RELEASED', 1, 'Priya Sharma', 'Amit Verma', 'Rajesh Patel'
),
(
    2, 'DES-LINE02-CREW', 2, 2, 2, 8, 8, 1, 1, 8,
    135, 85.0, 27.0, 88.0, 'RELEASED', 1, 'Priya Sharma', 'Amit Verma', 'Rajesh Patel'
),
(
    3, 'DES-LINE03-DENIM', 3, 3, 3, 10, 10, 2, 1, 10,
    85, 78.0, 33.6, 81.2, 'RELEASED', 1, 'Amit Verma', 'Amit Verma', 'Rajesh Patel'
),
(
    4, 'DES-LINE04-SHIRT', 4, 4, 4, 10, 10, 1, 1, 10,
    92, 80.0, 31.2, 83.4, 'RELEASED', 1, 'Priya Sharma', 'Amit Verma', 'Rajesh Patel'
),
(
    5, 'DES-LINE05-POLO', 5, 1, 5, 9, 9, 1, 1, 9,
    95, 80.0, 32.0, 82.0, 'RELEASED', 1, 'Priya Sharma', 'Amit Verma', 'Rajesh Patel'
),
(
    6, 'DES-LINE06-PREP', 6, 2, 6, 9, 9, 1, 1, 9,
    140, 85.0, 25.7, 86.5, 'RELEASED', 1, 'Priya Sharma', 'Amit Verma', 'Rajesh Patel'
);

SELECT setval('line_designs_id_seq', (SELECT MAX(id) FROM line_designs));

-- Workstations for Line 01 (10 Workstations S01 to S10)
INSERT INTO balance_workstations (line_design_id, station_index, station_code, primary_machine_type, allocated_operators, effective_time_secs, capacity_per_hour, workload_percent, is_bottleneck) VALUES
    (1, 1, 'S01', '4-Thread Overlock', 1, 24.0, 150.0, 75.0, FALSE),
    (1, 2, 'S02', 'Single Needle Lockstitch', 1, 39.0, 92.3, 121.9, TRUE),
    (1, 3, 'S03', 'Single Needle Lockstitch', 1, 36.0, 100.0, 112.5, FALSE),
    (1, 4, 'S04', 'Single Needle Lockstitch', 1, 21.0, 171.4, 65.6, FALSE),
    (1, 5, 'S05', '4-Thread Overlock', 1, 27.0, 133.3, 84.4, FALSE),
    (1, 6, 'S06', '4-Thread Overlock', 1, 27.0, 133.3, 84.4, FALSE),
    (1, 7, 'S07', 'Flatlock / Interlock', 1, 27.0, 133.3, 84.4, FALSE),
    (1, 8, 'S08', '4-Thread Overlock', 1, 33.0, 109.1, 103.1, FALSE),
    (1, 9, 'S09', 'Flatlock / Interlock', 1, 30.0, 120.0, 93.8, FALSE),
    (1, 10, 'S10', 'Single Needle Lockstitch', 1, 24.0, 150.0, 75.0, FALSE);

-- Workstations for Line 02 (8 Workstations S01 to S08)
INSERT INTO balance_workstations (line_design_id, station_index, station_code, primary_machine_type, allocated_operators, effective_time_secs, capacity_per_hour, workload_percent, is_bottleneck) VALUES
    (2, 1, 'S01', '4-Thread Overlock', 1, 21.0, 171.4, 77.8, FALSE),
    (2, 2, 'S02', '4-Thread Overlock', 1, 30.0, 120.0, 111.1, FALSE),
    (2, 3, 'S03', 'Single Needle Lockstitch', 1, 21.0, 171.4, 77.8, FALSE),
    (2, 4, 'S04', '4-Thread Overlock', 1, 27.0, 133.3, 100.0, FALSE),
    (2, 5, 'S05', '4-Thread Overlock', 1, 27.0, 133.3, 100.0, FALSE),
    (2, 6, 'S06', '4-Thread Overlock', 1, 30.0, 120.0, 111.1, FALSE),
    (2, 7, 'S07', 'Flatlock / Interlock', 1, 27.0, 133.3, 100.0, FALSE),
    (2, 8, 'S08', 'Flatlock / Interlock', 1, 33.0, 109.1, 122.2, TRUE);

-- Workstations for Line 03 (10 Workstations S01 to S10)
INSERT INTO balance_workstations (line_design_id, station_index, station_code, primary_machine_type, allocated_operators, effective_time_secs, capacity_per_hour, workload_percent, is_bottleneck) VALUES
    (3, 1, 'S01', 'Single Needle Lockstitch', 1, 36.0, 100.0, 107.1, FALSE),
    (3, 2, 'S02', 'Single Needle Lockstitch', 1, 24.0, 150.0, 71.4, FALSE),
    (3, 3, 'S03', '4-Thread Overlock', 1, 30.0, 120.0, 89.3, FALSE),
    (3, 4, 'S04', 'Single Needle Lockstitch', 1, 39.0, 92.3, 116.1, FALSE),
    (3, 5, 'S05', '4-Thread Overlock', 1, 45.0, 80.0, 133.9, TRUE),
    (3, 6, 'S06', '4-Thread Overlock', 1, 42.0, 85.7, 125.0, FALSE),
    (3, 7, 'S07', 'Single Needle Lockstitch', 1, 36.0, 100.0, 107.1, FALSE),
    (3, 8, 'S08', 'Single Needle Lockstitch', 1, 42.0, 85.7, 125.0, FALSE),
    (3, 9, 'S09', 'Single Needle Lockstitch', 1, 24.0, 150.0, 71.4, FALSE),
    (3, 10, 'S10', 'Single Needle Lockstitch', 1, 18.0, 200.0, 53.6, FALSE);

-- Workstations for Line 04 (10 Workstations S01 to S10)
INSERT INTO balance_workstations (line_design_id, station_index, station_code, primary_machine_type, allocated_operators, effective_time_secs, capacity_per_hour, workload_percent, is_bottleneck) VALUES
    (4, 1, 'S01', 'Single Needle Lockstitch', 1, 27.0, 133.3, 86.5, FALSE),
    (4, 2, 'S02', 'Single Needle Lockstitch', 1, 36.0, 100.0, 115.4, FALSE),
    (4, 3, 'S03', 'Single Needle Lockstitch', 1, 42.0, 85.7, 134.6, TRUE),
    (4, 4, 'S04', 'Single Needle Lockstitch', 1, 21.0, 171.4, 67.3, FALSE),
    (4, 5, 'S05', 'Single Needle Lockstitch', 1, 30.0, 120.0, 96.2, FALSE),
    (4, 6, 'S06', '4-Thread Overlock', 1, 36.0, 100.0, 115.4, FALSE),
    (4, 7, 'S07', '4-Thread Overlock', 1, 33.0, 109.1, 105.8, FALSE),
    (4, 8, 'S08', 'Single Needle Lockstitch', 1, 36.0, 100.0, 115.4, FALSE),
    (4, 9, 'S09', 'Single Needle Lockstitch', 1, 27.0, 133.3, 86.5, FALSE),
    (4, 10, 'S10', 'Single Needle Lockstitch', 1, 24.0, 150.0, 76.9, FALSE);

-- Workstations for Line 05 (9 Workstations S01 to S09)
INSERT INTO balance_workstations (line_design_id, station_index, station_code, primary_machine_type, allocated_operators, effective_time_secs, capacity_per_hour, workload_percent, is_bottleneck) VALUES
    (5, 1, 'S01', '4-Thread Overlock', 1, 24.0, 150.0, 75.0, FALSE),
    (5, 2, 'S02', 'Single Needle Lockstitch', 1, 39.0, 92.3, 121.9, TRUE),
    (5, 3, 'S03', 'Single Needle Lockstitch', 1, 36.0, 100.0, 112.5, FALSE),
    (5, 4, 'S04', 'Single Needle Lockstitch', 1, 21.0, 171.4, 65.6, FALSE),
    (5, 5, 'S05', '4-Thread Overlock', 1, 30.0, 120.0, 93.8, FALSE),
    (5, 6, 'S06', 'Flatlock / Interlock', 1, 27.0, 133.3, 84.4, FALSE),
    (5, 7, 'S07', '4-Thread Overlock', 1, 33.0, 109.1, 103.1, FALSE),
    (5, 8, 'S08', 'Flatlock / Interlock', 1, 30.0, 120.0, 93.8, FALSE),
    (5, 9, 'S09', 'Single Needle Lockstitch', 1, 24.0, 150.0, 75.0, FALSE);

-- Workstations for Line 06 (9 Workstations S01 to S09)
INSERT INTO balance_workstations (line_design_id, station_index, station_code, primary_machine_type, allocated_operators, effective_time_secs, capacity_per_hour, workload_percent, is_bottleneck) VALUES
    (6, 1, 'S01', '4-Thread Overlock', 1, 21.0, 171.4, 81.7, FALSE),
    (6, 2, 'S02', '4-Thread Overlock', 1, 30.0, 120.0, 116.7, FALSE),
    (6, 3, 'S03', 'Single Needle Lockstitch', 1, 21.0, 171.4, 81.7, FALSE),
    (6, 4, 'S04', '4-Thread Overlock', 1, 27.0, 133.3, 105.0, FALSE),
    (6, 5, 'S05', '4-Thread Overlock', 1, 27.0, 133.3, 105.0, FALSE),
    (6, 6, 'S06', '4-Thread Overlock', 1, 30.0, 120.0, 116.7, FALSE),
    (6, 7, 'S07', 'Flatlock / Interlock', 1, 27.0, 133.3, 105.0, FALSE),
    (6, 8, 'S08', 'Flatlock / Interlock', 1, 33.0, 109.1, 128.4, TRUE),
    (6, 9, 'S09', 'Single Needle Lockstitch', 1, 18.0, 200.0, 70.0, FALSE);

-- Link balance station operations
INSERT INTO balance_station_operations (balance_workstation_id, bulletin_line_id, operation_id, sequence, operation_smv, is_split, machine_type)
SELECT bw.id, bl.id, bl.operation_id, bw.station_index, bl.smv, FALSE, bl.machine_type
FROM balance_workstations bw
JOIN line_designs ld ON ld.id = bw.line_design_id
JOIN bulletin_lines bl ON bl.bulletin_id = ld.bulletin_id AND bl.sequence = bw.station_index;

-- 9. RE-ALIGN SKILL ASSESSMENTS FOR ALL 50 OPERATORS (OP-001 TO OP-050)
DELETE FROM skill_assessments;

INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes, created_at, updated_at)
SELECT 
    op.id, 
    oper.id,
    CASE
        -- Top Veteran Operators (OP-001 to OP-010) are Expert R4 in core & R3 in others
        WHEN op.id <= 10 AND oper.sequence IN (1, 2, 6, 9, 10, 14, 15) THEN 4
        WHEN op.id <= 10 THEN 3
        -- Senior Operators (OP-011 to OP-030) are R3/R4 skilled
        WHEN op.id <= 30 AND (op.id + oper.sequence) % 3 = 0 THEN 4
        WHEN op.id <= 30 THEN 3
        -- Mid/Junior Operators (OP-031 to OP-045) are R2/R3 competent
        WHEN op.id <= 45 AND (op.id + oper.sequence) % 2 = 0 THEN 3
        WHEN op.id <= 45 THEN 2
        -- Trainees (OP-046 to OP-050) are R1/R2
        WHEN (op.id + oper.sequence) % 2 = 0 THEN 2
        ELSE 1
    END as rating,
    CAST(ROUND(COALESCE(oper.standard_smv, 0.5) * 60 * (1.5 - 0.12 * (
        CASE
            WHEN op.id <= 10 AND oper.sequence IN (1, 2, 6, 9, 10, 14, 15) THEN 4
            WHEN op.id <= 10 THEN 3
            WHEN op.id <= 30 AND (op.id + oper.sequence) % 3 = 0 THEN 4
            WHEN op.id <= 30 THEN 3
            WHEN op.id <= 45 AND (op.id + oper.sequence) % 2 = 0 THEN 3
            WHEN op.id <= 45 THEN 2
            WHEN (op.id + oper.sequence) % 2 = 0 THEN 2
            ELSE 1
        END
    ))) AS INTEGER) as cycle_time_seconds,
    1 as revision,
    CURRENT_DATE as effective_date,
    TRUE as is_current,
    'Enterprise Baseline Matrix' as notes,
    NOW(),
    NOW()
FROM operators op
CROSS JOIN operations oper
WHERE op.id <= 50;

-- 10. REFRESH TODAY'S ATTENDANCE FOR 50 OPERATORS (46 PRESENT, 4 ON LEAVE / ABSENT)
DELETE FROM attendance_records WHERE attendance_date >= CURRENT_DATE - INTERVAL '7 days';

INSERT INTO attendance_records (attendance_date, operator_id, shift_id, status, check_in_time, check_out_time, remarks, created_at, updated_at)
SELECT d::DATE, op.id, 1,
    CASE 
        WHEN op.id IN (47, 48) THEN 'ON_LEAVE'
        WHEN op.id IN (49, 50) AND d::DATE = CURRENT_DATE THEN 'ABSENT'
        ELSE 'PRESENT'
    END,
    CASE 
        WHEN op.id IN (47, 48, 49, 50) THEN NULL
        ELSE '07:55:00'::TIME
    END,
    CASE 
        WHEN op.id IN (47, 48, 49, 50) THEN NULL
        ELSE '16:30:00'::TIME
    END,
    'Auto-logged shift baseline',
    NOW(), NOW()
FROM operators op
CROSS JOIN generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
WHERE op.id <= 50;
