-- V71: Indexes for foreign keys used in joins, filters and cascaded deletes that had none.
CREATE INDEX IF NOT EXISTS idx_ppl_order_id          ON piece_production_logs (order_id);
CREATE INDEX IF NOT EXISTS idx_ppl_operation_id      ON piece_production_logs (operation_id);
CREATE INDEX IF NOT EXISTS idx_lpa_operator_id       ON line_plan_assignments (operator_id);
CREATE INDEX IF NOT EXISTS idx_lpa_operation_id      ON line_plan_assignments (operation_id);
CREATE INDEX IF NOT EXISTS idx_lpa_bulletin_line_id  ON line_plan_assignments (bulletin_line_id);
CREATE INDEX IF NOT EXISTS idx_line_plans_line_id    ON line_plans (line_id);
CREATE INDEX IF NOT EXISTS idx_line_plans_shift_id   ON line_plans (shift_id);
