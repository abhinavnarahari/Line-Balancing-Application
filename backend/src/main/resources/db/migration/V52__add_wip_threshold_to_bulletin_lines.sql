-- V52: Add WIP buffer queue threshold to bulletin_lines
ALTER TABLE bulletin_lines ADD COLUMN IF NOT EXISTS wip_threshold INT DEFAULT 20;
