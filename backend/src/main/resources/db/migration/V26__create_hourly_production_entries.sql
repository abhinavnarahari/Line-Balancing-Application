-- V26: Hourly Operation-Level Production Tracking
-- Tracks actual output per operation per operator per shift-hour

CREATE TABLE IF NOT EXISTS hourly_production_entries (
    id                  BIGSERIAL       PRIMARY KEY,
    line_plan_id        BIGINT          NOT NULL,
    operation_id        BIGINT          NOT NULL,
    operator_id         BIGINT          NOT NULL,
    log_date            DATE            NOT NULL DEFAULT CURRENT_DATE,
    shift_hour          INTEGER         NOT NULL CHECK (shift_hour BETWEEN 1 AND 12),
    hour_start_time     TIME,                            -- e.g. 07:00
    hour_end_time       TIME,                            -- e.g. 08:00
    target_qty          INTEGER         NOT NULL DEFAULT 0,
    actual_qty          INTEGER         NOT NULL DEFAULT 0,
    good_qty            INTEGER         NOT NULL DEFAULT 0,
    reject_qty          INTEGER         NOT NULL DEFAULT 0,
    sam_minutes         NUMERIC(8,4)    NOT NULL DEFAULT 0.35,
    notes               TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_hpe_line_plan  FOREIGN KEY (line_plan_id)  REFERENCES line_plans(id)  ON DELETE CASCADE,
    CONSTRAINT fk_hpe_operation  FOREIGN KEY (operation_id)  REFERENCES operations(id)  ON DELETE CASCADE,
    CONSTRAINT fk_hpe_operator   FOREIGN KEY (operator_id)   REFERENCES operators(id)   ON DELETE CASCADE,

    -- One entry per (line_plan, operation, operator, date, hour)
    CONSTRAINT uq_hpe_key UNIQUE (line_plan_id, operation_id, operator_id, log_date, shift_hour)
);

CREATE INDEX idx_hpe_line_plan_date ON hourly_production_entries(line_plan_id, log_date);
CREATE INDEX idx_hpe_operation_date ON hourly_production_entries(operation_id, log_date);
CREATE INDEX idx_hpe_operator_date  ON hourly_production_entries(operator_id, log_date);
