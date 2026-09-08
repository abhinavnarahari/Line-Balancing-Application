-- V31: Add break_duration_minutes to shifts
-- Standard apparel factories schedule lunch (30-45m) and tea breaks (15m)

ALTER TABLE shifts ADD COLUMN IF NOT EXISTS break_duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (break_duration_minutes >= 0);

COMMENT ON COLUMN shifts.break_duration_minutes IS 'Total scheduled break time in minutes (lunch + tea breaks). Deducted from gross shift duration.';

-- Set default break times for existing shifts
UPDATE shifts SET break_duration_minutes = 60 WHERE break_duration_minutes IS NULL OR break_duration_minutes = 0;
