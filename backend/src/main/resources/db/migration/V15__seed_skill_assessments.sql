-- V15: Seed some initial skill assessments for the matrix

INSERT INTO skill_assessments (operator_id, operation_id, rating, cycle_time_seconds, revision, effective_date, is_current, notes, created_at, updated_at)
VALUES
(1, 1, 4, 32, 1, '2026-06-01', true, 'Fast and precise.', NOW(), NOW()),
(1, 2, 3, 45, 1, '2026-06-01', true, 'Standard performance.', NOW(), NOW()),
(1, 3, 5, 20, 1, '2026-06-15', true, 'Expert level, very consistent.', NOW(), NOW()),

(2, 1, 2, 50, 1, '2026-07-01', true, 'Needs improvement on speed.', NOW(), NOW()),
(2, 4, 4, 38, 1, '2026-07-01', true, 'Good control.', NOW(), NOW()),

(3, 2, 5, 40, 1, '2026-07-10', true, 'Excellent work.', NOW(), NOW()),
(3, 3, 4, 25, 1, '2026-07-10', true, 'Solid performance.', NOW(), NOW()),
(3, 5, 3, 60, 1, '2026-07-10', true, 'Average speed.', NOW(), NOW()),

(4, 1, 3, 42, 1, '2026-08-01', true, NULL, NOW(), NOW()),
(4, 5, 4, 55, 1, '2026-08-01', true, NULL, NOW(), NOW()),
(4, 6, 5, 30, 1, '2026-08-01', true, 'Best in the line.', NOW(), NOW()),

(5, 7, 2, 45, 1, '2026-08-05', true, 'Training required.', NOW(), NOW()),
(5, 8, 3, 50, 1, '2026-08-05', true, NULL, NOW(), NOW()),

(6, 1, 4, 35, 1, '2026-08-10', true, NULL, NOW(), NOW()),
(6, 2, 4, 42, 1, '2026-08-10', true, NULL, NOW(), NOW()),
(6, 3, 4, 22, 1, '2026-08-10', true, NULL, NOW(), NOW())
ON CONFLICT (operator_id, operation_id) WHERE is_current = TRUE DO NOTHING;
