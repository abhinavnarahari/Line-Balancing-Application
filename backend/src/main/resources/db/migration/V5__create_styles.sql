-- V5: Create styles table
-- Style Master: garments manufactured by the factory.
-- One style can be referenced by multiple orders and operation bulletins.

CREATE TABLE IF NOT EXISTS styles (
    id              BIGSERIAL       PRIMARY KEY,
    style_no        VARCHAR(50)     NOT NULL,
    buyer           VARCHAR(150)    NOT NULL,
    description     TEXT,
    season          VARCHAR(50),
    product_type    VARCHAR(100),
    active          BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_styles_style_no UNIQUE (style_no)
);

CREATE INDEX idx_styles_active ON styles(active);
CREATE INDEX idx_styles_buyer ON styles(buyer);

COMMENT ON TABLE styles IS 'Style master — each row is a garment style produced by the factory.';
COMMENT ON COLUMN styles.style_no IS 'Unique business style number, e.g. TS-1001.';
