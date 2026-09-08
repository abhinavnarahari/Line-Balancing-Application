-- V32: Add role to operators table
-- Identifies operator specialization on the garment line (Operator, Helper, Floater, Line Supervisor, QC)

ALTER TABLE operators ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'OPERATOR';

-- Update sample roles for realistic floor distribution
UPDATE operators SET role = 'LINE_SUPERVISOR' WHERE employee_id IN ('EMP-1001', 'EMP-1002');
UPDATE operators SET role = 'QUALITY_CHECKER' WHERE employee_id IN ('EMP-1003', 'EMP-1004');
UPDATE operators SET role = 'FLOATER' WHERE employee_id IN ('EMP-1005', 'EMP-1006', 'EMP-1007');
UPDATE operators SET role = 'HELPER' WHERE employee_id IN ('EMP-1008', 'EMP-1009', 'EMP-1010');
