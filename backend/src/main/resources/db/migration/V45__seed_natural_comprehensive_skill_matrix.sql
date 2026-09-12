-- ==============================================================================
-- V45: Complete Natural Skill Matrix Coverage for ALL 50 Factory Operators
-- Seeds natural, bell-curve distributed ratings (1 to 5 stars) across all 18 operations
-- ==============================================================================

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

            v_is_over := v_op.operation_code IN ('OP-001', 'OP-002', 'OP-004', 'OP-005', 'OP-006');
            v_is_lock := v_op.operation_code IN ('OP-003', 'OP-009');
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
                IF (v_emp_num % 3 = 0 AND v_is_over) OR (v_emp_num % 3 = 1 AND v_is_lock) OR (v_emp_num % 3 = 2 AND v_is_flock) THEN
                    -- Primary Machine Specialty
                    IF v_hash < 35 THEN v_rating := 5; ELSIF v_hash < 75 THEN v_rating := 4; ELSE v_rating := 3; END IF;
                ELSIF v_is_sewing_op THEN
                    -- Secondary Cross-Machine Skill
                    IF v_hash < 25 THEN v_rating := 4; ELSIF v_hash < 65 THEN v_rating := 3; ELSE v_rating := 2; END IF;
                ELSIF v_op.operation_code IN ('OP-010', 'OP-011', 'OP-012') THEN
                    IF v_hash < 40 THEN v_rating := 3; ELSE v_rating := 2; END IF;
                ELSE
                    IF v_hash < 30 THEN v_rating := 3; ELSIF v_hash < 70 THEN v_rating := 2; ELSE v_rating := 1; END IF;
                END IF;
            END IF;

            -- Calculate calibrated cycle time
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

            v_eff_date := CURRENT_DATE - (( (v_emp_num + v_op_num) % 60 ) || ' days')::INTERVAL;

            -- Insert if not already present or update existing current record
            IF EXISTS (SELECT 1 FROM skill_assessments WHERE operator_id = v_oper.id AND operation_id = v_op.id AND is_current = TRUE) THEN
                UPDATE skill_assessments 
                SET rating = v_rating, cycle_time_seconds = v_cycle_time, notes = v_notes, effective_date = v_eff_date
                WHERE operator_id = v_oper.id AND operation_id = v_op.id AND is_current = TRUE;
            ELSE
                INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
                VALUES (v_oper.id, v_op.id, v_rating, v_cycle_time, 1, v_eff_date, TRUE, v_notes);
            END IF;

        END LOOP;
    END LOOP;
END $$;
