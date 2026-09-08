-- V25: Add standard_smv column to operations table
-- SAM (Standard Allowed Minutes per piece) for each sewing operation

ALTER TABLE operations ADD COLUMN IF NOT EXISTS standard_smv NUMERIC(8, 4);

COMMENT ON COLUMN operations.standard_smv IS 'SAM: Standard Allowed Minutes per piece. Used to calculate hourly target and operator efficiency.';

-- Seed realistic SAM values for existing operations (industry standard garment SAMs)
UPDATE operations SET standard_smv = CASE
    WHEN name ILIKE '%shoulder%'      THEN 0.48
    WHEN name ILIKE '%side seam%'     THEN 0.35
    WHEN name ILIKE '%collar%'        THEN 0.55
    WHEN name ILIKE '%sleeve%'        THEN 0.42
    WHEN name ILIKE '%cuff%'          THEN 0.38
    WHEN name ILIKE '%hem%'           THEN 0.30
    WHEN name ILIKE '%pocket%'        THEN 0.52
    WHEN name ILIKE '%button%'        THEN 0.25
    WHEN name ILIKE '%zip%' OR name ILIKE '%zipper%' THEN 0.60
    WHEN name ILIKE '%bartack%'       THEN 0.10
    WHEN name ILIKE '%overlock%'      THEN 0.28
    WHEN name ILIKE '%flat seam%'     THEN 0.45
    ELSE 0.35
END
WHERE standard_smv IS NULL;
