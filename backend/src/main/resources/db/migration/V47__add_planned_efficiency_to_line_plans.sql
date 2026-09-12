-- V47: Add planned_efficiency column to line_plans table
ALTER TABLE line_plans ADD COLUMN IF NOT EXISTS planned_efficiency DOUBLE PRECISION DEFAULT 80.00;
UPDATE line_plans SET planned_efficiency = 80.00 WHERE planned_efficiency IS NULL;
