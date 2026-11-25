-- V78: an order is either SINGLE_COLOR (one colour, several sizes) or MULTI_COLOR (several colours, each with sizes).
-- Each size line now carries its colour; orders.color stays as the colour (single) or a summary (multi).
-- Non-destructive: existing orders become SINGLE_COLOR and their lines take the order's colour.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) NOT NULL DEFAULT 'SINGLE_COLOR';
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_type_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_type_check CHECK (order_type IN ('SINGLE_COLOR', 'MULTI_COLOR'));

ALTER TABLE order_size_lines ADD COLUMN IF NOT EXISTS color VARCHAR(100);
UPDATE order_size_lines l SET color = o.color FROM orders o WHERE o.id = l.order_id AND l.color IS NULL;
ALTER TABLE order_size_lines ALTER COLUMN color SET NOT NULL;

-- A size can now appear once per colour
ALTER TABLE order_size_lines DROP CONSTRAINT IF EXISTS uq_osl_order_size;
ALTER TABLE order_size_lines ADD CONSTRAINT uq_osl_order_color_size UNIQUE (order_id, color, size_id);
