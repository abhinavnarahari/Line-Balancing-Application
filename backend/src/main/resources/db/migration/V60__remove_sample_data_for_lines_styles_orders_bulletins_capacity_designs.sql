-- V60: Remove Sample Data for Sewing Lines, Style Catalog, Production Orders, Operation Bulletins, Capacity Planning, and Line Designs
-- Keeps Core Masters intact (Operators, Operations & SMVs, Machines Inventory, Shifts, Sizes, and Skill Matrix).

-- 1. Purge Operator Allocation Runs & Scenarios
DELETE FROM operator_allocation_audits;
DELETE FROM operator_allocation_scenarios;
DELETE FROM operator_allocation_bottlenecks;
DELETE FROM operator_allocation_assignments;

DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operator_allocation_line_results') THEN 
        DELETE FROM operator_allocation_line_results; 
    END IF; 
END $$;

DELETE FROM operator_allocation_runs;

-- 2. Purge Line Designs, Workstations & Balances
DELETE FROM optimization_recommendations;
DELETE FROM operator_station_placements;
DELETE FROM balance_station_operations;
DELETE FROM balance_workstations;
DELETE FROM line_design_machines;
DELETE FROM line_designs;

-- 3. Purge Capacity Plans & Production Entries
DELETE FROM capacity_plans;
DELETE FROM hourly_production_entries;
DELETE FROM line_plan_assignments;
DELETE FROM line_plans;
DELETE FROM piece_production_logs;

-- 4. Purge Production Orders
DELETE FROM order_size_lines;
DELETE FROM orders;

-- 5. Purge Operation Bulletins & Lines
DELETE FROM bulletin_styles;
DELETE FROM bulletin_lines;
DELETE FROM operation_bulletins;

-- 6. Purge Styles Catalog
DELETE FROM styles;

-- 7. Purge Sewing Lines Master
DELETE FROM sewing_lines;

-- 8. Reset Auto-increment Sequences for Clean User Creation
ALTER SEQUENCE IF EXISTS styles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS operation_bulletins_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS sewing_lines_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS capacity_plans_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS line_designs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS line_plans_id_seq RESTART WITH 1;
