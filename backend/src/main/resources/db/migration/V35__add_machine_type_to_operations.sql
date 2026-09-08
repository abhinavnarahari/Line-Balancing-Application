-- V35: Add machine_type to operations table
-- Allows assigning and attaching standard sewing machinery to operations

ALTER TABLE operations ADD COLUMN IF NOT EXISTS machine_type VARCHAR(100);

COMMENT ON COLUMN operations.machine_type IS 'Required sewing machine type for this operation (e.g. Single Needle Lockstitch, 4-Thread Overlock, Flatlock).';

-- Seed standard garment industry machinery mappings for existing operations
UPDATE operations SET machine_type = CASE
    WHEN operation_code = 'OP-001' OR LOWER(name) LIKE '%shoulder%' THEN '4-Thread Overlock'
    WHEN operation_code = 'OP-002' OR LOWER(name) LIKE '%neck rib%' THEN '4-Thread Overlock'
    WHEN operation_code = 'OP-003' OR LOWER(name) LIKE '%neck top%' OR LOWER(name) LIKE '%top stitch%' THEN 'Single Needle Lockstitch'
    WHEN operation_code = 'OP-004' OR LOWER(name) LIKE '%sleeve attach left%' THEN '4-Thread Overlock'
    WHEN operation_code = 'OP-005' OR LOWER(name) LIKE '%sleeve attach right%' OR LOWER(name) LIKE '%sleeve attach%' THEN '4-Thread Overlock'
    WHEN operation_code = 'OP-006' OR LOWER(name) LIKE '%side seam%' THEN '4-Thread Overlock'
    WHEN operation_code = 'OP-007' OR LOWER(name) LIKE '%bottom hem%' THEN 'Flatlock / Interlock'
    WHEN operation_code = 'OP-008' OR LOWER(name) LIKE '%sleeve hem%' THEN 'Flatlock / Interlock'
    WHEN operation_code = 'OP-009' OR LOWER(name) LIKE '%label attach%' OR LOWER(name) LIKE '%label%' THEN 'Single Needle Lockstitch'
    WHEN operation_code = 'OP-010' OR LOWER(name) LIKE '%trim check%' THEN 'Manual / Trim Station'
    WHEN operation_code = 'OP-011' OR LOWER(name) LIKE '%thread trimming%' THEN 'Manual / Trim Station'
    WHEN operation_code = 'OP-012' OR LOWER(name) LIKE '%initial inspection%' THEN 'Inspection Table'
    WHEN operation_code = 'OP-013' OR LOWER(name) LIKE '%spot cleaning%' THEN 'Cleaning Gun / Station'
    WHEN operation_code = 'OP-014' OR LOWER(name) LIKE '%measurement%' THEN 'Measurement Table'
    WHEN operation_code = 'OP-015' OR LOWER(name) LIKE '%final inspection%' THEN 'Inspection Table'
    WHEN operation_code = 'OP-016' OR LOWER(name) LIKE '%folding%' THEN 'Manual / Folding Table'
    WHEN operation_code = 'OP-017' OR LOWER(name) LIKE '%poly bag%' OR LOWER(name) LIKE '%bag packing%' THEN 'Manual / Packing Table'
    WHEN operation_code = 'OP-018' OR LOWER(name) LIKE '%carton%' THEN 'Manual / Carton Station'
    ELSE 'Single Needle Lockstitch'
END
WHERE machine_type IS NULL;
