-- ==============================================================================
-- V42: Seed Comprehensive Skill Matrix for ALL 50 Factory Operators (EMP-001 to EMP-050)
-- Generates realistic cycle times, multi-skilling, and 1-5 star ratings across all 18 operations
-- ==============================================================================

DO $$
DECLARE
    v_op RECORD;
    v_oper RECORD;
    v_op_count INT := 0;
    v_rating INT;
    v_cycle_time INT;
    v_base_sam INT;
    v_notes TEXT;
BEGIN
    -- 1. Clear previous skill assessments for EMP-001 to EMP-050 to ensure clean fresh matrix
    DELETE FROM skill_assessments 
    WHERE operator_id IN (SELECT id FROM operators WHERE employee_id LIKE 'EMP-%');

    -- 2. Populate skill matrix for all 50 operators based on department & role
    FOR v_oper IN SELECT id, employee_id, name, department, role FROM operators WHERE employee_id LIKE 'EMP-%' AND active = TRUE ORDER BY employee_id ASC LOOP
        
        -- Loop over operations and assign skills realistically
        FOR v_op IN SELECT id, operation_code, name, standard_smv FROM operations ORDER BY sequence ASC LOOP
            
            -- Base benchmark cycle time in seconds (standard_smv * 60 or fallback)
            v_base_sam := COALESCE(ROUND(v_op.standard_smv * 60), 30);
            IF v_base_sam <= 0 THEN v_base_sam := 30; END IF;

            -- Determine if this operator is skilled in this operation
            IF v_oper.department LIKE 'Sewing%' THEN
                -- Sewing operators: skilled in operations OP-001 through OP-009, OP-010, OP-012
                IF v_op.operation_code IN ('OP-001', 'OP-002', 'OP-003', 'OP-004', 'OP-005', 'OP-006', 'OP-007', 'OP-008', 'OP-009') THEN
                    -- Generate rating (3, 4, or 5 for their core sewing skills)
                    v_rating := 3 + ((v_oper.id + v_op.id) % 3); -- Produces 3, 4, or 5
                    IF v_oper.role = 'LINE_SUPERVISOR' OR v_oper.role = 'FLOATER' THEN 
                        v_rating := 4 + ((v_oper.id + v_op.id) % 2); -- 4 or 5 for supervisors/floaters
                    END IF;

                    -- Cycle time inversely proportional to rating
                    v_cycle_time := CASE v_rating
                        WHEN 5 THEN ROUND(v_base_sam * 0.90) -- Expert (faster than standard)
                        WHEN 4 THEN ROUND(v_base_sam * 1.00) -- Good (standard pace)
                        WHEN 3 THEN ROUND(v_base_sam * 1.15) -- Standard
                        WHEN 2 THEN ROUND(v_base_sam * 1.35) -- Basic
                        ELSE ROUND(v_base_sam * 1.50)
                    END;

                    v_notes := CASE v_rating
                        WHEN 5 THEN 'Grade A+ Certified - High efficiency & zero defect record'
                        WHEN 4 THEN 'Grade A Certified - Consistent target cycle time'
                        ELSE 'Grade B Certified - Standard operating procedure qualified'
                    END;

                    INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
                    VALUES (v_oper.id, v_op.id, v_rating, v_cycle_time, 1, CURRENT_DATE - INTERVAL '14 days', TRUE, v_notes);

                ELSIF (v_oper.id % 4 = 0) AND v_op.operation_code IN ('OP-010', 'OP-011', 'OP-012') THEN
                    -- Multi-skill secondary cross-training for some sewing operators
                    v_rating := 3 + ((v_oper.id) % 2);
                    v_cycle_time := ROUND(v_base_sam * 1.05);
                    INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
                    VALUES (v_oper.id, v_op.id, v_rating, v_cycle_time, 1, CURRENT_DATE - INTERVAL '30 days', TRUE, 'Cross-trained secondary station');
                END IF;

            ELSIF v_oper.department = 'Quality Control' THEN
                -- QC Inspectors: expert in inspection, trimming, measurements
                IF v_op.operation_code IN ('OP-010', 'OP-012', 'OP-014', 'OP-015') THEN
                    v_rating := 4 + ((v_oper.id + v_op.id) % 2); -- 4 or 5
                    v_cycle_time := CASE v_rating
                        WHEN 5 THEN ROUND(v_base_sam * 0.90)
                        ELSE ROUND(v_base_sam * 1.00)
                    END;

                    INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
                    VALUES (v_oper.id, v_op.id, v_rating, v_cycle_time, 1, CURRENT_DATE - INTERVAL '10 days', TRUE, 'Certified QA/QC Inspector');
                END IF;

            ELSIF v_oper.department IN ('Finishing', 'Packing') THEN
                -- Finishing and Packing operators: skilled in folding, packing, trimming, spot cleaning
                IF v_op.operation_code IN ('OP-011', 'OP-013', 'OP-016', 'OP-017', 'OP-018', 'OP-009') THEN
                    v_rating := 3 + ((v_oper.id + v_op.id) % 3);
                    v_cycle_time := CASE v_rating
                        WHEN 5 THEN ROUND(v_base_sam * 0.90)
                        WHEN 4 THEN ROUND(v_base_sam * 1.00)
                        ELSE ROUND(v_base_sam * 1.15)
                    END;

                    INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
                    VALUES (v_oper.id, v_op.id, v_rating, v_cycle_time, 1, CURRENT_DATE - INTERVAL '20 days', TRUE, 'Finishing & Packaging Certified');
                END IF;

            ELSE
                -- General operators: baseline skills
                IF v_op.operation_code IN ('OP-001', 'OP-006', 'OP-007', 'OP-016', 'OP-017') THEN
                    v_rating := 3 + ((v_oper.id) % 3);
                    v_cycle_time := ROUND(v_base_sam * 1.10);
                    INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes)
                    VALUES (v_oper.id, v_op.id, v_rating, v_cycle_time, 1, CURRENT_DATE - INTERVAL '15 days', TRUE, 'Standard Operator Certified');
                END IF;
            END IF;

        END LOOP;
    END LOOP;
END $$;
