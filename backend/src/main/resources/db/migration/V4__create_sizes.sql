-- V4: Create sizes table
-- Configurable size master (XS, S, M, L, XL, XXL etc.)
-- Sizes must NOT be hardcoded in application logic.

CREATE TABLE IF NOT EXISTS sizes (
    id          BIGSERIAL       PRIMARY KEY,
    code        VARCHAR(10)     NOT NULL,
    label       VARCHAR(50)     NOT NULL,
    sequence    INTEGER        NOT NULL DEFAULT 0,
    active      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_sizes_code UNIQUE (code)
);

CREATE INDEX idx_sizes_active ON sizes(active);
CREATE INDEX idx_sizes_sequence ON sizes(sequence);

COMMENT ON TABLE sizes IS 'Configurable garment size master. Referenced by orders for size-wise quantity breakdown.';
