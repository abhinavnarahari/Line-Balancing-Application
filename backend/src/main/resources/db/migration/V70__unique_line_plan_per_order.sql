-- V70: One line plan per order. All code paths assume it (findFirstByOrderIdOrderByIdAsc), and concurrent
-- "find or create" saves could previously create a second plan for the same order.
-- Guarded: if an environment already contains duplicates, the index is skipped with a WARNING instead of
-- blocking application start-up (no data is deleted). Resolve duplicates, then create the index manually.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM line_plans WHERE order_id IS NOT NULL GROUP BY order_id HAVING COUNT(*) > 1) THEN
        RAISE WARNING 'line_plans contains more than one plan for some orders; uq_line_plans_order was NOT created.';
    ELSE
        CREATE UNIQUE INDEX IF NOT EXISTS uq_line_plans_order ON line_plans (order_id) WHERE order_id IS NOT NULL;
    END IF;
END $$;
