-- V9: Create orders and order_size_lines tables
-- Order captures a production order (buyer, style, color, size-wise quantities).
-- total_quantity is a persisted computed value = SUM of all order_size_lines.quantity.
-- Business rule: total_quantity must equal sum of size line quantities.

CREATE TABLE IF NOT EXISTS orders (
    id              BIGSERIAL       PRIMARY KEY,
    order_no        VARCHAR(50)     NOT NULL,
    buyer           VARCHAR(150)    NOT NULL,
    style_id        BIGINT          NOT NULL,
    color           VARCHAR(100)    NOT NULL,
    order_date      DATE            NOT NULL,
    delivery_date   DATE            NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PLANNED'
                        CHECK (status IN ('PLANNED', 'IN_PRODUCTION', 'COMPLETED', 'ON_HOLD')),
    total_quantity  INTEGER         NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_orders_order_no UNIQUE (order_no),
    CONSTRAINT fk_orders_style    FOREIGN KEY (style_id) REFERENCES styles(id),
    CONSTRAINT chk_delivery_date  CHECK (delivery_date >= order_date)
);

CREATE INDEX idx_orders_status   ON orders(status);
CREATE INDEX idx_orders_style    ON orders(style_id);
CREATE INDEX idx_orders_buyer    ON orders(buyer);

COMMENT ON TABLE orders IS 'Production order header. Size-wise quantities are in order_size_lines child table.';
COMMENT ON COLUMN orders.total_quantity IS 'Auto-calculated = SUM(order_size_lines.quantity). Updated by application on insert/update.';

-- Child table: size-wise quantity breakdown
CREATE TABLE IF NOT EXISTS order_size_lines (
    id          BIGSERIAL   PRIMARY KEY,
    order_id    BIGINT      NOT NULL,
    size_id     BIGINT      NOT NULL,
    quantity    INTEGER     NOT NULL CHECK (quantity >= 0),

    CONSTRAINT fk_osl_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_osl_size  FOREIGN KEY (size_id)  REFERENCES sizes(id),
    CONSTRAINT uq_osl_order_size UNIQUE (order_id, size_id)
);

CREATE INDEX idx_osl_order_id ON order_size_lines(order_id);

COMMENT ON TABLE order_size_lines IS 'Size-wise quantity breakdown for each order. Cascades delete from parent orders.';
