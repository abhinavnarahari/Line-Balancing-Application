-- V72: Production history must never disappear as a side effect of deleting master data.
-- Previously deleting an operator or operation silently cascaded into piece production logs and
-- hourly production entries. Switch those foreign keys to RESTRICT (constraint change only; no data changes).
-- Line plan -> hourly entries keeps CASCADE: plans can only be deleted for orders without production (OrderService).

ALTER TABLE piece_production_logs DROP CONSTRAINT IF EXISTS fk_ppl_operator;
ALTER TABLE piece_production_logs
    ADD CONSTRAINT fk_ppl_operator FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE RESTRICT;

ALTER TABLE hourly_production_entries DROP CONSTRAINT IF EXISTS fk_hpe_operator;
ALTER TABLE hourly_production_entries
    ADD CONSTRAINT fk_hpe_operator FOREIGN KEY (operator_id) REFERENCES operators(id) ON DELETE RESTRICT;

ALTER TABLE hourly_production_entries DROP CONSTRAINT IF EXISTS fk_hpe_operation;
ALTER TABLE hourly_production_entries
    ADD CONSTRAINT fk_hpe_operation FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE RESTRICT;
