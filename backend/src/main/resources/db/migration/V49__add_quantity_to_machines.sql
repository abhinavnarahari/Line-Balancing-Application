-- V49: Add quantity column to machines table for asset count tracking
ALTER TABLE machines ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
