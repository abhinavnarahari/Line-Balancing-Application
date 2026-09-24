-- V63: Synchronize Operation SMVs with Operation Bulletins, Bulletin Lines, and Capacity Plans
-- Ensures that standard SMVs from Operation Master are the single unified truth across all bulletins and planning modules.

-- 1. Synchronize all bulletin lines SMV from operations master standard_smv
UPDATE bulletin_lines bl
SET smv = op.standard_smv,
    machine_type = COALESCE(op.machine_type, bl.machine_type)
FROM operations op
WHERE bl.operation_id = op.id
  AND op.standard_smv IS NOT NULL;

-- 2. Recalculate total_smv for all operation bulletins
UPDATE operation_bulletins ob
SET total_smv = COALESCE((
    SELECT SUM(bl.smv)
    FROM bulletin_lines bl
    WHERE bl.bulletin_id = ob.id
), ob.total_smv);

-- 3. Synchronize total_smv_minutes in capacity_plans matching bulletins
UPDATE capacity_plans cp
SET total_smv_minutes = ob.total_smv
FROM operation_bulletins ob
WHERE cp.bulletin_id = ob.id
  AND ob.total_smv IS NOT NULL
  AND ob.total_smv > 0;
