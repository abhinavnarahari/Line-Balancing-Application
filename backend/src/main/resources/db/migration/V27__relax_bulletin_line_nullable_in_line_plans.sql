-- V27: Allow bulletin_line_id to be nullable in line_plan_assignments
-- Enables flexible line plans directly from operation master

ALTER TABLE line_plan_assignments ALTER COLUMN bulletin_line_id DROP NOT NULL;