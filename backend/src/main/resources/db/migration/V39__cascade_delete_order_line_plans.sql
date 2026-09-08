-- Migration V39: Enable ON DELETE CASCADE for line_plans referencing orders
ALTER TABLE line_plans DROP CONSTRAINT IF EXISTS fk_line_plan_order;
ALTER TABLE line_plans 
    ADD CONSTRAINT fk_line_plan_order 
    FOREIGN KEY (order_id) 
    REFERENCES orders(id) 
    ON DELETE CASCADE;
