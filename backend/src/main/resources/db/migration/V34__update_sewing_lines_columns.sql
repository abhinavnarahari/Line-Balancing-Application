-- V34: Update sewing_lines table columns
-- Add No. of Operators, No. of Machines, Working Hours, Capacity/Day and drop total_workstations

ALTER TABLE sewing_lines 
    ADD COLUMN IF NOT EXISTS operator_count INTEGER NOT NULL DEFAULT 20 CHECK (operator_count > 0),
    ADD COLUMN IF NOT EXISTS machine_count INTEGER NOT NULL DEFAULT 22 CHECK (machine_count > 0),
    ADD COLUMN IF NOT EXISTS working_hours NUMERIC(4, 2) NOT NULL DEFAULT 8.00 CHECK (working_hours > 0),
    ADD COLUMN IF NOT EXISTS capacity_per_day INTEGER NOT NULL DEFAULT 1000 CHECK (capacity_per_day > 0);

-- Populate existing sample lines with accurate industrial metrics
UPDATE sewing_lines 
SET operator_count = 22, machine_count = 24, working_hours = 8.00, capacity_per_day = 1200
WHERE line_code = 'LINE-01';

UPDATE sewing_lines 
SET operator_count = 20, machine_count = 22, working_hours = 8.00, capacity_per_day = 1000
WHERE line_code = 'LINE-02';

UPDATE sewing_lines 
SET operator_count = 26, machine_count = 28, working_hours = 8.00, capacity_per_day = 900
WHERE line_code = 'LINE-03';

UPDATE sewing_lines 
SET operator_count = 28, machine_count = 30, working_hours = 8.00, capacity_per_day = 850
WHERE line_code = 'LINE-04';

-- Drop total_workstations column
ALTER TABLE sewing_lines DROP COLUMN IF EXISTS total_workstations;
