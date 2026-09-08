-- ==============================================================================
-- V41: Standardize 50 Active Factory Operators with Sequential EMP-001 to EMP-050 IDs
-- Ensures consistent sequential employee IDs, departments, roles, skill matrix, and attendance
-- ==============================================================================

-- 0. Normalize any existing legacy roles to standard enums
UPDATE operators SET role = 'OPERATOR' WHERE role IS NULL OR role NOT IN ('OPERATOR', 'HELPER', 'FLOATER', 'LINE_SUPERVISOR', 'QUALITY_CHECKER');

-- 1. Upsert exactly 50 standardized operators (EMP-001 to EMP-050)
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
ON CONFLICT (employee_id) DO UPDATE
SET name = EXCLUDED.name, age = EXCLUDED.age, gender = EXCLUDED.gender, 
    department = EXCLUDED.department, role = EXCLUDED.role, active = EXCLUDED.active;

-- 2. Link EMP-001 through EMP-007 to Line Plans & Assessments
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

    SELECT id INTO v_emp1 FROM operators WHERE employee_id = 'EMP-001' LIMIT 1;
    SELECT id INTO v_emp2 FROM operators WHERE employee_id = 'EMP-002' LIMIT 1;
    SELECT id INTO v_emp3 FROM operators WHERE employee_id = 'EMP-003' LIMIT 1;
    SELECT id INTO v_emp4 FROM operators WHERE employee_id = 'EMP-004' LIMIT 1;
    SELECT id INTO v_emp5 FROM operators WHERE employee_id = 'EMP-005' LIMIT 1;
    SELECT id INTO v_emp6 FROM operators WHERE employee_id = 'EMP-006' LIMIT 1;
    SELECT id INTO v_emp7 FROM operators WHERE employee_id = 'EMP-007' LIMIT 1;

    -- Update line plan assignments to use the clean sequential IDs
    IF v_emp1 IS NOT NULL AND v_op1 IS NOT NULL THEN
        UPDATE line_plan_assignments SET operator_id = v_emp1 WHERE operation_id = v_op1;
    END IF;
    IF v_emp2 IS NOT NULL AND v_op2 IS NOT NULL THEN
        UPDATE line_plan_assignments SET operator_id = v_emp2 WHERE operation_id = v_op2;
    END IF;
    IF v_emp6 IS NOT NULL AND v_op3 IS NOT NULL THEN
        UPDATE line_plan_assignments SET operator_id = v_emp6 WHERE operation_id = v_op3;
    END IF;

    -- Ensure Skill Matrix assessments for EMP-001 to EMP-007
    IF v_emp1 IS NOT NULL AND v_op1 IS NOT NULL THEN
        INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
        VALUES (v_emp1, v_op1, 5, 24, 1, CURRENT_DATE, TRUE, 'Top performer shoulder join')
        ON CONFLICT DO NOTHING;
    END IF;
    IF v_emp2 IS NOT NULL AND v_op2 IS NOT NULL THEN
        INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
        VALUES (v_emp2, v_op2, 5, 45, 1, CURRENT_DATE, TRUE, 'Sleeve attachment specialist')
        ON CONFLICT DO NOTHING;
    END IF;
    IF v_emp3 IS NOT NULL AND v_op4 IS NOT NULL THEN
        INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
        VALUES (v_emp3, v_op4, 4, 72, 1, CURRENT_DATE, TRUE, 'Flatlock precision folder')
        ON CONFLICT DO NOTHING;
    END IF;
    IF v_emp4 IS NOT NULL AND v_op4 IS NOT NULL THEN
        INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
        VALUES (v_emp4, v_op4, 5, 70, 1, CURRENT_DATE, TRUE, 'Zero puckering flatlock')
        ON CONFLICT DO NOTHING;
    END IF;
    IF v_emp5 IS NOT NULL AND v_op5 IS NOT NULL THEN
        INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
        VALUES (v_emp5, v_op5, 5, 39, 1, CURRENT_DATE, TRUE, 'Neck rib tension balance')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 3. Ensure Today Biometric Attendance for all 50 operators
DO $$
DECLARE
    v_shift_id BIGINT;
    v_op RECORD;
    v_counter INT := 0;
BEGIN
    SELECT id INTO v_shift_id FROM shifts ORDER BY id LIMIT 1;

    IF v_shift_id IS NOT NULL THEN
        FOR v_op IN SELECT id FROM operators WHERE employee_id LIKE 'EMP-%' AND active = TRUE LOOP
            v_counter := v_counter + 1;
            INSERT INTO attendance_records (attendance_date, operator_id, shift_id, status, check_in_time, check_out_time, remarks)
            VALUES (
                CURRENT_DATE,
                v_op.id,
                v_shift_id,
                CASE 
                    WHEN v_counter % 12 = 0 THEN 'ON_LEAVE'
                    WHEN v_counter % 8 = 0  THEN 'LATE'
                    ELSE 'PRESENT'
                END,
                CASE 
                    WHEN v_counter % 8 = 0 THEN '08:40:00'::TIME 
                    ELSE '08:00:00'::TIME 
                END,
                '17:00:00'::TIME,
                'Biometric floor punch-in'
            )
            ON CONFLICT (attendance_date, operator_id, shift_id) DO UPDATE
            SET status = EXCLUDED.status, check_in_time = EXCLUDED.check_in_time;
        END LOOP;
    END IF;
END $$;
