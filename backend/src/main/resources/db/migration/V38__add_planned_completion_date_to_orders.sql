-- V38: Add planned_completion_date to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS planned_completion_date DATE;

-- Populate existing records so planned_completion_date defaults to delivery_date
UPDATE orders 
SET planned_completion_date = delivery_date 
WHERE planned_completion_date IS NULL;

-- Sample demonstration: set planned completion date for PO-TSHIRT-480 to 20 Sep 2026
UPDATE orders
SET planned_completion_date = '2026-09-20'
WHERE order_no ILIKE '%TSHIRT%' OR order_no ILIKE '%PO-TSHIRT-480%';

