-- V56: Enterprise Multi-Line Operator Allocation Optimizer Schema
-- Provides tables for Operator Machine Qualifications, Multi-Line Allocation Runs,
-- Assignments, Bottlenecks, Scenarios, and Floor Governance Audit Logs.

DROP TABLE IF EXISTS operator_allocation_audits CASCADE;
DROP TABLE IF EXISTS operator_allocation_scenarios CASCADE;
DROP TABLE IF EXISTS operator_allocation_bottlenecks CASCADE;
DROP TABLE IF EXISTS operator_allocation_assignments CASCADE;
DROP TABLE IF EXISTS operator_allocation_runs CASCADE;
DROP TABLE IF EXISTS operator_machine_qualifications CASCADE;

-- 1. Operator Machine Qualifications (Certifications & Experience)
CREATE TABLE IF NOT EXISTS operator_machine_qualifications (
    id                          BIGSERIAL PRIMARY KEY,
    operator_id                 BIGINT NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    machine_type                VARCHAR(100) NOT NULL,
    qualification_level         INTEGER NOT NULL DEFAULT 3, -- 1=Trainee, 2=Basic, 3=Proficient, 4=Skilled, 5=Expert
    certified_since             DATE,
    experience_months           INTEGER DEFAULT 6,
    is_primary_qualification    BOOLEAN NOT NULL DEFAULT FALSE,
    notes                       VARCHAR(255),
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_omq_operator_machine UNIQUE (operator_id, machine_type)
);

CREATE INDEX IF NOT EXISTS idx_omq_operator_id ON operator_machine_qualifications(operator_id);
CREATE INDEX IF NOT EXISTS idx_omq_machine_type ON operator_machine_qualifications(machine_type);

-- 2. Operator Allocation Runs (Multi-Line Optimization Run Headers)
CREATE TABLE IF NOT EXISTS operator_allocation_runs (
    id                          BIGSERIAL PRIMARY KEY,
    run_code                    VARCHAR(50) NOT NULL UNIQUE,
    planning_date               DATE NOT NULL,
    shift_id                    BIGINT REFERENCES shifts(id) ON DELETE SET NULL,
    plant_location              VARCHAR(100) NOT NULL DEFAULT 'Unit 1 - Main Apparel Complex',
    selected_line_ids           VARCHAR(255) NOT NULL, -- Comma-separated line IDs (e.g. "1,2,3")
    solver_status               VARCHAR(50) NOT NULL DEFAULT 'OPTIMAL', -- OPTIMAL, FEASIBLE, TIME_LIMIT_BEST_FOUND, INFEASIBLE, INVALID_INPUT
    total_selected_lines        INTEGER NOT NULL DEFAULT 0,
    total_available_operators   INTEGER NOT NULL DEFAULT 0,
    total_assigned_operators    INTEGER NOT NULL DEFAULT 0,
    total_unassigned_operators  INTEGER NOT NULL DEFAULT 0,
    total_designed_output       INTEGER NOT NULL DEFAULT 0,
    total_achievable_output     INTEGER NOT NULL DEFAULT 0,
    overall_designed_efficiency DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    overall_achievable_efficiency DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    target_achievement_percent  DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_skill_gaps            INTEGER NOT NULL DEFAULT 0,
    total_machine_gaps          INTEGER NOT NULL DEFAULT 0,
    total_bottleneck_stations   INTEGER NOT NULL DEFAULT 0,
    solver_runtime_ms           BIGINT NOT NULL DEFAULT 0,
    status                      VARCHAR(50) NOT NULL DEFAULT 'OPTIMIZED' -- DRAFT, VALIDATED, OPTIMIZED, IE_REVIEW, APPROVED, APPLIED, ARCHIVED
        CHECK (status IN ('DRAFT', 'VALIDATED', 'OPTIMIZED', 'IE_REVIEW', 'APPROVED', 'APPLIED', 'ARCHIVED')),
    approved_by                 VARCHAR(100),
    approved_at                 TIMESTAMP,
    applied_by                  VARCHAR(100),
    applied_at                  TIMESTAMP,
    created_by                  VARCHAR(100) NOT NULL DEFAULT 'Industrial Engineer',
    notes                       TEXT,
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oar_planning_date ON operator_allocation_runs(planning_date);
CREATE INDEX IF NOT EXISTS idx_oar_status ON operator_allocation_runs(status);

-- 3. Operator Allocation Assignments (Station-Level Operator Placement)
CREATE TABLE IF NOT EXISTS operator_allocation_assignments (
    id                          BIGSERIAL PRIMARY KEY,
    allocation_run_id           BIGINT NOT NULL REFERENCES operator_allocation_runs(id) ON DELETE CASCADE,
    line_id                     BIGINT NOT NULL REFERENCES sewing_lines(id) ON DELETE CASCADE,
    line_design_id              BIGINT REFERENCES line_designs(id) ON DELETE SET NULL,
    station_index               INTEGER NOT NULL,
    station_code                VARCHAR(30) NOT NULL,
    operation_id                BIGINT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    operation_name              VARCHAR(150) NOT NULL,
    bulletin_line_id            BIGINT REFERENCES bulletin_lines(id) ON DELETE SET NULL,
    required_machine_type       VARCHAR(100),
    required_skill_level        INTEGER NOT NULL DEFAULT 3,
    operator_id                 BIGINT REFERENCES operators(id) ON DELETE SET NULL,
    operator_name               VARCHAR(150),
    operator_code               VARCHAR(50),
    assigned_skill_level        INTEGER,
    performance_source          VARCHAR(30) NOT NULL DEFAULT 'CALIBRATED',
    standard_smv                DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    effective_cycle_time_secs   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    operator_efficiency_percent DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    match_status                VARCHAR(50) NOT NULL DEFAULT 'MATCH',
    is_bottleneck               BOOLEAN NOT NULL DEFAULT FALSE,
    is_fixed                    BOOLEAN NOT NULL DEFAULT FALSE,
    notes                       VARCHAR(255),
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE operator_allocation_assignments ADD COLUMN IF NOT EXISTS assigned_skill_level INTEGER;
ALTER TABLE operator_allocation_assignments ADD COLUMN IF NOT EXISTS performance_source VARCHAR(30) DEFAULT 'CALIBRATED';
ALTER TABLE operator_allocation_assignments ADD COLUMN IF NOT EXISTS standard_smv DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE operator_allocation_assignments ADD COLUMN IF NOT EXISTS effective_cycle_time_secs DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE operator_allocation_assignments ADD COLUMN IF NOT EXISTS operator_efficiency_percent DOUBLE PRECISION DEFAULT 80.0;
ALTER TABLE operator_allocation_assignments ADD COLUMN IF NOT EXISTS match_status VARCHAR(50) DEFAULT 'MATCH';
ALTER TABLE operator_allocation_assignments ADD COLUMN IF NOT EXISTS is_bottleneck BOOLEAN DEFAULT FALSE;
ALTER TABLE operator_allocation_assignments ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_oaa_run_id ON operator_allocation_assignments(allocation_run_id);
CREATE INDEX IF NOT EXISTS idx_oaa_line_id ON operator_allocation_assignments(line_id);
CREATE INDEX IF NOT EXISTS idx_oaa_operator_id ON operator_allocation_assignments(operator_id);

-- 4. Operator Allocation Bottlenecks (Station Bottlenecks & Actionable IE Recommendations)
CREATE TABLE IF NOT EXISTS operator_allocation_bottlenecks (
    id                          BIGSERIAL PRIMARY KEY,
    allocation_run_id           BIGINT NOT NULL REFERENCES operator_allocation_runs(id) ON DELETE CASCADE,
    line_id                     BIGINT NOT NULL REFERENCES sewing_lines(id) ON DELETE CASCADE,
    line_name                   VARCHAR(100) NOT NULL,
    station_index               INTEGER NOT NULL,
    station_code                VARCHAR(30) NOT NULL,
    operation_name              VARCHAR(150) NOT NULL,
    required_cycle_time_secs    DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    effective_cycle_time_secs   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    required_skill_level        INTEGER NOT NULL DEFAULT 3,
    assigned_operator_skill     INTEGER,
    required_machine_type       VARCHAR(100),
    bottleneck_reason           VARCHAR(255) NOT NULL,
    recommended_action          VARCHAR(255) NOT NULL,
    severity                    VARCHAR(30) NOT NULL DEFAULT 'MEDIUM' -- LOW, MEDIUM, HIGH, CRITICAL
        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oab_run_id ON operator_allocation_bottlenecks(allocation_run_id);

-- 5. Operator Allocation Scenarios (Alternative Multi-Line Strategy Proposals)
CREATE TABLE IF NOT EXISTS operator_allocation_scenarios (
    id                          BIGSERIAL PRIMARY KEY,
    allocation_run_id           BIGINT NOT NULL REFERENCES operator_allocation_runs(id) ON DELETE CASCADE,
    scenario_code               VARCHAR(50) NOT NULL, -- SCENARIO_A, SCENARIO_B, SCENARIO_C, SCENARIO_D
    scenario_title              VARCHAR(150) NOT NULL,
    scenario_description        TEXT NOT NULL,
    total_achievable_output     INTEGER NOT NULL DEFAULT 0,
    overall_efficiency          DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    assigned_manpower           INTEGER NOT NULL DEFAULT 0,
    unassigned_manpower         INTEGER NOT NULL DEFAULT 0,
    total_skill_gaps            INTEGER NOT NULL DEFAULT 0,
    total_machine_gaps          INTEGER NOT NULL DEFAULT 0,
    main_tradeoffs              TEXT,
    line_results_json           TEXT, -- JSON serialized line-wise outputs and efficiencies
    is_recommended              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oas_run_id ON operator_allocation_scenarios(allocation_run_id);

-- 6. Operator Allocation Audits (Floor Governance & Change Tracking)
CREATE TABLE IF NOT EXISTS operator_allocation_audits (
    id                          BIGSERIAL PRIMARY KEY,
    allocation_run_id           BIGINT NOT NULL REFERENCES operator_allocation_runs(id) ON DELETE CASCADE,
    action_type                 VARCHAR(50) NOT NULL -- OPTIMIZE, OVERRIDE, APPROVE, REJECT, APPLY, PIN_OPERATOR
        CHECK (action_type IN ('OPTIMIZE', 'OVERRIDE', 'APPROVE', 'REJECT', 'APPLY', 'PIN_OPERATOR')),
    performed_by                VARCHAR(100) NOT NULL,
    line_id                     BIGINT REFERENCES sewing_lines(id) ON DELETE SET NULL,
    station_code                VARCHAR(30),
    operator_id                 BIGINT REFERENCES operators(id) ON DELETE SET NULL,
    previous_value              TEXT,
    new_value                   TEXT,
    justification               TEXT,
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oaaud_run_id ON operator_allocation_audits(allocation_run_id);

-- 7. Seed Operator Machine Qualifications for standard garment machines
-- Machine types: Single Needle Lockstitch (SNLS), 4-Thread Overlock, Flatlock (Coverstitch),
-- Double Needle Lockstitch (DNLS), Feed-off-the-Arm, Buttonhole Machine, Button Sewing Machine, Bartack.
INSERT INTO operator_machine_qualifications (operator_id, machine_type, qualification_level, certified_since, experience_months, is_primary_qualification)
SELECT 
    o.id,
    m.machine_type,
    CASE 
        WHEN (o.id + m.lvl_offset) % 5 = 0 THEN 5
        WHEN (o.id + m.lvl_offset) % 5 = 1 THEN 4
        WHEN (o.id + m.lvl_offset) % 5 = 2 THEN 3
        WHEN (o.id + m.lvl_offset) % 5 = 3 THEN 2
        ELSE 4
    END AS qualification_level,
    CURRENT_DATE - INTERVAL '1 year',
    12 + CAST((o.id * 3) % 48 AS INTEGER),
    (m.lvl_offset = 0) AS is_primary_qualification
FROM operators o
CROSS JOIN (
    VALUES 
        ('Single Needle Lockstitch (SNLS)', 0),
        ('4-Thread Overlock (Safety Stitch)', 1),
        ('Flatlock / Coverstitch', 2),
        ('Double Needle Lockstitch (DNLS)', 3),
        ('Feed-off-the-Arm (Chainstitch)', 4),
        ('Automatic Buttonhole Machine', 2),
        ('Button Sewing Machine', 1),
        ('Electronic Bartack Machine', 3)
) AS m(machine_type, lvl_offset)
WHERE o.active = true
ON CONFLICT (operator_id, machine_type) DO NOTHING;
