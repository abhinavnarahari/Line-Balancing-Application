-- V10: Create operation_bulletins, bulletin_lines, bulletin_styles tables
-- Operation Bulletin: defines the operation sequence and SMV for a style.
-- ONE BULLETIN CAN BE ATTACHED TO MULTIPLE STYLES (many-to-many via bulletin_styles).
-- total_smv is auto-calculated = SUM(bulletin_lines.smv).

CREATE TABLE IF NOT EXISTS operation_bulletins (
    id              BIGSERIAL       PRIMARY KEY,
    bulletin_code   VARCHAR(50)     NOT NULL,
    name            VARCHAR(200)    NOT NULL,
    description     TEXT,
    version         INTEGER        NOT NULL DEFAULT 1,
    status          VARCHAR(20)     NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    effective_from  DATE,
    effective_to    DATE,
    total_smv       NUMERIC(10, 4)  NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_bulletins_code_version UNIQUE (bulletin_code, version)
);

CREATE INDEX idx_bulletins_status ON operation_bulletins(status);

COMMENT ON TABLE operation_bulletins IS 'Operation Bulletin header. One bulletin can be linked to multiple styles via bulletin_styles.';
COMMENT ON COLUMN operation_bulletins.total_smv IS 'Sum of all bulletin_lines.smv. Updated by application.';
COMMENT ON COLUMN operation_bulletins.status IS 'DRAFT=in-progress, PUBLISHED=in-use, ARCHIVED=retired.';

-- Junction table: bulletin ↔ style (many-to-many)
CREATE TABLE IF NOT EXISTS bulletin_styles (
    bulletin_id BIGINT  NOT NULL,
    style_id    BIGINT  NOT NULL,

    PRIMARY KEY (bulletin_id, style_id),
    CONSTRAINT fk_bs_bulletin FOREIGN KEY (bulletin_id) REFERENCES operation_bulletins(id) ON DELETE CASCADE,
    CONSTRAINT fk_bs_style    FOREIGN KEY (style_id)    REFERENCES styles(id)
);

CREATE INDEX idx_bs_style_id ON bulletin_styles(style_id);

COMMENT ON TABLE bulletin_styles IS 'Many-to-many: one bulletin can be attached to multiple styles.';

-- Bulletin operation lines
CREATE TABLE IF NOT EXISTS bulletin_lines (
    id                      BIGSERIAL       PRIMARY KEY,
    bulletin_id             BIGINT          NOT NULL,
    sequence                INTEGER        NOT NULL,
    operation_id            BIGINT          NOT NULL,
    smv                     NUMERIC(10, 4)  NOT NULL CHECK (smv >= 0),
    machine_type            VARCHAR(100),
    skill_rating_required   INTEGER        CHECK (skill_rating_required BETWEEN 1 AND 5),
    notes                   TEXT,

    CONSTRAINT fk_bl_bulletin   FOREIGN KEY (bulletin_id)   REFERENCES operation_bulletins(id) ON DELETE CASCADE,
    CONSTRAINT fk_bl_operation  FOREIGN KEY (operation_id)  REFERENCES operations(id),
    CONSTRAINT uq_bl_bulletin_seq UNIQUE (bulletin_id, sequence)
);

CREATE INDEX idx_bl_bulletin_id  ON bulletin_lines(bulletin_id);
CREATE INDEX idx_bl_sequence     ON bulletin_lines(bulletin_id, sequence);

COMMENT ON TABLE bulletin_lines IS 'Individual operation lines within an Operation Bulletin.';
COMMENT ON COLUMN bulletin_lines.smv IS 'Standard Minute Value for this operation in this bulletin.';
COMMENT ON COLUMN bulletin_lines.skill_rating_required IS 'Minimum skill rating (1-5) needed to perform this operation.';
