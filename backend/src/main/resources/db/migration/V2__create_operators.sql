-- V2: Create operators table
-- Stores all sewing/swing operators on the factory floor.
-- Current shift is NOT stored here — use shift_assignments for that.

CREATE TABLE IF NOT EXISTS operators (
    id              BIGSERIAL       PRIMARY KEY,
    employee_id     VARCHAR(30)     NOT NULL,
    name            VARCHAR(150)    NOT NULL,
    age             INTEGER        NOT NULL CHECK (age >= 16 AND age <= 70),
    gender          VARCHAR(10)     NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    department      VARCHAR(100)    NOT NULL,
    joining_date    DATE            NOT NULL,
    active          BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_operators_employee_id UNIQUE (employee_id)
);

CREATE INDEX idx_operators_active ON operators(active);
CREATE INDEX idx_operators_department ON operators(department);
CREATE INDEX idx_operators_name ON operators USING gin(to_tsvector('english', name));

COMMENT ON TABLE operators IS 'Sewing/Swing operators on the factory floor. Shift is tracked via shift_assignments.';
COMMENT ON COLUMN operators.employee_id IS 'Unique business employee identifier, e.g. EMP-1001';
