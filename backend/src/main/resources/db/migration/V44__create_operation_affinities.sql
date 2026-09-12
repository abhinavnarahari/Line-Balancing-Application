-- V44: Create operation_affinities table and seed standard garment manufacturing operational affinities
CREATE TABLE IF NOT EXISTS operation_affinities (
    id BIGSERIAL PRIMARY KEY,
    primary_operation_id BIGINT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    alternative_operation_id BIGINT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    affinity_level VARCHAR(30) NOT NULL DEFAULT 'DIRECT_SUBSTITUTE',
    efficiency_transfer_pct NUMERIC(5, 2) NOT NULL DEFAULT 90.00,
    rating_downgrade INTEGER NOT NULL DEFAULT 0,
    machine_compatible BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_primary_alt_operation UNIQUE (primary_operation_id, alternative_operation_id),
    CONSTRAINT chk_diff_operations CHECK (primary_operation_id <> alternative_operation_id)
);

CREATE INDEX IF NOT EXISTS idx_op_affinities_primary ON operation_affinities(primary_operation_id);
CREATE INDEX IF NOT EXISTS idx_op_affinities_alt ON operation_affinities(alternative_operation_id);

-- Seed realistic operational affinities across standard operations library
-- 1. Sleeve Attach Left <-> Sleeve Attach Right (Direct Substitute, 95% transfer, 0 rating downgrade)
INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'DIRECT_SUBSTITUTE', 95.00, 0, TRUE, 'Identical 4-Thread Overlock machine and curved armhole joining seam technique'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-004' AND o2.operation_code = 'OP-005'
ON CONFLICT DO NOTHING;

INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'DIRECT_SUBSTITUTE', 95.00, 0, TRUE, 'Identical 4-Thread Overlock machine and curved armhole joining seam technique'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-005' AND o2.operation_code = 'OP-004'
ON CONFLICT DO NOTHING;

-- 2. Bottom Hem <-> Sleeve Hem (Direct Substitute, 95% transfer, 0 rating downgrade)
INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'DIRECT_SUBSTITUTE', 95.00, 0, TRUE, 'Flatlock / Interlock circular hem folder operation'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-007' AND o2.operation_code = 'OP-008'
ON CONFLICT DO NOTHING;

INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'DIRECT_SUBSTITUTE', 95.00, 0, TRUE, 'Flatlock / Interlock circular hem folder operation'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-008' AND o2.operation_code = 'OP-007'
ON CONFLICT DO NOTHING;

-- 3. Shoulder Join <-> Side Seam Close (Similar Technique, 85% transfer, 1 star downgrade)
INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'SIMILAR_TECHNIQUE', 85.00, 1, TRUE, 'Both use 4-Thread Overlock joining seam, straight run'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-001' AND o2.operation_code = 'OP-006'
ON CONFLICT DO NOTHING;

INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'SIMILAR_TECHNIQUE', 85.00, 1, TRUE, 'Both use 4-Thread Overlock joining seam, straight run'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-006' AND o2.operation_code = 'OP-001'
ON CONFLICT DO NOTHING;

-- 4. Neck Rib Attach <-> Shoulder Join (Similar Technique, 80% transfer, 1 star downgrade)
INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'SIMILAR_TECHNIQUE', 80.00, 1, TRUE, 'Overlock elasticated rib insertion vs plain overlock seam'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-002' AND o2.operation_code = 'OP-001'
ON CONFLICT DO NOTHING;

-- 5. Neck Top Stitch <-> Label Attach (Similar Technique, 85% transfer, 1 star downgrade)
INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'SIMILAR_TECHNIQUE', 85.00, 1, TRUE, 'Single Needle Lockstitch precision edge guidance'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-003' AND o2.operation_code = 'OP-009'
ON CONFLICT DO NOTHING;

INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'SIMILAR_TECHNIQUE', 85.00, 1, TRUE, 'Single Needle Lockstitch precision edge guidance'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-009' AND o2.operation_code = 'OP-003'
ON CONFLICT DO NOTHING;

-- 6. Trim Check <-> Thread Trimming (Direct Substitute, 95% transfer, 0 rating downgrade)
INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'DIRECT_SUBSTITUTE', 95.00, 0, TRUE, 'Manual trim and clean workstation'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-010' AND o2.operation_code = 'OP-011'
ON CONFLICT DO NOTHING;

INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'DIRECT_SUBSTITUTE', 95.00, 0, TRUE, 'Manual trim and clean workstation'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-011' AND o2.operation_code = 'OP-010'
ON CONFLICT DO NOTHING;

-- 7. Initial Inspection <-> Final Inspection (Direct Substitute, 95% transfer, 0 rating downgrade)
INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'DIRECT_SUBSTITUTE', 95.00, 0, TRUE, 'Visual and measurement QC inspection bench'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-012' AND o2.operation_code = 'OP-015'
ON CONFLICT DO NOTHING;

INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'DIRECT_SUBSTITUTE', 95.00, 0, TRUE, 'Visual and measurement QC inspection bench'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-015' AND o2.operation_code = 'OP-012'
ON CONFLICT DO NOTHING;

-- 8. Folding <-> Poly Bag Packing (Similar Technique, 85% transfer, 1 star downgrade)
INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'SIMILAR_TECHNIQUE', 85.00, 1, TRUE, 'Garment finishing and presentation packing line'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-016' AND o2.operation_code = 'OP-017'
ON CONFLICT DO NOTHING;

-- 9. Poly Bag Packing <-> Carton Packing (Direct Substitute, 90% transfer, 0 rating downgrade)
INSERT INTO operation_affinities (primary_operation_id, alternative_operation_id, affinity_level, efficiency_transfer_pct, rating_downgrade, machine_compatible, notes)
SELECT o1.id, o2.id, 'DIRECT_SUBSTITUTE', 90.00, 0, TRUE, 'End-of-line packaging dispatch'
FROM operations o1, operations o2
WHERE o1.operation_code = 'OP-017' AND o2.operation_code = 'OP-018'
ON CONFLICT DO NOTHING;
