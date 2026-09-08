-- V22: Clear existing skill matrix and performance test data for operator Abhinav (EMP-1201) & add details column to audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details VARCHAR(500);

DELETE FROM skill_matrix_history WHERE operator_id IN (SELECT id FROM operators WHERE name ILIKE '%Abhinav%' OR employee_id = 'EMP-1201');
DELETE FROM operator_performance_logs WHERE operator_id IN (SELECT id FROM operators WHERE name ILIKE '%Abhinav%' OR employee_id = 'EMP-1201');
DELETE FROM skill_assessments WHERE operator_id IN (SELECT id FROM operators WHERE name ILIKE '%Abhinav%' OR employee_id = 'EMP-1201');
