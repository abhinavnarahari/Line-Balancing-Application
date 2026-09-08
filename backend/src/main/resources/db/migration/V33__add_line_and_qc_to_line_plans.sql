-- V33: Add line_id, allowance_pfd, and is_qc_checkpoint to line plans
ALTER TABLE line_plans ADD COLUMN IF NOT EXISTS line_id BIGINT REFERENCES sewing_lines(id) ON DELETE SET NULL;
ALTER TABLE line_plans ADD COLUMN IF NOT EXISTS allowance_pfd VARCHAR(100) DEFAULT '5,4,1';

ALTER TABLE bulletin_lines ADD COLUMN IF NOT EXISTS is_qc_checkpoint BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE line_plan_assignments ADD COLUMN IF NOT EXISTS is_qc_checkpoint BOOLEAN NOT NULL DEFAULT FALSE;

-- Set default line for existing plans
DO $$
DECLARE
    v_line_id BIGINT;
BEGIN
    SELECT id INTO v_line_id FROM sewing_lines ORDER BY id LIMIT 1;
    IF v_line_id IS NOT NULL THEN
        UPDATE line_plans SET line_id = v_line_id WHERE line_id IS NULL;
    END IF;
END $$;
