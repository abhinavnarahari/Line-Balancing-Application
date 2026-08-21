-- V7: Create skill_assessments table
-- Core Swing Skill Matrix: maps Operator + Operation + Skill Rating + Cycle Time.
-- CRITICAL: Historical revisions must be preserved (never silently overwritten).
-- is_current=TRUE means this is the latest revision for that operator+operation pair.

CREATE TABLE IF NOT EXISTS skill_assessments (
    id                  BIGSERIAL       PRIMARY KEY,
    operator_id         BIGINT          NOT NULL,
    operation_id        BIGINT          NOT NULL,
    rating              INTEGER        NOT NULL CHECK (rating BETWEEN 1 AND 5),
    cycle_time_seconds  INTEGER         NOT NULL CHECK (cycle_time_seconds > 0),
    revision            INTEGER        NOT NULL DEFAULT 1,
    effective_date      DATE            NOT NULL,
    is_current          BOOLEAN         NOT NULL DEFAULT TRUE,
    notes               TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_skill_operator  FOREIGN KEY (operator_id)  REFERENCES operators(id),
    CONSTRAINT fk_skill_operation FOREIGN KEY (operation_id) REFERENCES operations(id)
);

-- Only one current revision per operator+operation
CREATE UNIQUE INDEX uq_skill_current
    ON skill_assessments(operator_id, operation_id)
    WHERE is_current = TRUE;

CREATE INDEX idx_skill_operator_id  ON skill_assessments(operator_id);
CREATE INDEX idx_skill_operation_id ON skill_assessments(operation_id);
CREATE INDEX idx_skill_is_current   ON skill_assessments(is_current);

COMMENT ON TABLE skill_assessments IS 'Swing Skill Matrix with revision history. Never delete — always insert new revision and mark old as is_current=FALSE.';
COMMENT ON COLUMN skill_assessments.rating IS '1=Beginner, 2=Basic, 3=Standard, 4=Good, 5=Expert.';
COMMENT ON COLUMN skill_assessments.cycle_time_seconds IS 'Time in seconds to complete one unit of this operation.';
COMMENT ON COLUMN skill_assessments.is_current IS 'TRUE for the latest revision only. Enforced by partial unique index.';
