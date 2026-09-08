-- V24: Create piece_production_logs table and sample seed data
CREATE TABLE IF NOT EXISTS piece_production_logs (
    id                      BIGSERIAL       PRIMARY KEY,
    operator_id             BIGINT          NOT NULL,
    operation_id            BIGINT,
    operation_name          VARCHAR(150),
    order_id                BIGINT,
    target_qty              INTEGER         NOT NULL DEFAULT 0,
    completed_qty           INTEGER         NOT NULL DEFAULT 0,
    good_qty                INTEGER         NOT NULL DEFAULT 0,
    reject_qty              INTEGER         NOT NULL DEFAULT 0,
    start_time              TIME            NOT NULL,
    end_time                TIME            NOT NULL,
    actual_time_minutes     NUMERIC(8, 2)   NOT NULL DEFAULT 0,
    sam_minutes             NUMERIC(8, 4)   NOT NULL DEFAULT 0.35,
    machine_code            VARCHAR(100),
    log_date                DATE            NOT NULL DEFAULT CURRENT_DATE,
    hour_slot               INTEGER         NOT NULL DEFAULT 0 CHECK (hour_slot BETWEEN 0 AND 23),
    notes                   TEXT,
    created_at              TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ppl_operator  FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE CASCADE,
    CONSTRAINT fk_ppl_operation FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE SET NULL,
    CONSTRAINT fk_ppl_order     FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_ppl_operator_date ON piece_production_logs(operator_id, log_date);
CREATE INDEX idx_ppl_log_date ON piece_production_logs(log_date);
CREATE INDEX idx_ppl_hour_slot ON piece_production_logs(hour_slot);

-- Seed sample piece log matching the prompt specification (OP1025 / EMP-1201 on Side Seam)
DO $$
DECLARE
    v_op_id BIGINT;
    v_operation_id BIGINT;
    v_order_id BIGINT;
BEGIN
    SELECT id INTO v_op_id FROM operators WHERE employee_id IN ('EMP-1201', 'OP1025') OR id = 52 LIMIT 1;
    IF v_op_id IS NULL THEN
        SELECT id INTO v_op_id FROM operators LIMIT 1;
    END IF;

    SELECT id INTO v_operation_id FROM operations WHERE name ILIKE '%Side Seam%' OR operation_code = 'OP-005' LIMIT 1;
    IF v_operation_id IS NULL THEN
        SELECT id INTO v_operation_id FROM operations LIMIT 1;
    END IF;

    SELECT id INTO v_order_id FROM orders LIMIT 1;

    IF v_op_id IS NOT NULL THEN
        INSERT INTO piece_production_logs (
            operator_id, operation_id, operation_name, order_id,
            target_qty, completed_qty, good_qty, reject_qty,
            start_time, end_time, actual_time_minutes, sam_minutes,
            machine_code, log_date, hour_slot, notes
        ) VALUES (
            v_op_id, v_operation_id, 'Side Seam', v_order_id,
            50, 50, 48, 2,
            '10:05:00', '10:32:00', 27.00, 0.3500,
            'M-023', CURRENT_DATE, 10, 'Side seam piece bundle run'
        );
    END IF;
END $$;
