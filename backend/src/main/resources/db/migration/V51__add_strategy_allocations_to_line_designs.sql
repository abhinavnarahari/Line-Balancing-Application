-- V51: Add Strategy Allocations & Workstations JSON to Line Designs
ALTER TABLE line_designs ADD COLUMN IF NOT EXISTS strategy_name VARCHAR(50);
ALTER TABLE line_designs ADD COLUMN IF NOT EXISTS station_allocations TEXT;
ALTER TABLE line_designs ADD COLUMN IF NOT EXISTS workstations_json TEXT;
