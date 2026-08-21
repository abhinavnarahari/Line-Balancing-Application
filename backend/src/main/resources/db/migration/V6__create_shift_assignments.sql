-- V6: Create shift_assignments table
-- Temporal shift assignment: tracks WHEN each operator is on which shift.
-- An operator can have a history of shift assignments over time.
-- Business rule: no overlapping active assignments for the same operator.

CREATE TABLE IF NOT EXISTS shift_assignments (
    id              BIGSERIAL       PRIMARY KEY,
    operator_id     BIGINT          NOT NULL,
    shift_id        BIGINT          NOT NULL,
    effective_from  DATE            NOT NULL,
    effective_to    DATE,                               -- NULL means currently active
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'SCHEDULED', 'COMPLETED')),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_sa_operator FOREIGN KEY (operator_id) REFERENCES operators(id),
    CONSTRAINT fk_sa_shift    FOREIGN KEY (shift_id)    REFERENCES shifts(id),
    CONSTRAINT chk_sa_dates   CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX idx_sa_operator_id ON shift_assignments(operator_id);
CREATE INDEX idx_sa_shift_id    ON shift_assignments(shift_id);
CREATE INDEX idx_sa_status      ON shift_assignments(status);
CREATE INDEX idx_sa_operator_active ON shift_assignments(operator_id, effective_to)
    WHERE effective_to IS NULL;

COMMENT ON TABLE shift_assignments IS 'Temporal shift assignment history per operator. effective_to=NULL means currently active.';
COMMENT ON COLUMN shift_assignments.effective_to IS 'NULL = currently active with no end date. Business rule: one NULL per operator at a time.';
