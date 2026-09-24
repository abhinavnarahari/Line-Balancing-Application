-- V53: Enhance Sewing Lines Master with Real-World Garment Industry Architecture
-- Supports line types (PBS, Modular Cell, UPS Hanger, Feeder), workstation sizing, floaters,
-- floor governance (Supervisor, IE, QC), operational status, and active style binding.

ALTER TABLE sewing_lines 
    ADD COLUMN IF NOT EXISTS line_type VARCHAR(40) NOT NULL DEFAULT 'PBS',
    ADD COLUMN IF NOT EXISTS workstation_count INTEGER NOT NULL DEFAULT 24,
    ADD COLUMN IF NOT EXISTS helper_count INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS operational_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS department VARCHAR(100) NOT NULL DEFAULT 'Sewing Floor',
    ADD COLUMN IF NOT EXISTS ie_in_charge VARCHAR(150),
    ADD COLUMN IF NOT EXISTS qc_inspector VARCHAR(150),
    ADD COLUMN IF NOT EXISTS current_style VARCHAR(100),
    ADD COLUMN IF NOT EXISTS current_bulletin VARCHAR(100),
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing LINE-01 with full industrial specs
UPDATE sewing_lines 
SET line_name = 'Line 01 - Main Polo & Knit Assembly',
    line_type = 'PBS',
    floor = 'Unit 1 - Floor 1 (Bay A)',
    department = 'Knit Assembly Floor',
    supervisor_name = 'Rahim Khan',
    ie_in_charge = 'Priya Sharma',
    qc_inspector = 'Naresh Soni',
    workstation_count = 26,
    operator_count = 22,
    helper_count = 2,
    machine_count = 24,
    working_hours = 8.00,
    capacity_per_day = 1200,
    target_efficiency_percent = 85.00,
    operational_status = 'ACTIVE',
    current_style = 'POLO-800 - Classic Pique Polo',
    current_bulletin = 'OB-POLO-800',
    notes = 'Equipped with pneumatic under-bed thread trimmers (UBT) and continuous edge feeders.'
WHERE line_code = 'LINE-01';

-- Insert comprehensive commercial sewing lines if not already present
INSERT INTO sewing_lines (
    line_code, line_name, line_type, floor, department, 
    supervisor_name, ie_in_charge, qc_inspector, 
    workstation_count, operator_count, helper_count, machine_count, 
    working_hours, capacity_per_day, target_efficiency_percent, 
    operational_status, current_style, current_bulletin, active, notes
) VALUES
(
    'LINE-02', 'Line 02 - Activewear Crewneck Cell', 'MODULAR_CELL', 'Unit 1 - Floor 1 (Bay B)', 'Knit Tops & Activewear',
    'Rajesh Patel', 'Priya Sharma', 'Naresh Soni',
    20, 16, 2, 18,
    8.00, 950, 88.00,
    'ACTIVE', 'TS-CREW-100 - Performance Crewneck', 'OB-CREW-100', true,
    'U-Shape lean modular cell with quick style changeover fixtures.'
),
(
    'LINE-03', 'Line 03 - Heavy Denim & Bottoms Line', 'PBS', 'Unit 1 - Floor 2 (Bay C)', 'Denim & Heavy Bottoms',
    'Suresh Nair', 'Amit Verma', 'Deepa Roy',
    34, 28, 3, 30,
    8.00, 850, 82.00,
    'CHANGEOVER', 'DNM-501 - Heavy 5-Pocket Denim', 'OB-DNM-501', true,
    'Heavy-duty chainstitch and twin-needle felled seam layout.'
),
(
    'LINE-04', 'Line 04 - Woven Formal Shirts UPS Hanger', 'UPS_HANGER', 'Unit 2 - Floor 1 (Bay D)', 'Woven Shirts Division',
    'Ananya Sen', 'Priya Sharma', 'Naresh Soni',
    38, 32, 3, 34,
    8.00, 1100, 86.50,
    'ACTIVE', 'SHIRT-OXF-01 - Oxford Button-Down', 'OB-SHIRT-01', true,
    'Computerized Eton/Unit Production overhead hanger routing system.'
),
(
    'LINE-05', 'Line 05 - Jackets & Technical Outerwear', 'HYBRID_LEAN', 'Unit 2 - Floor 2 (Bay E)', 'Outerwear & Specialty',
    'Mohammed Tariq', 'Amit Verma', 'Deepa Roy',
    28, 24, 2, 26,
    8.00, 600, 80.00,
    'IDLE', 'JK-ZIP-90 - Windbreaker Shell Jacket', 'OB-JK-90', true,
    'Specialized seam sealing hot-air welding and automatic pocket welters.'
),
(
    'LINE-06', 'Line 06 - Collar & Cuff Prep Feeder Cell', 'FEEDER_LINE', 'Unit 1 - Floor 1 (Prep Zone)', 'Pre-Assembly & Parts Prep',
    'Sunita Devi', 'Priya Sharma', 'Naresh Soni',
    14, 10, 1, 12,
    8.00, 1800, 90.00,
    'ACTIVE', 'Feeder for POLO-800 & SHIRT-01', 'OB-PREP-01', true,
    'High-speed dedicated collar pressing, fusing, and cuff run-stitch unit.'
)
ON CONFLICT (line_code) DO UPDATE SET
    line_name = EXCLUDED.line_name,
    line_type = EXCLUDED.line_type,
    floor = EXCLUDED.floor,
    department = EXCLUDED.department,
    supervisor_name = EXCLUDED.supervisor_name,
    ie_in_charge = EXCLUDED.ie_in_charge,
    qc_inspector = EXCLUDED.qc_inspector,
    workstation_count = EXCLUDED.workstation_count,
    operator_count = EXCLUDED.operator_count,
    helper_count = EXCLUDED.helper_count,
    machine_count = EXCLUDED.machine_count,
    capacity_per_day = EXCLUDED.capacity_per_day,
    target_efficiency_percent = EXCLUDED.target_efficiency_percent,
    operational_status = EXCLUDED.operational_status,
    current_style = EXCLUDED.current_style,
    current_bulletin = EXCLUDED.current_bulletin,
    notes = EXCLUDED.notes;
