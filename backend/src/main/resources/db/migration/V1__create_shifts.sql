-- V1: Create shifts table
-- Stores configurable production shifts (A, B, C, General)
-- Overnight shifts supported: if end_time < start_time, the shift crosses midnight

CREATE TABLE IF NOT EXISTS shifts (
    id          BIGSERIAL       PRIMARY KEY,
    shift_code  VARCHAR(20)     NOT NULL,
    shift_name  VARCHAR(100)    NOT NULL,
    start_time  TIME            NOT NULL,
    end_time    TIME            NOT NULL,
    active      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_shifts_code UNIQUE (shift_code)
);

CREATE INDEX idx_shifts_active ON shifts(active);

COMMENT ON TABLE shifts IS 'Configurable production shifts. Overnight shifts supported (end_time < start_time means next-day end).';
COMMENT ON COLUMN shifts.shift_code IS 'Unique business code: A, B, C, GENERAL etc.';
