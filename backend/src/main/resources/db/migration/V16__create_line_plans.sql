-- V16: Create line_plans and line_plan_assignments tables

CREATE TABLE IF NOT EXISTS line_plans (
    id              BIGSERIAL       PRIMARY KEY,
    order_id        BIGINT          NOT NULL,
    shift_id        BIGINT          NOT NULL,
    target_output   INTEGER         NOT NULL,
    allowance       INTEGER         NOT NULL DEFAULT 10,
    status          VARCHAR(50)     NOT NULL DEFAULT 'draft',
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_line_plan_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_line_plan_shift FOREIGN KEY (shift_id) REFERENCES shifts(id)
);

CREATE TABLE IF NOT EXISTS line_plan_assignments (
    id                  BIGSERIAL       PRIMARY KEY,
    line_plan_id        BIGINT          NOT NULL,
    bulletin_line_id    BIGINT          NOT NULL,
    operation_id        BIGINT          NOT NULL,
    operator_id         BIGINT,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_assignment_plan FOREIGN KEY (line_plan_id) REFERENCES line_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_bulletin_line FOREIGN KEY (bulletin_line_id) REFERENCES bulletin_lines(id),
    CONSTRAINT fk_assignment_operation FOREIGN KEY (operation_id) REFERENCES operations(id),
    CONSTRAINT fk_assignment_operator FOREIGN KEY (operator_id) REFERENCES operators(id)
);

CREATE INDEX idx_line_plan_order_id ON line_plans(order_id);
CREATE INDEX idx_line_plan_assignment_plan_id ON line_plan_assignments(line_plan_id);
