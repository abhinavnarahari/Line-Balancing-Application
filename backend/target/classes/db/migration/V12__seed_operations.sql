-- V12: Seed operations
-- 18 standard sewing operations from Line balancing.xlsx (exact names preserved)

INSERT INTO operations (operation_code, name, description, sequence, active) VALUES
('OP-001', 'Shoulder Join',       'Join the front and back shoulder seams together',        1,  TRUE),
('OP-002', 'Neck Rib Attach',     'Attach the neck rib/ribbing to the neckline',            2,  TRUE),
('OP-003', 'Neck Top Stitch',     'Top stitch around the neck rib for a clean finish',      3,  TRUE),
('OP-004', 'Sleeve Attach Left',  'Attach the left sleeve to the armhole',                  4,  TRUE),
('OP-005', 'Sleeve Attach Right', 'Attach the right sleeve to the armhole',                 5,  TRUE),
('OP-006', 'Side Seam Close',     'Close the side seam from underarm to hem',               6,  TRUE),
('OP-007', 'Bottom Hem',          'Hem the bottom edge of the garment',                     7,  TRUE),
('OP-008', 'Sleeve Hem',          'Hem the sleeve cuff edge',                               8,  TRUE),
('OP-009', 'Label Attach',        'Attach the brand/care label inside the garment',         9,  TRUE),
('OP-010', 'Trim Check',          'Check and trim all visible loose threads',               10, TRUE),
('OP-011', 'Thread Trimming',     'Trim remaining thread tails across the garment',         11, TRUE),
('OP-012', 'Initial Inspection',  'First quality inspection of the sewn garment',           12, TRUE),
('OP-013', 'Spot Cleaning',       'Remove any stains or marks from the garment surface',   13, TRUE),
('OP-014', 'Final Measurement',   'Measure the garment against the size specification',    14, TRUE),
('OP-015', 'Final Inspection',    'Final quality check before packing',                    15, TRUE),
('OP-016', 'Folding',             'Fold the garment to the specified presentation format', 16, TRUE),
('OP-017', 'Poly Bag Packing',    'Insert the folded garment into a poly bag',             17, TRUE),
('OP-018', 'Carton Packing',      'Pack poly-bagged garments into export cartons',         18, TRUE);
