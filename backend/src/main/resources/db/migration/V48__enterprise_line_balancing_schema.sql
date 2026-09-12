-- V48: Enterprise Garment Industrial Engineering Schema Extensions
-- Adds formal revision tracking, capacity plans, line designs, workstations, operator station placements, and optimization recommendations.

-- 1. Extend operation_bulletins for formal engineering revisions & sign-offs
ALTER TABLE operation_bulletins ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1;
ALTER TABLE operation_bulletins ADD COLUMN IF NOT EXISTS parent_bulletin_id BIGINT REFERENCES operation_bulletins(id) ON DELETE SET NULL;
ALTER TABLE operation_bulletins ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);
ALTER TABLE operation_bulletins ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE operation_bulletins ADD COLUMN IF NOT EXISTS released_by VARCHAR(100);
ALTER TABLE operation_bulletins ADD COLUMN IF NOT EXISTS released_at TIMESTAMP;

-- Relax status check on operation_bulletins to support enterprise lifecycle
ALTER TABLE operation_bulletins DROP CONSTRAINT IF EXISTS operation_bulletins_status_check;
ALTER TABLE operation_bulletins ADD CONSTRAINT operation_bulletins_status_check 
    CHECK (status IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'RELEASED', 'PUBLISHED', 'ARCHIVED', 'OBSOLETE'));

-- 2. Extend bulletin_lines with garment engineering attributes
ALTER TABLE bulletin_lines ADD COLUMN IF NOT EXISTS section VARCHAR(50) DEFAULT 'MAIN_ASSEMBLY';
ALTER TABLE bulletin_lines ADD COLUMN IF NOT EXISTS predecessor_ids VARCHAR(255);
ALTER TABLE bulletin_lines ADD COLUMN IF NOT EXISTS is_parallelizable BOOLEAN DEFAULT TRUE;
ALTER TABLE bulletin_lines ADD COLUMN IF NOT EXISTS split_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE bulletin_lines ADD COLUMN IF NOT EXISTS split_type VARCHAR(50) DEFAULT 'NONE';
ALTER TABLE bulletin_lines ADD COLUMN IF NOT EXISTS stitch_type VARCHAR(100);
ALTER TABLE bulletin_lines ADD COLUMN IF NOT EXISTS seam_type VARCHAR(100);
ALTER TABLE bulletin_lines ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(100);

-- 3. Create capacity_plans table
CREATE TABLE IF NOT EXISTS capacity_plans (
    id                          BIGSERIAL PRIMARY KEY,
    plan_code                   VARCHAR(50) NOT NULL UNIQUE,
    order_id                    BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    style_id                    BIGINT REFERENCES styles(id) ON DELETE SET NULL,
    bulletin_id                 BIGINT REFERENCES operation_bulletins(id) ON DELETE SET NULL,
    shift_id                    BIGINT REFERENCES shifts(id) ON DELETE SET NULL,
    order_quantity              INTEGER NOT NULL,
    available_days              INTEGER NOT NULL DEFAULT 1,
    target_hourly_output        INTEGER NOT NULL,
    planned_efficiency          DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    allowance_pfd               VARCHAR(50) DEFAULT '5,4,1',
    total_smv_minutes           DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    customer_takt_secs          DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    required_design_capacity    DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    designed_pitch_secs         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    theoretical_manpower        DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    planned_manpower            DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    status                      VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capacity_plans_order_id ON capacity_plans(order_id);
CREATE INDEX IF NOT EXISTS idx_capacity_plans_bulletin_id ON capacity_plans(bulletin_id);

-- 4. Create line_designs table
CREATE TABLE IF NOT EXISTS line_designs (
    id                          BIGSERIAL PRIMARY KEY,
    design_code                 VARCHAR(50) NOT NULL UNIQUE,
    capacity_plan_id            BIGINT REFERENCES capacity_plans(id) ON DELETE SET NULL,
    order_id                    BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    bulletin_id                 BIGINT REFERENCES operation_bulletins(id) ON DELETE SET NULL,
    line_id                     BIGINT REFERENCES sewing_lines(id) ON DELETE SET NULL,
    shift_id                    BIGINT REFERENCES shifts(id) ON DELETE SET NULL,
    total_workstations          INTEGER NOT NULL DEFAULT 1,
    total_operators             INTEGER NOT NULL DEFAULT 1,
    total_helpers               INTEGER NOT NULL DEFAULT 0,
    total_qc                    INTEGER NOT NULL DEFAULT 0,
    total_machines              INTEGER NOT NULL DEFAULT 0,
    target_hourly_output        INTEGER NOT NULL,
    planned_efficiency          DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    designed_pitch_secs         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    line_balance_efficiency     DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    status                      VARCHAR(50) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'BALANCED', 'APPROVED', 'RELEASED', 'ACTIVE', 'CLOSED')),
    version                     INTEGER NOT NULL DEFAULT 1,
    created_by                  VARCHAR(100),
    approved_by                 VARCHAR(100),
    released_by                 VARCHAR(100),
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_designs_line_id ON line_designs(line_id);
CREATE INDEX IF NOT EXISTS idx_line_designs_order_id ON line_designs(order_id);
CREATE INDEX IF NOT EXISTS idx_line_designs_status ON line_designs(status);

-- 5. Create line_design_machines table (Required vs Available Machine Planning)
CREATE TABLE IF NOT EXISTS line_design_machines (
    id                          BIGSERIAL PRIMARY KEY,
    line_design_id              BIGINT NOT NULL REFERENCES line_designs(id) ON DELETE CASCADE,
    machine_type                VARCHAR(100) NOT NULL,
    required_qty                INTEGER NOT NULL DEFAULT 1,
    available_qty               INTEGER NOT NULL DEFAULT 0,
    notes                       VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_ldm_design_id ON line_design_machines(line_design_id);

-- 6. Create balance_workstations table (Discrete Physical / Logical Workstations S01, S02...)
CREATE TABLE IF NOT EXISTS balance_workstations (
    id                          BIGSERIAL PRIMARY KEY,
    line_design_id              BIGINT NOT NULL REFERENCES line_designs(id) ON DELETE CASCADE,
    station_index               INTEGER NOT NULL,
    station_code                VARCHAR(20) NOT NULL,
    primary_machine_type        VARCHAR(100),
    allocated_operators         INTEGER NOT NULL DEFAULT 1,
    effective_time_secs         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    capacity_per_hour           DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    workload_percent            DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    is_bottleneck               BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_bw_design_station UNIQUE (line_design_id, station_index)
);

CREATE INDEX IF NOT EXISTS idx_bw_design_id ON balance_workstations(line_design_id);

-- 7. Create balance_station_operations table (Operations mapped to Workstations)
CREATE TABLE IF NOT EXISTS balance_station_operations (
    id                          BIGSERIAL PRIMARY KEY,
    balance_workstation_id      BIGINT NOT NULL REFERENCES balance_workstations(id) ON DELETE CASCADE,
    operation_id                BIGINT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    bulletin_line_id            BIGINT REFERENCES bulletin_lines(id) ON DELETE SET NULL,
    sequence                    INTEGER NOT NULL DEFAULT 1,
    operation_smv               DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    machine_type                VARCHAR(100),
    is_split                    BOOLEAN NOT NULL DEFAULT FALSE,
    split_ratio                 DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    is_qc_checkpoint            BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_bso_station_id ON balance_station_operations(balance_workstation_id);

-- 8. Create operator_station_placements table
CREATE TABLE IF NOT EXISTS operator_station_placements (
    id                          BIGSERIAL PRIMARY KEY,
    line_design_id              BIGINT NOT NULL REFERENCES line_designs(id) ON DELETE CASCADE,
    balance_workstation_id      BIGINT NOT NULL REFERENCES balance_workstations(id) ON DELETE CASCADE,
    operator_id                 BIGINT REFERENCES operators(id) ON DELETE SET NULL,
    required_skill_level        INTEGER DEFAULT 3,
    actual_skill_level          INTEGER,
    match_status                VARCHAR(50) NOT NULL DEFAULT 'MATCH'
        CHECK (match_status IN ('EXCELLENT', 'MATCH', 'GAP', 'TRAINING_REQUIRED', 'UNASSIGNED')),
    notes                       VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_osp_design_id ON operator_station_placements(line_design_id);
CREATE INDEX IF NOT EXISTS idx_osp_operator_id ON operator_station_placements(operator_id);

-- 9. Create optimization_recommendations table (Transparent Optimization Suggestions)
CREATE TABLE IF NOT EXISTS optimization_recommendations (
    id                          BIGSERIAL PRIMARY KEY,
    line_design_id              BIGINT NOT NULL REFERENCES line_designs(id) ON DELETE CASCADE,
    balance_workstation_id      BIGINT REFERENCES balance_workstations(id) ON DELETE CASCADE,
    strategy_type               VARCHAR(50) NOT NULL
        CHECK (strategy_type IN ('PARALLEL_OP', 'SPLIT_OPERATION', 'OPERATOR_SWAP', 'MACHINE_UPGRADE', 'COMBINE_STATIONS')),
    title                       VARCHAR(200) NOT NULL,
    reason                      TEXT NOT NULL,
    current_cycle_time_secs     DOUBLE PRECISION,
    projected_cycle_time_secs   DOUBLE PRECISION,
    projected_capacity_per_hour DOUBLE PRECISION,
    status                      VARCHAR(50) NOT NULL DEFAULT 'PROPOSED'
        CHECK (status IN ('PROPOSED', 'ACCEPTED', 'REJECTED')),
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opt_rec_design_id ON optimization_recommendations(line_design_id);
