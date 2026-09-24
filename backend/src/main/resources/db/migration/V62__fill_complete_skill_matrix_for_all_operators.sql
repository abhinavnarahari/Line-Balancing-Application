-- V62: Fill Comprehensive Skill Matrix for ALL 50 Factory Operators
-- Populates 1 to 5 star ratings and calibrated cycle times across all 18 operations (50 x 18 = 900 skill cells)
-- Also updates operator machine qualifications and skill history logs.

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
    v_notes TEXT;
    v_eff_date DATE;
BEGIN
    -- Loop over all active operators EMP-001 to EMP-050
    FOR v_oper IN SELECT id, employee_id, name, department, role, joining_date FROM operators WHERE active = TRUE ORDER BY id ASC LOOP
        
        -- Extract numeric portion of EMP-XXX
        v_emp_num := CAST(SUBSTRING(v_oper.employee_id FROM 5) AS INT);
        IF v_emp_num IS NULL THEN v_emp_num := CAST(v_oper.id AS INT); END IF;
        
        v_dept := COALESCE(v_oper.department, 'Sewing Line 1');
        v_role := COALESCE(v_oper.role, 'OPERATOR');

        -- Loop over all 18 operations
        FOR v_op IN SELECT id, operation_code, name, standard_smv, sequence FROM operations ORDER BY sequence ASC LOOP
            
            v_op_num := COALESCE(v_op.sequence, 1);
            v_base_sam := COALESCE(ROUND(v_op.standard_smv * 60), 25);
            IF v_base_sam <= 0 THEN v_base_sam := 25; END IF;

            -- Hash seed for deterministic natural variation
            v_hash := ((v_emp_num * 37) + (v_op_num * 19) + (v_oper.id * 7)) % 100;

            v_is_over := v_op.operation_code IN ('OP-001', 'OP-002', 'OP-004', 'OP-005', 'OP-006', 'OP-013', 'OP-014', 'OP-015');
            v_is_lock := v_op.operation_code IN ('OP-003', 'OP-009', 'OP-010', 'OP-011', 'OP-012', 'OP-016', 'OP-017', 'OP-018');
            v_is_flock := v_op.operation_code IN ('OP-007', 'OP-008');
            v_is_sewing_op := (v_is_over OR v_is_lock OR v_is_flock);

            -- Determine natural rating
            IF v_role IN ('LINE_SUPERVISOR', 'FLOATER') THEN
                -- Masters / Floaters: 4 or 5 stars
                IF v_hash < 60 THEN v_rating := 5; ELSE v_rating := 4; END IF;

            ELSIF v_dept = 'Quality Control' OR v_role = 'QUALITY_CHECKER' THEN
                IF v_op.operation_code IN ('OP-010', 'OP-012', 'OP-014', 'OP-015') THEN
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

            ELSIF v_role = 'HELPER' THEN
                IF v_op.operation_code IN ('OP-016', 'OP-017', 'OP-018', 'OP-011') THEN
                    IF v_hash < 50 THEN v_rating := 3; ELSE v_rating := 2; END IF;
                ELSE
                    IF v_hash < 50 THEN v_rating := 2; ELSE v_rating := 1; END IF;
                END IF;

            ELSE
                -- Standard Sewing Line Operators
                IF v_emp_num <= 15 THEN
                    -- Senior Veteran Operators: 4 or 5 in primary, 3-4 in secondary
                    IF (v_emp_num % 3 = 0 AND v_is_over) OR (v_emp_num % 3 = 1 AND v_is_lock) OR (v_emp_num % 3 = 2 AND v_is_flock) THEN
                        IF v_hash < 50 THEN v_rating := 5; ELSE v_rating := 4; END IF;
                    ELSIF v_is_sewing_op THEN
                        IF v_hash < 40 THEN v_rating := 4; ELSE v_rating := 3; END IF;
                    ELSE
                        IF v_hash < 50 THEN v_rating := 3; ELSE v_rating := 2; END IF;
                    END IF;

                ELSIF v_emp_num <= 35 THEN
                    -- Mid-Level Operators: 3 or 4 in primary, 2-3 in secondary
                    IF (v_emp_num % 3 = 0 AND v_is_over) OR (v_emp_num % 3 = 1 AND v_is_lock) OR (v_emp_num % 3 = 2 AND v_is_flock) THEN
                        IF v_hash < 40 THEN v_rating := 4; ELSE v_rating := 3; END IF;
                    ELSIF v_is_sewing_op THEN
                        IF v_hash < 35 THEN v_rating := 3; ELSE v_rating := 2; END IF;
                    ELSE
                        IF v_hash < 40 THEN v_rating := 2; ELSE v_rating := 1; END IF;
                    END IF;

                ELSIF v_emp_num <= 45 THEN
                    -- Junior Operators: 2 or 3 in primary, 1-2 in secondary
                    IF (v_emp_num % 3 = 0 AND v_is_over) OR (v_emp_num % 3 = 1 AND v_is_lock) OR (v_emp_num % 3 = 2 AND v_is_flock) THEN
                        IF v_hash < 60 THEN v_rating := 3; ELSE v_rating := 2; END IF;
                    ELSE
                        IF v_hash < 40 THEN v_rating := 2; ELSE v_rating := 1; END IF;
                    END IF;

                ELSE
                    -- Trainees (EMP-046 to EMP-050): 1 or 2
                    IF v_hash < 50 THEN v_rating := 2; ELSE v_rating := 1; END IF;
                END IF;
            END IF;

            -- Calculate calibrated cycle time in seconds
            v_cycle_time := CASE v_rating
                WHEN 5 THEN ROUND(v_base_sam * 0.82)
                WHEN 4 THEN ROUND(v_base_sam * 0.98)
                WHEN 3 THEN ROUND(v_base_sam * 1.16)
                WHEN 2 THEN ROUND(v_base_sam * 1.40)
                ELSE ROUND(v_base_sam * 1.75)
            END;

            IF v_cycle_time < 5 THEN v_cycle_time := 5; END IF;

            v_notes := CASE v_rating
                WHEN 5 THEN 'Grade A+ Certified — Master technician pace, zero-defect standard'
                WHEN 4 THEN 'Grade A Certified — Consistently meets 100% standard SAM'
                WHEN 3 THEN 'Grade B Certified — Qualified standard production pace'
                WHEN 2 THEN 'Grade C — Developing cross-training; supervised practice'
                ELSE 'Trainee Level — Basic machine setup & orientation'
            END;

            v_eff_date := CURRENT_DATE - (( (v_emp_num + v_op_num) % 45 ) || ' days')::INTERVAL;

            INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes, created_at, updated_at)
            VALUES (v_oper.id, v_op.id, v_rating, v_cycle_time, 1, v_eff_date, TRUE, v_notes, NOW(), NOW());

        END LOOP;
    END LOOP;
END $$;

-- Populate Machine Qualifications (Certifications) for all operators
DELETE FROM operator_machine_qualifications;

INSERT INTO operator_machine_qualifications (operator_id, machine_type, qualification_level, certified_since, experience_months, is_primary_qualification, notes)
SELECT 
    op.id,
    m.machine_type,
    CASE 
        WHEN (CAST(SUBSTRING(op.employee_id FROM 5) AS INT) % 3 = 0 AND m.machine_type = '4-Thread Overlock') THEN 4
        WHEN (CAST(SUBSTRING(op.employee_id FROM 5) AS INT) % 3 = 1 AND m.machine_type = 'Single Needle Lockstitch') THEN 4
        WHEN (CAST(SUBSTRING(op.employee_id FROM 5) AS INT) % 3 = 2 AND m.machine_type = 'Flatlock / Interlock') THEN 4
        WHEN CAST(SUBSTRING(op.employee_id FROM 5) AS INT) <= 15 THEN 3
        WHEN CAST(SUBSTRING(op.employee_id FROM 5) AS INT) <= 35 THEN 2
        ELSE 1
    END,
    CURRENT_DATE - INTERVAL '180 days',
    (CAST(SUBSTRING(op.employee_id FROM 5) AS INT) * 2 + 12),
    CASE 
        WHEN (CAST(SUBSTRING(op.employee_id FROM 5) AS INT) % 3 = 0 AND m.machine_type = '4-Thread Overlock') THEN TRUE
        WHEN (CAST(SUBSTRING(op.employee_id FROM 5) AS INT) % 3 = 1 AND m.machine_type = 'Single Needle Lockstitch') THEN TRUE
        WHEN (CAST(SUBSTRING(op.employee_id FROM 5) AS INT) % 3 = 2 AND m.machine_type = 'Flatlock / Interlock') THEN TRUE
        ELSE FALSE
    END,
    'Certified Industrial Machinery Operator'
FROM operators op
CROSS JOIN (
    SELECT DISTINCT machine_type FROM operations WHERE machine_type IS NOT NULL
) m;
