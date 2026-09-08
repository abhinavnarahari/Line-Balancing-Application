-- ==============================================================================
-- V43: Clean all legacy duplicate operators and retain exactly EMP-001 to EMP-050
-- Removes duplicate EMP-1000s, EMP-2000s, and SKIL- placeholder entries
-- ==============================================================================

DO $$
BEGIN
    -- 1. Remove child records referencing non-canonical legacy operators
    DELETE FROM attendance_records 
    WHERE operator_id IN (SELECT id FROM operators WHERE employee_id NOT SIMILAR TO 'EMP-0[0-5][0-9]');

    DELETE FROM skill_assessments 
    WHERE operator_id IN (SELECT id FROM operators WHERE employee_id NOT SIMILAR TO 'EMP-0[0-5][0-9]');

    DELETE FROM line_plan_assignments 
    WHERE operator_id IN (SELECT id FROM operators WHERE employee_id NOT SIMILAR TO 'EMP-0[0-5][0-9]');

    DELETE FROM operator_attachments 
    WHERE operator_id IN (SELECT id FROM operators WHERE employee_id NOT SIMILAR TO 'EMP-0[0-5][0-9]');

    DELETE FROM operator_performance_logs 
    WHERE operator_id IN (SELECT id FROM operators WHERE employee_id NOT SIMILAR TO 'EMP-0[0-5][0-9]');

    DELETE FROM skill_matrix_history 
    WHERE operator_id IN (SELECT id FROM operators WHERE employee_id NOT SIMILAR TO 'EMP-0[0-5][0-9]');

    DELETE FROM shift_assignments 
    WHERE operator_id IN (SELECT id FROM operators WHERE employee_id NOT SIMILAR TO 'EMP-0[0-5][0-9]');

    DELETE FROM piece_production_logs 
    WHERE operator_id IN (SELECT id FROM operators WHERE employee_id NOT SIMILAR TO 'EMP-0[0-5][0-9]');

    DELETE FROM hourly_production_entries 
    WHERE operator_id IN (SELECT id FROM operators WHERE employee_id NOT SIMILAR TO 'EMP-0[0-5][0-9]');

    DELETE FROM notifications 
    WHERE operator_id IN (SELECT id FROM operators WHERE employee_id NOT SIMILAR TO 'EMP-0[0-5][0-9]');

    -- 2. Delete all legacy duplicate operator headers (keeping only EMP-001 to EMP-050)
    DELETE FROM operators 
    WHERE employee_id NOT SIMILAR TO 'EMP-0[0-5][0-9]';

    -- 3. Ensure line plan assignments use the correct canonical EMP-001 to EMP-007 IDs
    UPDATE line_plan_assignments lpa
    SET operator_id = (SELECT id FROM operators WHERE employee_id = 'EMP-001' LIMIT 1)
    WHERE operation_id = (SELECT id FROM operations WHERE operation_code = 'OP-001' LIMIT 1);

    UPDATE line_plan_assignments lpa
    SET operator_id = (SELECT id FROM operators WHERE employee_id = 'EMP-002' LIMIT 1)
    WHERE operation_id = (SELECT id FROM operations WHERE operation_code = 'OP-004' LIMIT 1);

    UPDATE line_plan_assignments lpa
    SET operator_id = (SELECT id FROM operators WHERE employee_id = 'EMP-006' LIMIT 1)
    WHERE operation_id = (SELECT id FROM operations WHERE operation_code = 'OP-006' LIMIT 1);

    UPDATE line_plan_assignments lpa
    SET operator_id = (SELECT id FROM operators WHERE employee_id = 'EMP-005' LIMIT 1)
    WHERE operation_id = (SELECT id FROM operations WHERE operation_code = 'OP-002' LIMIT 1);

END $$;
