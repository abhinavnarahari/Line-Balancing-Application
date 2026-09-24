-- V58: Comprehensive Enterprise Sample Dataset for Multi-Line Operator Allocation Optimizer
-- Standardizes Operations, Styles, Bulletins, Orders, Sewing Lines, Machines,
-- Operator Qualifications, Shift Attendance, and Production Performance Logs.

-- 1. Ensure Standard Operations exist with standard SMVs and matching machine types
INSERT INTO operations (operation_code, name, description, sequence, active, standard_smv, machine_type) VALUES
    ('OP-001', 'Shoulder Join', 'Join front and back shoulder seams', 1, TRUE, 0.40, '4-Thread Overlock'),
    ('OP-002', 'Neck Rib Attach', 'Attach neck ribbing to neckline', 2, TRUE, 0.55, '4-Thread Overlock'),
    ('OP-003', 'Neck Top Stitch', 'Top stitch around neck rib', 3, TRUE, 0.35, 'Single Needle Lockstitch'),
    ('OP-004', 'Sleeve Attach Left', 'Attach left sleeve to armhole', 4, TRUE, 0.50, '4-Thread Overlock'),
    ('OP-005', 'Sleeve Attach Right', 'Attach right sleeve to armhole', 5, TRUE, 0.50, '4-Thread Overlock'),
    ('OP-006', 'Side Seam Close', 'Close side seam from underarm to hem', 6, TRUE, 0.55, '4-Thread Overlock'),
    ('OP-007', 'Bottom Hem', 'Hem bottom edge of garment', 7, TRUE, 0.50, 'Flatlock / Interlock'),
    ('OP-008', 'Sleeve Hem', 'Hem sleeve cuff edge', 8, TRUE, 0.45, 'Flatlock / Interlock'),
    ('OP-009', 'Label Attach', 'Attach brand care label inside garment', 9, TRUE, 0.35, 'Single Needle Lockstitch'),
    ('OP-010', 'Trim Check', 'Check and trim loose threads', 10, TRUE, 0.30, 'Manual / Trim Station'),
    ('OP-011', 'Placket Form & Attach', 'Form and attach polo front placket', 11, TRUE, 0.70, 'Single Needle Lockstitch'),
    ('OP-012', 'Collar Attach', 'Attach knit collar to neckline', 12, TRUE, 0.65, 'Single Needle Lockstitch'),
    ('OP-013', 'Front Pocket Attach', 'Attach patch pocket to front', 13, TRUE, 0.60, 'Single Needle Lockstitch'),
    ('OP-014', 'Back Yoke Join', 'Join back yoke to back panel', 14, TRUE, 0.50, '4-Thread Overlock'),
    ('OP-015', 'Inseam Join', 'Join pants inseam with chainstitch', 15, TRUE, 0.80, '4-Thread Overlock'),
    ('OP-016', 'Waistband Attach', 'Attach waistband to waistline', 16, TRUE, 0.75, 'Single Needle Lockstitch'),
    ('OP-017', 'Cuff Attach', 'Attach cuff to sleeve end', 17, TRUE, 0.65, 'Single Needle Lockstitch'),
    ('OP-018', 'Buttonhole & Button', 'Make buttonholes and sew buttons', 18, TRUE, 0.45, 'Single Needle Lockstitch')
ON CONFLICT (operation_code) DO UPDATE
SET standard_smv = EXCLUDED.standard_smv,
    machine_type = EXCLUDED.machine_type,
    active = TRUE;

-- 2. Standard Styles
INSERT INTO styles (style_no, buyer, description, season, product_type, active) VALUES
    ('STY-POLO-800', 'Tommy Hilfiger', 'Classic Pique Polo Shirt with Ribbed Collar', 'Spring 2026', 'Polo Shirt', TRUE),
    ('STY-CREW-100', 'Nike Activewear', 'Performance Dri-Fit Crewneck T-Shirt', 'Summer 2026', 'Crewneck T-Shirt', TRUE),
    ('STY-DENIM-501', 'Levi Strauss & Co', 'Heavy 5-Pocket Raw Denim Pants', 'Autumn 2026', 'Denim Bottoms', TRUE),
    ('STY-SHIRT-OXF', 'Ralph Lauren', 'Oxford Button-Down Long Sleeve Woven Shirt', 'Winter 2026', 'Woven Shirt', TRUE)
ON CONFLICT (style_no) DO UPDATE
SET buyer = EXCLUDED.buyer, description = EXCLUDED.description, active = TRUE;

-- 3. Dedicated Operation Bulletins for Multi-Line Allocation
INSERT INTO operation_bulletins (bulletin_code, name, description, version, status, total_smv) VALUES
    ('OB-PIQUE-POLO', 'Classic Pique Polo Standard OB', '10-operation balanced assembly bulletin for Pique Polo', 1, 'PUBLISHED', 4.95),
    ('OB-PERF-CREW', 'Dri-Fit Crewneck Cell OB', '8-operation balanced cell bulletin for Active Crewneck', 1, 'PUBLISHED', 3.60),
    ('OB-RAW-DENIM', 'Heavy 5-Pocket Raw Denim OB', '10-operation heavy assembly bulletin for Denim', 1, 'PUBLISHED', 5.80),
    ('OB-OXFORD-SHIRT', 'Oxford Button-Down Shirt OB', '10-operation formal woven bulletin for Oxford Shirt', 1, 'PUBLISHED', 5.40)
ON CONFLICT (bulletin_code, version) DO UPDATE
SET name = EXCLUDED.name, total_smv = EXCLUDED.total_smv, status = 'PUBLISHED';

-- Link Bulletins to Styles
INSERT INTO bulletin_styles (bulletin_id, style_id)
SELECT b.id, s.id FROM operation_bulletins b, styles s
WHERE (b.bulletin_code = 'OB-PIQUE-POLO' AND s.style_no = 'STY-POLO-800')
   OR (b.bulletin_code = 'OB-PERF-CREW' AND s.style_no = 'STY-CREW-100')
   OR (b.bulletin_code = 'OB-RAW-DENIM' AND s.style_no = 'STY-DENIM-501')
   OR (b.bulletin_code = 'OB-OXFORD-SHIRT' AND s.style_no = 'STY-SHIRT-OXF')
ON CONFLICT DO NOTHING;

-- 4. Seed Bulletin Lines for the dedicated bulletins
DO $$
DECLARE
    v_b_polo BIGINT;
    v_b_crew BIGINT;
    v_b_denim BIGINT;
    v_b_shirt BIGINT;
BEGIN
    SELECT id INTO v_b_polo FROM operation_bulletins WHERE bulletin_code = 'OB-PIQUE-POLO' LIMIT 1;
    SELECT id INTO v_b_crew FROM operation_bulletins WHERE bulletin_code = 'OB-PERF-CREW' LIMIT 1;
    SELECT id INTO v_b_denim FROM operation_bulletins WHERE bulletin_code = 'OB-RAW-DENIM' LIMIT 1;
    SELECT id INTO v_b_shirt FROM operation_bulletins WHERE bulletin_code = 'OB-OXFORD-SHIRT' LIMIT 1;

    -- Polo Lines (10 Operations)
    IF v_b_polo IS NOT NULL THEN
        DELETE FROM bulletin_lines WHERE bulletin_id = v_b_polo;
        INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, notes)
        SELECT v_b_polo, seq, op.id, s_smv, m_type, req_skill, op_note
        FROM (VALUES
            (1, 'OP-001', 0.40, '4-Thread Overlock', 3, 'Front/Back shoulder join'),
            (2, 'OP-011', 0.70, 'Single Needle Lockstitch', 4, 'Placket attach & box stitch'),
            (3, 'OP-012', 0.65, 'Single Needle Lockstitch', 4, 'Collar attach to neck'),
            (4, 'OP-003', 0.35, 'Single Needle Lockstitch', 3, 'Collar top stitch finish'),
            (5, 'OP-004', 0.50, '4-Thread Overlock', 3, 'Left sleeve attach to armhole'),
            (6, 'OP-005', 0.50, '4-Thread Overlock', 3, 'Right sleeve attach to armhole'),
            (7, 'OP-008', 0.45, 'Flatlock / Interlock', 3, 'Sleeve cuff fold & hem'),
            (8, 'OP-006', 0.55, '4-Thread Overlock', 4, 'Side seam closing with slit'),
            (9, 'OP-007', 0.50, 'Flatlock / Interlock', 3, 'Bottom body fold & hem'),
            (10, 'OP-018', 0.35, 'Single Needle Lockstitch', 2, 'Buttons and neck label attach')
        ) AS t(seq, op_code, s_smv, m_type, req_skill, op_note)
        JOIN operations op ON op.operation_code = t.op_code;
    END IF;

    -- Crewneck Lines (8 Operations)
    IF v_b_crew IS NOT NULL THEN
        DELETE FROM bulletin_lines WHERE bulletin_id = v_b_crew;
        INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, notes)
        SELECT v_b_crew, seq, op.id, s_smv, m_type, req_skill, op_note
        FROM (VALUES
            (1, 'OP-001', 0.35, '4-Thread Overlock', 3, 'Shoulder Join'),
            (2, 'OP-002', 0.50, '4-Thread Overlock', 3, 'Neck Rib Attach'),
            (3, 'OP-003', 0.35, 'Single Needle Lockstitch', 3, 'Neck Top Stitch'),
            (4, 'OP-004', 0.45, '4-Thread Overlock', 3, 'Sleeve Attach Left'),
            (5, 'OP-005', 0.45, '4-Thread Overlock', 3, 'Sleeve Attach Right'),
            (6, 'OP-006', 0.50, '4-Thread Overlock', 3, 'Side Seam Close'),
            (7, 'OP-008', 0.40, 'Flatlock / Interlock', 2, 'Sleeve Hem'),
            (8, 'OP-007', 0.60, 'Flatlock / Interlock', 3, 'Bottom Hem')
        ) AS t(seq, op_code, s_smv, m_type, req_skill, op_note)
        JOIN operations op ON op.operation_code = t.op_code;
    END IF;

    -- Denim Lines (10 Operations)
    IF v_b_denim IS NOT NULL THEN
        DELETE FROM bulletin_lines WHERE bulletin_id = v_b_denim;
        INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, notes)
        SELECT v_b_denim, seq, op.id, s_smv, m_type, req_skill, op_note
        FROM (VALUES
            (1, 'OP-013', 0.60, 'Single Needle Lockstitch', 4, 'Front pocket facing attach'),
            (2, 'OP-014', 0.50, '4-Thread Overlock', 3, 'Back yoke to back panel join'),
            (3, 'OP-013', 0.70, 'Single Needle Lockstitch', 4, 'Back pocket decorative stitching'),
            (4, 'OP-001', 0.45, '4-Thread Overlock', 3, 'Crotch seam join'),
            (5, 'OP-015', 0.80, '4-Thread Overlock', 4, 'Inseam twin-needle stitch'),
            (6, 'OP-006', 0.60, '4-Thread Overlock', 3, 'Outseam closing'),
            (7, 'OP-016', 0.75, 'Single Needle Lockstitch', 4, 'Waistband folder attach'),
            (8, 'OP-009', 0.45, 'Single Needle Lockstitch', 3, 'Belt loops tacking'),
            (9, 'OP-007', 0.55, 'Single Needle Lockstitch', 3, 'Bottom leg cuff hem'),
            (10, 'OP-018', 0.40, 'Single Needle Lockstitch', 2, 'Button fly and rivets')
        ) AS t(seq, op_code, s_smv, m_type, req_skill, op_note)
        JOIN operations op ON op.operation_code = t.op_code;
    END IF;

    -- Oxford Shirt Lines (10 Operations)
    IF v_b_shirt IS NOT NULL THEN
        DELETE FROM bulletin_lines WHERE bulletin_id = v_b_shirt;
        INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, notes)
        SELECT v_b_shirt, seq, op.id, s_smv, m_type, req_skill, op_note
        FROM (VALUES
            (1, 'OP-011', 0.55, 'Single Needle Lockstitch', 3, 'Front placket stitch'),
            (2, 'OP-013', 0.45, 'Single Needle Lockstitch', 3, 'Chest pocket attach'),
            (3, 'OP-014', 0.50, 'Single Needle Lockstitch', 4, 'Back yoke join'),
            (4, 'OP-001', 0.40, 'Single Needle Lockstitch', 3, 'Shoulder join'),
            (5, 'OP-012', 0.80, 'Single Needle Lockstitch', 5, 'Collar band prepare & attach'),
            (6, 'OP-004', 0.55, 'Single Needle Lockstitch', 3, 'Left sleeve attach'),
            (7, 'OP-005', 0.55, 'Single Needle Lockstitch', 3, 'Right sleeve attach'),
            (8, 'OP-006', 0.65, '4-Thread Overlock', 4, 'Side seam & underarm closing'),
            (9, 'OP-017', 0.65, 'Single Needle Lockstitch', 4, 'Cuff pleating & attach'),
            (10, 'OP-007', 0.45, 'Single Needle Lockstitch', 3, 'Curved shirt bottom hem')
        ) AS t(seq, op_code, s_smv, m_type, req_skill, op_note)
        JOIN operations op ON op.operation_code = t.op_code;
    END IF;
END $$;

-- 5. Active Production Orders (Valid statuses: PLANNED, IN_PRODUCTION, COMPLETED, ON_HOLD)
INSERT INTO orders (order_no, buyer, style_id, color, order_date, delivery_date, status, total_quantity) VALUES
    ('PO-POLO-800', 'Tommy Hilfiger', (SELECT id FROM styles WHERE style_no = 'STY-POLO-800' LIMIT 1), 'Crimson Red', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 'IN_PRODUCTION', 15000),
    ('PO-CREW-100', 'Nike Activewear', (SELECT id FROM styles WHERE style_no = 'STY-CREW-100' LIMIT 1), 'Heather Grey', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '20 days', 'IN_PRODUCTION', 12000),
    ('PO-DENIM-501', 'Levi Strauss & Co', (SELECT id FROM styles WHERE style_no = 'STY-DENIM-501' LIMIT 1), 'Indigo Raw', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '30 days', 'IN_PRODUCTION', 18000),
    ('PO-SHIRT-OXF', 'Ralph Lauren', (SELECT id FROM styles WHERE style_no = 'STY-SHIRT-OXF' LIMIT 1), 'Sky Blue', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '35 days', 'PLANNED', 10000)
ON CONFLICT (order_no) DO UPDATE
SET buyer = EXCLUDED.buyer, total_quantity = EXCLUDED.total_quantity, status = 'IN_PRODUCTION';

-- 6. Link Active Sewing Lines to Orders and the new Bulletins
UPDATE sewing_lines
SET current_style = 'STY-POLO-800 - Classic Pique Polo',
    current_bulletin = 'OB-PIQUE-POLO',
    target_efficiency_percent = 85.0,
    operator_count = 10,
    workstation_count = 10,
    machine_count = 12,
    active = TRUE
WHERE line_code = 'LINE-01';

UPDATE sewing_lines
SET current_style = 'STY-CREW-100 - Performance Crewneck',
    current_bulletin = 'OB-PERF-CREW',
    target_efficiency_percent = 82.0,
    operator_count = 8,
    workstation_count = 8,
    machine_count = 10,
    active = TRUE
WHERE line_code = 'LINE-02';

UPDATE sewing_lines
SET current_style = 'STY-DENIM-501 - Heavy 5-Pocket Denim',
    current_bulletin = 'OB-RAW-DENIM',
    target_efficiency_percent = 80.0,
    operator_count = 10,
    workstation_count = 10,
    machine_count = 12,
    active = TRUE
WHERE line_code = 'LINE-03';

UPDATE sewing_lines
SET current_style = 'STY-SHIRT-OXF - Oxford Button-Down',
    current_bulletin = 'OB-OXFORD-SHIRT',
    target_efficiency_percent = 84.0,
    operator_count = 10,
    workstation_count = 10,
    machine_count = 12,
    active = TRUE
WHERE line_code = 'LINE-04';

UPDATE sewing_lines
SET current_style = 'STY-POLO-800 - Classic Pique Polo',
    current_bulletin = 'OB-PIQUE-POLO',
    target_efficiency_percent = 85.0,
    operator_count = 10,
    workstation_count = 10,
    machine_count = 12,
    active = TRUE
WHERE line_code = 'LINE-05';

UPDATE sewing_lines
SET current_style = 'STY-CREW-100 - Performance Crewneck',
    current_bulletin = 'OB-PERF-CREW',
    target_efficiency_percent = 82.0,
    operator_count = 8,
    workstation_count = 8,
    machine_count = 10,
    active = TRUE
WHERE line_code = 'LINE-06';

-- 7. Factory Machine Inventory Quantities (Ensure ample available equipment)
UPDATE machines SET quantity = 30, status = 'AVAILABLE', active = true WHERE machine_type = 'Single Needle Lockstitch';
UPDATE machines SET quantity = 25, status = 'AVAILABLE', active = true WHERE machine_type = '4-Thread Overlock';
UPDATE machines SET quantity = 20, status = 'AVAILABLE', active = true WHERE machine_type = 'Flatlock / Interlock';
UPDATE machines SET quantity = 15, status = 'AVAILABLE', active = true WHERE machine_type = '5-Thread Overlock';
UPDATE machines SET quantity = 10, status = 'AVAILABLE', active = true WHERE machine_type = 'Double Needle Lockstitch';
UPDATE machines SET quantity = 10, status = 'AVAILABLE', active = true WHERE machine_type = 'Buttonhole Machine';
UPDATE machines SET quantity = 10, status = 'AVAILABLE', active = true WHERE machine_type = 'Button Attach Machine';
UPDATE machines SET quantity = 10, status = 'AVAILABLE', active = true WHERE machine_type = 'Bar Tack Machine';
UPDATE machines SET quantity = 8, status = 'AVAILABLE', active = true WHERE machine_type = 'Feed-off-the-arm Machine';

-- 8. Operator Machine Qualifications (Comprehensive matching exact machine names)
INSERT INTO operator_machine_qualifications (operator_id, machine_type, qualification_level, certified_since, experience_months, is_primary_qualification)
SELECT 
    o.id,
    m.m_type,
    CASE 
        WHEN (o.id + m.lvl_offset) % 5 = 0 THEN 5
        WHEN (o.id + m.lvl_offset) % 5 = 1 THEN 4
        WHEN (o.id + m.lvl_offset) % 5 = 2 THEN 3
        WHEN (o.id + m.lvl_offset) % 5 = 3 THEN 2
        ELSE 4
    END AS qualification_level,
    CURRENT_DATE - INTERVAL '1 year',
    12 + CAST((o.id * 4) % 48 AS INTEGER),
    (m.lvl_offset = 0) AS is_primary_qualification
FROM operators o
CROSS JOIN (
    VALUES 
        ('Single Needle Lockstitch', 0),
        ('4-Thread Overlock', 1),
        ('5-Thread Overlock', 2),
        ('Flatlock / Interlock', 3),
        ('Double Needle Lockstitch', 4),
        ('Feed-off-the-Arm', 2),
        ('Automatic Buttonhole Machine', 1),
        ('Button Sewing Machine', 3),
        ('Electronic Bartack Machine', 0),
        ('Manual / Trim Station', 0)
) AS m(m_type, lvl_offset)
WHERE o.active = true
ON CONFLICT (operator_id, machine_type) DO UPDATE
SET qualification_level = EXCLUDED.qualification_level,
    experience_months = EXCLUDED.experience_months;

-- 9. Daily Shift Attendance (46 PRESENT, 4 ABSENT for all active shifts and dates)
WITH ranked_ops AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id ASC) AS rn
    FROM operators
    WHERE active = true
)
INSERT INTO attendance_records (attendance_date, operator_id, shift_id, status, check_in_time, check_out_time, remarks)
SELECT 
    d.att_date,
    ro.id,
    s.id AS shift_id,
    CASE 
        WHEN ro.rn IN (4, 18, 33, 47) THEN 'ABSENT'
        ELSE 'PRESENT'
    END AS status,
    CASE 
        WHEN ro.rn IN (4, 18, 33, 47) THEN NULL
        ELSE CAST('08:00:00' AS TIME)
    END AS check_in_time,
    CASE 
        WHEN ro.rn IN (4, 18, 33, 47) THEN NULL
        ELSE CAST('16:30:00' AS TIME)
    END AS check_out_time,
    CASE 
        WHEN ro.rn IN (4, 18, 33, 47) THEN 'Approved medical leave'
        ELSE 'Shift on-time reporting'
    END AS remarks
FROM ranked_ops ro
CROSS JOIN (SELECT id FROM shifts WHERE active = true) s
CROSS JOIN (
    SELECT CURRENT_DATE AS att_date
    UNION SELECT CURRENT_DATE - 1
    UNION SELECT CURRENT_DATE - 2
    UNION SELECT CURRENT_DATE + 1
    UNION SELECT CAST('2026-09-16' AS DATE)
    UNION SELECT CAST('2026-09-17' AS DATE)
) d
ON CONFLICT (attendance_date, operator_id, shift_id) DO UPDATE
SET status = EXCLUDED.status,
    check_in_time = EXCLUDED.check_in_time,
    check_out_time = EXCLUDED.check_out_time;

-- 10. Historical Operator Performance Logs (Tier 1 Performance Model)
INSERT INTO operator_performance_logs (operator_id, operation_id, log_date, actual_cycle_time_seconds, status, recorded_by, notes)
SELECT 
    o.id,
    op.id,
    d.prod_date,
    CAST(op.standard_smv * 60 * (0.85 + ((o.id * 3 + op.id * 7) % 30) / 100.0) AS INTEGER) AS actual_cycle_time_seconds,
    'VERIFIED',
    'Senior Industrial Engineer',
    'Historical time study observation'
FROM operators o
CROSS JOIN (SELECT id, standard_smv FROM operations WHERE active = true LIMIT 10) op
CROSS JOIN (
    SELECT CURRENT_DATE - 1 AS prod_date
    UNION SELECT CURRENT_DATE - 3
    UNION SELECT CURRENT_DATE - 7
    UNION SELECT CURRENT_DATE - 14
) d
WHERE o.active = true AND o.id NOT IN (4, 18, 33, 47)
ON CONFLICT DO NOTHING;

-- 11. Piece Production Logs for Module 4 tracking
INSERT INTO piece_production_logs (operator_id, operation_id, operation_name, order_id, target_qty, completed_qty, good_qty, reject_qty, start_time, end_time, actual_time_minutes, sam_minutes, machine_code, log_date, hour_slot, notes)
SELECT 
    o.id,
    op.id,
    op.name,
    ord.id,
    50,
    CAST(45 + (o.id + op.id) % 6 AS INTEGER),
    CAST(44 + (o.id + op.id) % 6 AS INTEGER),
    1,
    CAST('09:00:00' AS TIME),
    CAST('10:00:00' AS TIME),
    60.0,
    op.standard_smv,
    'M-01',
    d.prod_date,
    9,
    'Production run log'
FROM operators o
CROSS JOIN (SELECT id, name, standard_smv FROM operations WHERE active = true LIMIT 6) op
CROSS JOIN (SELECT id FROM orders LIMIT 1) ord
CROSS JOIN (
    SELECT CURRENT_DATE - 1 AS prod_date
    UNION SELECT CURRENT_DATE - 3
) d
WHERE o.active = true AND o.id NOT IN (4, 18, 33, 47)
ON CONFLICT DO NOTHING;

