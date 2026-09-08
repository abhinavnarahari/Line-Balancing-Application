-- V28: Seed comprehensive sample data for Line Balancing & Planned Lines
-- Demonstrates Takt Time (1.00 min), Bottleneck (Bottom Hem 1.20 min), and multi-operator allocation

-- 1. Ensure Sizes exist
INSERT INTO sizes (code, label, sequence, active)
VALUES 
    ('S', 'Small', 1, TRUE),
    ('M', 'Medium', 2, TRUE),
    ('L', 'Large', 3, TRUE),
    ('XL', 'Extra Large', 4, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. Update existing standard operations with exact SAMs
UPDATE operations SET standard_smv = 0.40 WHERE operation_code = 'OP-001' OR name = 'Shoulder Join';
UPDATE operations SET standard_smv = 0.75 WHERE operation_code = 'OP-004' OR name = 'Sleeve Attach Left';
UPDATE operations SET standard_smv = 0.50 WHERE operation_code = 'OP-006' OR name = 'Side Seam Close';
UPDATE operations SET standard_smv = 1.20 WHERE operation_code = 'OP-007' OR name = 'Bottom Hem';
UPDATE operations SET standard_smv = 0.65 WHERE operation_code = 'OP-002' OR name = 'Neck Rib Attach';

-- 3. Style Master: Classic Crew Neck T-Shirt
INSERT INTO styles (style_no, buyer, description, season, product_type, active)
VALUES
    ('STY-TSHIRT-480', 'Zara Men', 'Classic Crew Neck T-Shirt (Line Balance Benchmark)', 'Summer 2026', 'T-Shirt', TRUE)
ON CONFLICT (style_no) DO UPDATE
SET buyer = EXCLUDED.buyer, description = EXCLUDED.description;

-- 4. Production Order: PO-TSHIRT-480 (480 pcs for 8hr shift = 60 pcs/hr)
INSERT INTO orders (order_no, buyer, style_id, color, order_date, delivery_date, status, total_quantity)
VALUES
    (
        'PO-TSHIRT-480',
        'Zara Men',
        (SELECT id FROM styles WHERE style_no = 'STY-TSHIRT-480' LIMIT 1),
        'Navy Blue',
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'PLANNED',
        480
    )
ON CONFLICT (order_no) DO UPDATE
SET total_quantity = 480;

-- 5. Order Size Lines (120 S, 160 M, 120 L, 80 XL = 480 Total)
DO $$
DECLARE
    v_order_id BIGINT;
    v_s_id BIGINT;
    v_m_id BIGINT;
    v_l_id BIGINT;
    v_xl_id BIGINT;
BEGIN
    SELECT id INTO v_order_id FROM orders WHERE order_no = 'PO-TSHIRT-480' LIMIT 1;
    SELECT id INTO v_s_id FROM sizes WHERE code = 'S' LIMIT 1;
    SELECT id INTO v_m_id FROM sizes WHERE code = 'M' LIMIT 1;
    SELECT id INTO v_l_id FROM sizes WHERE code = 'L' LIMIT 1;
    SELECT id INTO v_xl_id FROM sizes WHERE code = 'XL' LIMIT 1;

    IF v_order_id IS NOT NULL THEN
        DELETE FROM order_size_lines WHERE order_id = v_order_id;
        INSERT INTO order_size_lines (order_id, size_id, quantity)
        VALUES
            (v_order_id, v_s_id, 120),
            (v_order_id, v_m_id, 160),
            (v_order_id, v_l_id, 120),
            (v_order_id, v_xl_id, 80);
    END IF;
END $$;

-- 6. Operation Bulletin (OB-TS-480) with 5 sequential lines
DO $$
DECLARE
    v_bulletin_id BIGINT;
    v_style_id BIGINT;
    v_op1 BIGINT;
    v_op2 BIGINT;
    v_op3 BIGINT;
    v_op4 BIGINT;
    v_op5 BIGINT;
BEGIN
    SELECT id INTO v_style_id FROM styles WHERE style_no = 'STY-TSHIRT-480' LIMIT 1;
    SELECT id INTO v_op1 FROM operations WHERE name = 'Shoulder Join' OR operation_code = 'OP-001' LIMIT 1;
    SELECT id INTO v_op2 FROM operations WHERE name = 'Sleeve Attach Left' OR operation_code = 'OP-004' LIMIT 1;
    SELECT id INTO v_op3 FROM operations WHERE name = 'Side Seam Close' OR operation_code = 'OP-006' LIMIT 1;
    SELECT id INTO v_op4 FROM operations WHERE name = 'Bottom Hem' OR operation_code = 'OP-007' LIMIT 1;
    SELECT id INTO v_op5 FROM operations WHERE name = 'Neck Rib Attach' OR operation_code = 'OP-002' LIMIT 1;

    -- Delete old bulletin if exists
    DELETE FROM operation_bulletins WHERE bulletin_code = 'OB-TS-480';

    INSERT INTO operation_bulletins (bulletin_code, name, description, version, status, total_smv)
    VALUES ('OB-TS-480', 'Standard T-Shirt Bulletin (480 Shift Target)', 'Benchmark operation sequence for 480 pcs/shift balancing', 1, 'PUBLISHED', 3.50)
    RETURNING id INTO v_bulletin_id;

    -- Link bulletin to style
    INSERT INTO bulletin_styles (bulletin_id, style_id)
    VALUES (v_bulletin_id, v_style_id)
    ON CONFLICT DO NOTHING;

    -- Add the 5 bulletin lines
    INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, notes)
    VALUES
        (v_bulletin_id, 1, v_op1, 0.40, 'Overlock 4-Thread', 3, 'Capacity: 150 pcs/hr (1 op)'),
        (v_bulletin_id, 2, v_op2, 0.75, 'Overlock 4-Thread', 4, 'Capacity: 80 pcs/hr (1 op)'),
        (v_bulletin_id, 3, v_op3, 0.50, 'Overlock 4-Thread', 3, 'Capacity: 120 pcs/hr (1 op)'),
        (v_bulletin_id, 4, v_op4, 1.20, 'Flatlock / Coverstitch', 4, 'BOTTLENECK: 50 pcs/hr with 1 op. Requires 2 ops for 100 pcs/hr!'),
        (v_bulletin_id, 5, v_op5, 0.65, 'Flatlock Cylindrical', 4, 'Capacity: 92 pcs/hr (1 op)');
END $$;

-- 7. Skilled Sewing Operators for this production line
INSERT INTO operators (employee_id, name, age, gender, department, joining_date, active)
VALUES
    ('EMP-2001', 'Priya Sharma', 26, 'Female', 'Sewing', CURRENT_DATE - INTERVAL '3 years', TRUE),
    ('EMP-2002', 'Rajesh Kumar', 32, 'Male',   'Sewing', CURRENT_DATE - INTERVAL '4 years', TRUE),
    ('EMP-2003', 'Ananya Roy',   24, 'Female', 'Sewing', CURRENT_DATE - INTERVAL '2 years', TRUE),
    ('EMP-2004', 'Deepa Patel',  29, 'Female', 'Sewing', CURRENT_DATE - INTERVAL '3 years', TRUE),
    ('EMP-2005', 'Suresh Nair',  35, 'Male',   'Sewing', CURRENT_DATE - INTERVAL '5 years', TRUE),
    ('EMP-2006', 'Fatima Begum', 23, 'Female', 'Sewing', CURRENT_DATE - INTERVAL '18 months', TRUE),
    ('EMP-2007', 'Manoj Verma',  28, 'Male',   'Sewing', CURRENT_DATE - INTERVAL '2 years', TRUE)
ON CONFLICT (employee_id) DO UPDATE
SET active = TRUE, name = EXCLUDED.name;

-- 8. Sewing Skill Matrix Assessments (Recorded Cycle Times)
DO $$
DECLARE
    v_op1 BIGINT;
    v_op2 BIGINT;
    v_op3 BIGINT;
    v_op4 BIGINT;
    v_op5 BIGINT;
    v_emp1 BIGINT;
    v_emp2 BIGINT;
    v_emp3 BIGINT;
    v_emp4 BIGINT;
    v_emp5 BIGINT;
    v_emp6 BIGINT;
    v_emp7 BIGINT;
BEGIN
    SELECT id INTO v_op1 FROM operations WHERE name = 'Shoulder Join' OR operation_code = 'OP-001' LIMIT 1;
    SELECT id INTO v_op2 FROM operations WHERE name = 'Sleeve Attach Left' OR operation_code = 'OP-004' LIMIT 1;
    SELECT id INTO v_op3 FROM operations WHERE name = 'Side Seam Close' OR operation_code = 'OP-006' LIMIT 1;
    SELECT id INTO v_op4 FROM operations WHERE name = 'Bottom Hem' OR operation_code = 'OP-007' LIMIT 1;
    SELECT id INTO v_op5 FROM operations WHERE name = 'Neck Rib Attach' OR operation_code = 'OP-002' LIMIT 1;

    SELECT id INTO v_emp1 FROM operators WHERE employee_id = 'EMP-2001' LIMIT 1;
    SELECT id INTO v_emp2 FROM operators WHERE employee_id = 'EMP-2002' LIMIT 1;
    SELECT id INTO v_emp3 FROM operators WHERE employee_id = 'EMP-2003' LIMIT 1;
    SELECT id INTO v_emp4 FROM operators WHERE employee_id = 'EMP-2004' LIMIT 1;
    SELECT id INTO v_emp5 FROM operators WHERE employee_id = 'EMP-2005' LIMIT 1;
    SELECT id INTO v_emp6 FROM operators WHERE employee_id = 'EMP-2006' LIMIT 1;
    SELECT id INTO v_emp7 FROM operators WHERE employee_id = 'EMP-2007' LIMIT 1;

    -- Clear previous test matrix for these operators
    DELETE FROM skill_assessments 
    WHERE operator_id IN (v_emp1, v_emp2, v_emp3, v_emp4, v_emp5, v_emp6, v_emp7);

    -- EMP-2001 Priya Sharma: Shoulder Join (24s) & Side Seam (30s)
    INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
    VALUES 
        (v_emp1, v_op1, 5, 24, 1, CURRENT_DATE, TRUE, 'Consistent top performance on shoulder join'),
        (v_emp1, v_op3, 4, 30, 1, CURRENT_DATE, TRUE, 'Fast side seamer');

    -- EMP-2002 Rajesh Kumar: Sleeve Attach (45s)
    INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
    VALUES 
        (v_emp2, v_op2, 5, 45, 1, CURRENT_DATE, TRUE, 'Excellent handling on curved armhole');

    -- EMP-2003 Ananya Roy: Bottom Hem (72s)
    INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
    VALUES 
        (v_emp3, v_op4, 4, 72, 1, CURRENT_DATE, TRUE, 'Precise flatlock folder control');

    -- EMP-2004 Deepa Patel: Bottom Hem (70s)
    INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
    VALUES 
        (v_emp4, v_op4, 5, 70, 1, CURRENT_DATE, TRUE, 'Fast flatlock operator, zero puckering');

    -- EMP-2005 Suresh Nair: Neck Rib Attach (39s)
    INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
    VALUES 
        (v_emp5, v_op5, 5, 39, 1, CURRENT_DATE, TRUE, 'Perfect neck rib tension & balance');

    -- EMP-2006 Fatima Begum: Multi-Skill (Shoulder Join 26s, Side Seam 32s)
    INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
    VALUES 
        (v_emp6, v_op1, 4, 26, 1, CURRENT_DATE, TRUE, 'Quick floater operator'),
        (v_emp6, v_op3, 4, 32, 1, CURRENT_DATE, TRUE, 'Good pace on side seam');

    -- EMP-2007 Manoj Verma: Sleeve Attach (48s) & Neck Attach (42s)
    INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
    VALUES 
        (v_emp7, v_op2, 4, 48, 1, CURRENT_DATE, TRUE, 'Reliable sleeve attach operator'),
        (v_emp7, v_op5, 4, 42, 1, CURRENT_DATE, TRUE, 'Trained on rib attachment');
END $$;
