-- V29: Create sewing_lines table
-- Physical sewing lines in the apparel factory floor

CREATE TABLE IF NOT EXISTS sewing_lines (
    id                          BIGSERIAL       PRIMARY KEY,
    line_code                   VARCHAR(30)     NOT NULL,
    line_name                   VARCHAR(100)    NOT NULL,
    floor                       VARCHAR(50),
    supervisor_name             VARCHAR(150),
    total_workstations          INTEGER         NOT NULL DEFAULT 20 CHECK (total_workstations > 0),
    target_efficiency_percent   NUMERIC(5, 2)   NOT NULL DEFAULT 85.00 CHECK (target_efficiency_percent BETWEEN 0 AND 100),
    active                      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_sewing_lines_code UNIQUE (line_code)
);

CREATE INDEX idx_sewing_lines_active ON sewing_lines(active);

-- Seed realistic factory sewing lines
INSERT INTO sewing_lines (line_code, line_name, floor, supervisor_name, total_workstations, target_efficiency_percent, active)
VALUES 
('LINE-01', 'Line 01 - Polo & T-Shirt', 'Floor 1 - Section A', 'Rahim Khan', 22, 85.00, true),
('LINE-02', 'Line 02 - Knit Tops', 'Floor 1 - Section B', 'Farhana Begum', 20, 82.50, true),
('LINE-03', 'Line 03 - Woven Shirts', 'Floor 2 - Section A', 'Kabir Hossain', 26, 80.00, true),
('LINE-04', 'Line 04 - Denim & Bottoms', 'Floor 2 - Section B', 'Sultan Ahmed', 28, 78.00, true)
ON CONFLICT (line_code) DO NOTHING;
