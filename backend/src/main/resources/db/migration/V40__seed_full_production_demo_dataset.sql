-- ==============================================================================
-- V40: Comprehensive Production Demo Dataset for Client Reviews & Showcases
-- Seeds: Garment Styles, Operation Bulletins, Orders, Operators, 
-- Full Skill Matrix, Today's Attendance, Line Plans, and Hourly Board Entries
-- ==============================================================================

-- 1. Ensure Garment Styles Exist
INSERT INTO styles (style_no, buyer, description, season, product_type, active)
VALUES
    ('STY-POLO-800', 'Nike Sportswear', 'Dri-FIT Men Athletic Pique Polo', 'Autumn 2026', 'Polo Shirt', TRUE),
    ('STY-HOODIE-550', 'H&M Casuals', 'Heavyweight Fleece Pullover Hoodie', 'Winter 2026', 'Hoodie', TRUE),
    ('STY-CHINO-620', 'Levi Strauss & Co', 'Slim Fit Stretch Chino Trouser', 'Spring 2026', 'Pants', TRUE),
    ('STY-DENIM-900', 'Uniqlo LifeWear', 'Classic Trucker Denim Jacket', 'Summer 2026', 'Jacket', TRUE)
ON CONFLICT (style_no) DO UPDATE
SET buyer = EXCLUDED.buyer, description = EXCLUDED.description, product_type = EXCLUDED.product_type;

-- 2. Seed Rich Production Orders
INSERT INTO orders (order_no, buyer, style_id, color, order_date, delivery_date, status, total_quantity)
VALUES
    ('PO-NIKE-POLO-800', 'Nike Sportswear', (SELECT id FROM styles WHERE style_no = 'STY-POLO-800' LIMIT 1), 'Midnight Navy', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '25 days', 'IN_PRODUCTION', 800),
    ('PO-HM-HOODIE-550', 'H&M Casuals', (SELECT id FROM styles WHERE style_no = 'STY-HOODIE-550' LIMIT 1), 'Heather Grey', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '35 days', 'PLANNED', 550),
    ('PO-LEVIS-CHINO-620', 'Levi Strauss & Co', (SELECT id FROM styles WHERE style_no = 'STY-CHINO-620' LIMIT 1), 'Khaki Tan', CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE + INTERVAL '20 days', 'PLANNED', 620),
    ('PO-UNIQLO-DENIM-900', 'Uniqlo LifeWear', (SELECT id FROM styles WHERE style_no = 'STY-DENIM-900' LIMIT 1), 'Vintage Indigo', CURRENT_DATE, CURRENT_DATE + INTERVAL '45 days', 'PLANNED', 900)
ON CONFLICT (order_no) DO UPDATE
SET status = EXCLUDED.status, total_quantity = EXCLUDED.total_quantity;

-- 3. Populate Order Size Lines
DO $$
DECLARE
    v_order_polo BIGINT;
    v_order_hoodie BIGINT;
    v_order_chino BIGINT;
    v_s_id BIGINT;
    v_m_id BIGINT;
    v_l_id BIGINT;
    v_xl_id BIGINT;
BEGIN
    SELECT id INTO v_order_polo FROM orders WHERE order_no = 'PO-NIKE-POLO-800' LIMIT 1;
    SELECT id INTO v_order_hoodie FROM orders WHERE order_no = 'PO-HM-HOODIE-550' LIMIT 1;
    SELECT id INTO v_order_chino FROM orders WHERE order_no = 'PO-LEVIS-CHINO-620' LIMIT 1;

    SELECT id INTO v_s_id FROM sizes WHERE code = 'S' LIMIT 1;
    SELECT id INTO v_m_id FROM sizes WHERE code = 'M' LIMIT 1;
    SELECT id INTO v_l_id FROM sizes WHERE code = 'L' LIMIT 1;
    SELECT id INTO v_xl_id FROM sizes WHERE code = 'XL' LIMIT 1;

    IF v_order_polo IS NOT NULL THEN
        DELETE FROM order_size_lines WHERE order_id = v_order_polo;
        INSERT INTO order_size_lines (order_id, size_id, quantity)
        VALUES (v_order_polo, v_s_id, 150), (v_order_polo, v_m_id, 300), (v_order_polo, v_l_id, 250), (v_order_polo, v_xl_id, 100);
    END IF;

    IF v_order_hoodie IS NOT NULL THEN
        DELETE FROM order_size_lines WHERE order_id = v_order_hoodie;
        INSERT INTO order_size_lines (order_id, size_id, quantity)
        VALUES (v_order_hoodie, v_s_id, 100), (v_order_hoodie, v_m_id, 200), (v_order_hoodie, v_l_id, 150), (v_order_hoodie, v_xl_id, 100);
    END IF;

    IF v_order_chino IS NOT NULL THEN
        DELETE FROM order_size_lines WHERE order_id = v_order_chino;
        INSERT INTO order_size_lines (order_id, size_id, quantity)
        VALUES (v_order_chino, v_s_id, 120), (v_order_chino, v_m_id, 220), (v_order_chino, v_l_id, 180), (v_order_chino, v_xl_id, 100);
    END IF;
END $$;

-- 4. Seed Comprehensive Operation Bulletin (OB-POLO-800)
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
    SELECT id INTO v_style_id FROM styles WHERE style_no = 'STY-POLO-800' LIMIT 1;
    SELECT id INTO v_op1 FROM operations WHERE name = 'Collar Make & Trim' OR operation_code = 'OP-003' LIMIT 1;
    SELECT id INTO v_op2 FROM operations WHERE name = 'Placket Attach' OR operation_code = 'OP-005' LIMIT 1;
    SELECT id INTO v_op3 FROM operations WHERE name = 'Shoulder Join' OR operation_code = 'OP-001' LIMIT 1;
    SELECT id INTO v_op4 FROM operations WHERE name = 'Sleeve Attach Left' OR operation_code = 'OP-004' LIMIT 1;
    SELECT id INTO v_op5 FROM operations WHERE name = 'Bottom Hem' OR operation_code = 'OP-007' LIMIT 1;

    DELETE FROM operation_bulletins WHERE bulletin_code = 'OB-POLO-800';

    INSERT INTO operation_bulletins (bulletin_code, name, description, version, status, total_smv)
    VALUES ('OB-POLO-800', 'Nike Dri-FIT Polo Standard Operation Bulletin', 'Benchmark high-efficiency operation sequence for polo production', 1, 'PUBLISHED', 4.25)
    RETURNING id INTO v_bulletin_id;

    IF v_style_id IS NOT NULL THEN
        INSERT INTO bulletin_styles (bulletin_id, style_id) VALUES (v_bulletin_id, v_style_id) ON CONFLICT DO NOTHING;
    END IF;

    IF v_op1 IS NOT NULL AND v_op2 IS NOT NULL AND v_op3 IS NOT NULL AND v_op4 IS NOT NULL AND v_op5 IS NOT NULL THEN
        INSERT INTO bulletin_lines (bulletin_id, sequence, operation_id, smv, machine_type, skill_rating_required, notes)
        VALUES
            (v_bulletin_id, 1, v_op1, 0.85, 'Single Needle Lockstitch', 4, 'Prep collar point with fusing'),
            (v_bulletin_id, 2, v_op2, 0.95, 'Single Needle Lockstitch', 5, 'Crucial symmetry on front box placket'),
            (v_bulletin_id, 3, v_op3, 0.45, 'Overlock 4-Thread', 3, 'Reinforced mobilon tape on shoulder seam'),
            (v_bulletin_id, 4, v_op4, 0.80, 'Overlock 4-Thread', 4, 'Match notches on armhole sleeve join'),
            (v_bulletin_id, 5, v_op5, 1.20, 'Flatlock / Coverstitch', 4, 'Side vent finish & bottom double stitch hem');
    END IF;
END $$;

-- 5. Seed Additional Factory Operators
INSERT INTO operators (employee_id, name, age, gender, department, role, joining_date, active)
VALUES
    ('EMP-2008', 'Kavita Sundaram', 27, 'Female', 'Sewing', 'OPERATOR',        CURRENT_DATE - INTERVAL '4 years', TRUE),
    ('EMP-2009', 'Vikramaditya Rao', 34, 'Male',   'Sewing', 'LINE_SUPERVISOR', CURRENT_DATE - INTERVAL '6 years', TRUE),
    ('EMP-2010', 'Meera Krishnan',   25, 'Female', 'Sewing', 'OPERATOR',        CURRENT_DATE - INTERVAL '2 years', TRUE),
    ('EMP-2011', 'Arjun Sengupta',   30, 'Male',   'Sewing', 'OPERATOR',        CURRENT_DATE - INTERVAL '3 years', TRUE),
    ('EMP-2012', 'Pooja Deshmukh',   23, 'Female', 'Sewing', 'HELPER',          CURRENT_DATE - INTERVAL '1 year',  TRUE),
    ('EMP-2013', 'Mohanlal Meena',   36, 'Male',   'Sewing', 'QUALITY_CHECKER', CURRENT_DATE - INTERVAL '5 years', TRUE),
    ('EMP-2014', 'Sunita Mahajan',   29, 'Female', 'Sewing', 'FLOATER',         CURRENT_DATE - INTERVAL '3 years', TRUE),
    ('EMP-2015', 'Rohan Kulkarni',   24, 'Male',   'Sewing', 'OPERATOR',        CURRENT_DATE - INTERVAL '18 months', TRUE)
ON CONFLICT (employee_id) DO UPDATE
SET active = TRUE, name = EXCLUDED.name, department = 'Sewing', role = EXCLUDED.role;

-- 6. Ensure Dynamic TODAY Attendance for all active operators
DO $$
DECLARE
    v_shift_id BIGINT;
    v_op RECORD;
    v_counter INT := 0;
BEGIN
    SELECT id INTO v_shift_id FROM shifts ORDER BY id LIMIT 1;

    IF v_shift_id IS NOT NULL THEN
        FOR v_op IN SELECT id FROM operators WHERE active = TRUE LOOP
            v_counter := v_counter + 1;
            
            -- Insert or update attendance for CURRENT_DATE
            INSERT INTO attendance_records (attendance_date, operator_id, shift_id, status, check_in_time, check_out_time, remarks)
            VALUES (
                CURRENT_DATE,
                v_op.id,
                v_shift_id,
                CASE 
                    WHEN v_counter % 11 = 0 THEN 'ON_LEAVE'
                    WHEN v_counter % 7 = 0  THEN 'LATE'
                    ELSE 'PRESENT'
                END,
                CASE 
                    WHEN v_counter % 7 = 0 THEN '08:45:00'::TIME 
                    ELSE '08:00:00'::TIME 
                END,
                '17:00:00'::TIME,
                'Verified on biometric floor check'
            )
            ON CONFLICT (attendance_date, operator_id, shift_id) DO UPDATE
            SET status = EXCLUDED.status, check_in_time = EXCLUDED.check_in_time;
        END LOOP;
    END IF;
END $$;

-- 7. Seed Active Planned Line (Line 01 - T-Shirt Balancing Demo)
DO $$
DECLARE
    v_order_id BIGINT;
    v_shift_id BIGINT;
    v_line_id BIGINT;
    v_plan_id BIGINT;
    v_bline1 BIGINT;
    v_bline2 BIGINT;
    v_bline3 BIGINT;
    v_bline4 BIGINT;
    v_bline5 BIGINT;
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
BEGIN
    SELECT id INTO v_order_id FROM orders WHERE order_no = 'PO-TSHIRT-480' LIMIT 1;
    SELECT id INTO v_shift_id FROM shifts ORDER BY id LIMIT 1;
    SELECT id INTO v_line_id FROM sewing_lines WHERE line_code = 'LINE-01' LIMIT 1;

    SELECT id INTO v_emp1 FROM operators WHERE employee_id = 'EMP-2001' LIMIT 1;
    SELECT id INTO v_emp2 FROM operators WHERE employee_id = 'EMP-2002' LIMIT 1;
    SELECT id INTO v_emp3 FROM operators WHERE employee_id = 'EMP-2003' LIMIT 1;
    SELECT id INTO v_emp4 FROM operators WHERE employee_id = 'EMP-2004' LIMIT 1;
    SELECT id INTO v_emp5 FROM operators WHERE employee_id = 'EMP-2005' LIMIT 1;
    SELECT id INTO v_emp6 FROM operators WHERE employee_id = 'EMP-2006' LIMIT 1;

    SELECT id INTO v_op1 FROM operations WHERE name = 'Shoulder Join' OR operation_code = 'OP-001' LIMIT 1;
    SELECT id INTO v_op2 FROM operations WHERE name = 'Sleeve Attach Left' OR operation_code = 'OP-004' LIMIT 1;
    SELECT id INTO v_op3 FROM operations WHERE name = 'Side Seam Close' OR operation_code = 'OP-006' LIMIT 1;
    SELECT id INTO v_op4 FROM operations WHERE name = 'Bottom Hem' OR operation_code = 'OP-007' LIMIT 1;
    SELECT id INTO v_op5 FROM operations WHERE name = 'Neck Rib Attach' OR operation_code = 'OP-002' LIMIT 1;

    SELECT id INTO v_bline1 FROM bulletin_lines WHERE sequence = 1 AND smv = 0.40 LIMIT 1;
    SELECT id INTO v_bline2 FROM bulletin_lines WHERE sequence = 2 AND smv = 0.75 LIMIT 1;
    SELECT id INTO v_bline3 FROM bulletin_lines WHERE sequence = 3 AND smv = 0.50 LIMIT 1;
    SELECT id INTO v_bline4 FROM bulletin_lines WHERE sequence = 4 AND smv = 1.20 LIMIT 1;
    SELECT id INTO v_bline5 FROM bulletin_lines WHERE sequence = 5 AND smv = 0.65 LIMIT 1;

    IF v_order_id IS NOT NULL AND v_shift_id IS NOT NULL AND v_line_id IS NOT NULL THEN
        -- Check if plan exists or create
        SELECT id INTO v_plan_id FROM line_plans WHERE order_id = v_order_id AND shift_id = v_shift_id LIMIT 1;

        IF v_plan_id IS NULL THEN
            INSERT INTO line_plans (order_id, shift_id, line_id, target_output, allowance, status, allowance_pfd)
            VALUES (v_order_id, v_shift_id, v_line_id, 480, 10, 'approved', '5,4,1')
            RETURNING id INTO v_plan_id;
        ELSE
            UPDATE line_plans SET line_id = v_line_id, status = 'approved' WHERE id = v_plan_id;
        END IF;

        -- Clean and insert full line assignments
        DELETE FROM line_plan_assignments WHERE line_plan_id = v_plan_id;

        IF v_bline1 IS NOT NULL AND v_op1 IS NOT NULL THEN
            INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
            VALUES (v_plan_id, v_bline1, v_op1, v_emp1);
        END IF;

        IF v_bline2 IS NOT NULL AND v_op2 IS NOT NULL THEN
            INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
            VALUES (v_plan_id, v_bline2, v_op2, v_emp2);
        END IF;

        IF v_bline3 IS NOT NULL AND v_op3 IS NOT NULL THEN
            INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
            VALUES (v_plan_id, v_bline3, v_op3, v_emp6);
        END IF;

        IF v_bline4 IS NOT NULL AND v_op4 IS NOT NULL THEN
            -- Bottleneck with 2 operators sharing load
            INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
            VALUES 
                (v_plan_id, v_bline4, v_op4, v_emp3),
                (v_plan_id, v_bline4, v_op4, v_emp4);
        END IF;

        IF v_bline5 IS NOT NULL AND v_op5 IS NOT NULL THEN
            INSERT INTO line_plan_assignments (line_plan_id, bulletin_line_id, operation_id, operator_id)
            VALUES (v_plan_id, v_bline5, v_op5, v_emp5);
        END IF;
    END IF;
END $$;
