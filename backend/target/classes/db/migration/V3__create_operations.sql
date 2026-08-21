-- V3: Create operations table
-- The Operation Master: 18 sewing operations from Line balancing.xlsx

CREATE TABLE IF NOT EXISTS operations (
    id              BIGSERIAL       PRIMARY KEY,
    operation_code  VARCHAR(20)     NOT NULL,
    name            VARCHAR(150)    NOT NULL,
    description     TEXT,
    sequence        INTEGER        NOT NULL DEFAULT 0,
    active          BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_operations_code UNIQUE (operation_code),
    CONSTRAINT uq_operations_name UNIQUE (name)
);

CREATE INDEX idx_operations_active ON operations(active);
CREATE INDEX idx_operations_sequence ON operations(sequence);

COMMENT ON TABLE operations IS 'Operation master: each row is a distinct sewing operation (e.g., Shoulder Join, Bottom Hem).';
COMMENT ON COLUMN operations.operation_code IS 'Unique code, e.g. OP-001. Used as SAP reference key.';
COMMENT ON COLUMN operations.sequence IS 'Default display/processing order.';
